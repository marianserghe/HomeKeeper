// LocationIQ Nearby Search API
// Free: 5,000 requests/day, 2/second rate limit
// Data: OpenStreetMap (better contractor category matching)

const LOCATIONIQ_API_KEY = process.env.EXPO_PUBLIC_LOCATIONIQ_API_KEY || '';
const LOCATIONIQ_ENDPOINT = 'https://us1.locationiq.com/v1/nearby';

console.log('LocationIQ API Key loaded:', LOCATIONIQ_API_KEY ? 'YES' : 'NO');

export interface LocationIqPlace {
  place_id: string;
  osm_type: string;
  osm_id: string;
  lat: string;
  lon: string;
  name: string;
  display_name: string;
  class: string;
  type: string;
  tag_type: string;
  address?: {
    house_number?: string;
    road?: string;
    suburb?: string;
    city?: string;
    state?: string;
    postcode?: string;
    country?: string;
    country_code?: string;
  };
  distance?: number;
}

export interface SearchResult {
  id: string;
  name: string;
  address: string;
  lat: number;
  lng: number;
  distance: number;
  category: string;
  osmType: string;
  osmId: string;
}

// Convert LocationIQ result to our SearchResult format
function toSearchResult(place: LocationIqPlace, category: string): SearchResult {
  // Extract address components
  const parts: string[] = [];
  if (place.address?.house_number) parts.push(place.address.house_number);
  if (place.address?.road) parts.push(place.address.road);
  if (place.address?.city || place.address?.suburb) {
    parts.push(place.address.city || place.address.suburb || '');
  }
  if (place.address?.state) parts.push(place.address.state);
  if (place.address?.postcode) parts.push(place.address.postcode);

  const address = parts.length > 0 ? parts.join(', ') : place.display_name;

  return {
    id: place.place_id,
    name: place.name || 'Unknown',
    address,
    lat: parseFloat(place.lat),
    lng: parseFloat(place.lon),
    distance: place.distance || 0,
    category,
    osmType: place.osm_type,
    osmId: place.osm_id,
  };
}

// Search for places by OSM category tags
export async function searchByCategory(
  category: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<SearchResult[]> {
  const radiusMeters = Math.min(radiusMiles * 1609.34, 30000); // LocationIQ max 30km
  
  // LocationIQ doesn't support OSM craft tags well - use text search instead
  const searchTerms: Record<string, string[]> = {
    plumber: ['plumber', 'plumbing'],
    electrician: ['electrician', 'electrical'],
    hvac: ['hvac', 'heating', 'air conditioning'],
    landscaper: ['landscaping', 'landscaper', 'lawn care'],
    handyman: ['handyman', 'home repair', 'contractor'],
    cleaner: ['cleaning service', 'house cleaning', 'maid service'],
    pest: ['pest control', 'exterminator'],
    roofer: ['roofer', 'roofing'],
    painter: ['painter', 'painting', 'house painter'],
    carpenter: ['carpenter', 'woodworking'],
    locksmith: ['locksmith', 'lock repair'],
    contractor: ['general contractor', 'contractor', 'home improvement'],
  };
  
  const terms = searchTerms[category.toLowerCase()] || [category];
  
  if (terms.length === 0) {
    console.warn('No search terms for category:', category);
    return [];
  }

  console.log('LocationIQ search:', category, 'terms:', terms);
  
  const results: SearchResult[] = [];
  
  // Try text-based autocomplete search (LocationIQ's main search endpoint)
  for (const term of terms) {
    try {
      // Use autocomplete endpoint which works better for business search
      const url = `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(term)}&lat=${latitude}&lon=${longitude}&radius=${Math.round(radiusMeters / 1000)}&limit=10&format=json`;
      console.log('Fetching:', url.replace(LOCATIONIQ_API_KEY, 'HIDDEN'));
      
      const response = await fetch(url);
      
      if (!response.ok) {
        console.warn(`LocationIQ error ${response.status} for term ${term}`);
        const errorText = await response.text();
        console.warn('Error response:', errorText);
        continue;
      }

      const data: LocationIqPlace[] = await response.json();
      console.log('LocationIQ response for', term, ':', data.length, 'results');
      
      // Convert and add to results (avoid duplicates by place_id)
      for (const place of data) {
        if (!results.find(r => r.id === place.place_id)) {
          const distance = calculateDistance(latitude, longitude, parseFloat(place.lat), parseFloat(place.lon));
          const result = toSearchResult(place, category);
          result.distance = distance;
          results.push(result);
        }
      }
      
      // Rate limit: 2 requests/second
      await new Promise(resolve => setTimeout(resolve, 550));
      
    } catch (error) {
      console.warn(`LocationIQ failed for term ${term}:`, error);
    }
  }

  // Sort by distance
  results.sort((a, b) => a.distance - b.distance);
  console.log('LocationIQ total results:', results.length);
  
  return results;
}

// Text-based search (for custom queries)
export async function searchText(
  query: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<SearchResult[]> {
  const radiusMeters = Math.min(radiusMiles * 1609.34, 30000);
  
  try {
    // LocationIQ doesn't have a direct text search in Nearby API
    // Use Nominatim-style search with bounded viewbox
    const url = `https://us1.locationiq.com/v1/autocomplete?key=${LOCATIONIQ_API_KEY}&q=${encodeURIComponent(query)}&lat=${latitude}&lon=${longitude}&radius=${Math.round(radiusMeters / 1000)}&limit=20`;
    
    const response = await fetch(url);
    
    if (!response.ok) {
      console.warn(`LocationIQ text search error ${response.status}`);
      return [];
    }

    const data: LocationIqPlace[] = await response.json();
    
    // Calculate distance and convert
    return data.map(place => {
      const distance = calculateDistance(latitude, longitude, parseFloat(place.lat), parseFloat(place.lon));
      const result = toSearchResult(place, 'search');
      result.distance = distance;
      return result;
    }).sort((a, b) => a.distance - b.distance);
    
  } catch (error) {
    console.warn('LocationIQ text search failed:', error);
    return [];
  }
}

// Calculate distance using Haversine formula
function calculateDistance(lat1: number, lng1: number, lat2: number, lng2: number): number {
  const R = 6371000; // Earth's radius in meters
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLng = ((lng2 - lng1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLng / 2) *
      Math.sin(dLng / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

// Format distance for display
export function formatDistanceMeters(meters: number): string {
  const miles = meters / 1609.34;
  if (miles < 0.1) {
    return `${Math.round(miles * 5280)} ft`;
  }
  return `${miles.toFixed(1)} mi`;
}