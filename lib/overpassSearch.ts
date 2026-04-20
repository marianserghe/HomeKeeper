// ============================================
// HOMEKEEPER - Overpass API Search Service
// ============================================
// Free POI search via OpenStreetMap data
// No API key required

export interface OverpassPlace {
  id: string;
  osmId: number;
  osmType: 'node' | 'way' | 'relation';
  name: string;
  lat: number;
  lng: number;
  distance?: number;
  tags: Record<string, string>;
}

// OSM tag mappings for contractor types
export const OSM_CRAFT_TAGS: Record<string, string[]> = {
  plumber: ['craft=plumber', 'shop=plumber'],
  electrician: ['craft=electrician', 'office=electrician'],
  hvac: ['craft= hvac', 'office= hvac', 'craft=hvac_technician'],
  landscaper: ['craft=gardener', 'craft=landscaper', 'office=landscaper'],
  cleaner: ['craft=cleaner', 'office=cleaning'],
  handyman: ['craft=handyman', 'craft=builder', 'office=contractor'],
  pest: ['craft=pest_control', 'office=pest_control'],
  roofer: ['craft=roofer', 'craft=roofing'],
  painter: ['craft=painter', 'craft=painter_decorator'],
  carpenter: ['craft=carpenter', 'craft=joiner'],
  locksmith: ['craft=locksmith'],
  mason: ['craft=mason', 'craft=stonemason'],
};

// Overpass API endpoints (try multiple for redundancy)
const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
  // 'https://maps.mail.ru/osm/tools/overpass/api/interpreter', // Russia - may be slow from US
];

// Track last used endpoint to round-robin
let lastEndpointIndex = 0;

// Build Overpass QL query for POI search
function buildQuery(
  tags: string[],
  lat: number,
  lng: number,
  radiusMeters: number,
  limit: number = 100
): string {
  // Build tag filters
  const tagFilters = tags.map(tag => {
    const [key, value] = tag.split('=');
    return `["${key}"="${value}"]`;
  });

  // Query: find nodes with matching tags within radius
  // Also search for ways (polygons) and relations
  const queries = tagFilters.map(filter => `
    node${filter}(around:${radiusMeters},${lat},${lng});
    way${filter}(around:${radiusMeters},${lat},${lng});
    relation${filter}(around:${radiusMeters},${lat},${lng});
  `).join('');

  return `
    [out:json][timeout:25];
    (
      ${queries}
    );
    out center ${limit};
  `;
}

// Calculate distance between two points (Haversine formula)
function calculateDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
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

// Search for places near a location
export async function searchNearbyOverpass(
  category: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<OverpassPlace[]> {
  const radiusMeters = radiusMiles * 1609.34;
  
  // Get tags for this category
  const tags = OSM_CRAFT_TAGS[category.toLowerCase()] || [];
  
  if (tags.length === 0) {
    console.warn('No OSM tags defined for category:', category);
    return [];
  }

  const query = buildQuery(tags, latitude, longitude, radiusMeters);
  
  // Try endpoints with failover
  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    const endpointIndex = (lastEndpointIndex + i) % OVERPASS_ENDPOINTS.length;
    const endpoint = OVERPASS_ENDPOINTS[endpointIndex];
    
    try {
      console.log(`Trying Overpass endpoint: ${endpoint}`);
      
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(query)}`,
      });

      if (!response.ok) {
        console.warn(`Overpass error ${response.status} from ${endpoint}`);
        continue;
      }

      const data = await response.json();
      
      // Update last used endpoint (round-robin)
      lastEndpointIndex = (endpointIndex + 1) % OVERPASS_ENDPOINTS.length;
      
      // Parse results
      const places: OverpassPlace[] = [];
      
      for (const element of data.elements || []) {
        // Get coordinates (ways/relations use 'center', nodes use direct lat/lng)
        const lat = element.lat || element.center?.lat;
        const lng = element.lon || element.center?.lon;
        
        if (!lat || !lng) continue;
        if (!element.tags?.name) continue; // Skip unnamed POIs
        
        const distance = calculateDistance(latitude, longitude, lat, lng);
        
        places.push({
          id: `osm_${element.type}_${element.id}`,
          osmId: element.id,
          osmType: element.type,
          name: element.tags.name,
          lat,
          lng,
          distance,
          tags: element.tags,
        });
      }

      // Sort by distance
      places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      
      console.log(`Overpass found ${places.length} results for ${category}`);
      return places;
      
    } catch (error) {
      console.warn(`Overpass fetch error from ${endpoint}:`, error);
      continue;
    }
  }

  console.error('All Overpass endpoints failed');
  return [];
}

// Search for any text query (fallback for custom searches)
export async function searchTextOverpass(
  query: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 50
): Promise<OverpassPlace[]> {
  const radiusMeters = radiusMiles * 1609.34;
  
  // Build a name search query
  const searchQuery = `
    [out:json][timeout:25];
    (
      node["name"~"${query}",i](around:${radiusMeters},${latitude},${longitude});
      way["name"~"${query}",i](around:${radiusMeters},${latitude},${longitude});
    );
    out center 100;
  `;

  // Try endpoints with failover
  for (let i = 0; i < OVERPASS_ENDPOINTS.length; i++) {
    const endpointIndex = (lastEndpointIndex + i) % OVERPASS_ENDPOINTS.length;
    const endpoint = OVERPASS_ENDPOINTS[endpointIndex];
    
    try {
      const response = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `data=${encodeURIComponent(searchQuery)}`,
      });

      if (!response.ok) continue;

      const data = await response.json();
      lastEndpointIndex = (endpointIndex + 1) % OVERPASS_ENDPOINTS.length;
      
      const places: OverpassPlace[] = [];
      
      for (const element of data.elements || []) {
        const lat = element.lat || element.center?.lat;
        const lng = element.lon || element.center?.lon;
        
        if (!lat || !lng) continue;
        if (!element.tags?.name) continue;
        
        const distance = calculateDistance(latitude, longitude, lat, lng);
        
        places.push({
          id: `osm_${element.type}_${element.id}`,
          osmId: element.id,
          osmType: element.type,
          name: element.tags.name,
          lat,
          lng,
          distance,
          tags: element.tags,
        });
      }

      places.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      return places;
      
    } catch (error) {
      console.warn(`Overpass text search error:`, error);
      continue;
    }
  }

  return [];
}

// Format distance for display
export function formatDistanceOverpass(meters: number): string {
  if (meters < 1609) {
    return `${Math.round(meters / 160.9) / 10} mi`;
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

// Format phone from OSM tags
export function formatPhoneOverpass(tags: Record<string, string>): string | undefined {
  const phone = tags.phone || tags['contact:phone'];
  if (!phone) return undefined;
  
  // OSM phones can be multiple separated by ;
  const firstPhone = phone.split(';')[0].trim();
  
  const cleaned = firstPhone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return firstPhone;
}

// Get website from OSM tags
export function getWebsiteOverpass(tags: Record<string, string>): string | undefined {
  return tags.website || tags['contact:website'] || tags.url;
}

// Get email from OSM tags
export function getEmailOverpass(tags: Record<string, string>): string | undefined {
  return tags.email || tags['contact:email'];
}

// Get address from OSM tags
export function getAddressOverpass(tags: Record<string, string>): string | undefined {
  const parts: string[] = [];
  
  if (tags['addr:housenumber'] && tags['addr:street']) {
    parts.push(`${tags['addr:housenumber']} ${tags['addr:street']}`);
  }
  if (tags['addr:city']) {
    parts.push(tags['addr:city']);
  }
  if (tags['addr:state']) {
    parts.push(tags['addr:state']);
  }
  if (tags['addr:postcode']) {
    parts.push(tags['addr:postcode']);
  }
  
  return parts.length > 0 ? parts.join(', ') : undefined;
}

// Convert OverpassPlace to HerePlace-like format for UI compatibility
export function toHerePlaceFormat(place: OverpassPlace): {
  id: string;
  title: string;
  address: { label: string };
  position: { lat: number; lng: number };
  distance?: number;
  contacts?: Array<{ phone?: Array<{ value: string }>; email?: Array<{ value: string }>; www?: Array<{ value: string }> }>;
} {
  const phone = formatPhoneOverpass(place.tags);
  const email = getEmailOverpass(place.tags);
  const website = getWebsiteOverpass(place.tags);
  const address = getAddressOverpass(place.tags);
  
  return {
    id: place.id,
    title: place.name,
    address: {
      label: address || `${place.lat.toFixed(4)}, ${place.lng.toFixed(4)}`,
    },
    position: {
      lat: place.lat,
      lng: place.lng,
    },
    distance: place.distance,
    contacts: phone || email || website ? [{
      phone: phone ? [{ value: phone.replace(/\D/g, '') }] : undefined,
      email: email ? [{ value: email }] : undefined,
      www: website ? [{ value: website }] : undefined,
    }] : undefined,
  };
}