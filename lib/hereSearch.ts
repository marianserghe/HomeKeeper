// ============================================
// HOMEKEEPER - HERE API Search Service
// ============================================

const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;
const DISCOVER_URL = 'https://discover.search.hereapi.com/v1/discover';
const BROWSE_URL = 'https://browse.search.hereapi.com/v1/browse';
const GEOCODE_URL = 'https://geocode.search.hereapi.com/v1/geocode';

export interface HerePlace {
  id: string;
  title: string;
  address: {
    label: string;
    street?: string;
    houseNumber?: string;
    city?: string;
    state?: string;
    postalCode?: string;
    countryCode?: string;
  };
  position: {
    lat: number;
    lng: number;
  };
  distance?: number;
  categories?: Array<{
    id: string;
    name: string;
    primary?: boolean;
  }>;
  contacts?: Array<{
    phone?: Array<{ value: string }>;
    email?: Array<{ value: string }>;
    www?: Array<{ value: string }>;
  }>;
  openingHours?: Array<{
    text?: string[];
    isOpen?: boolean;
  }>;
  references?: Array<{
    type?: string;
    supplier?: { name?: string; id?: string };
    id?: string;
  href?: string;
  }>;
}

interface DiscoverResponse {
  items: HerePlace[];
}

interface GeocodeResponse {
  items: Array<{
    position: { lat: number; lng: number };
    address: { label: string };
  }>;
}

// HERE category IDs for more precise searches
const HERE_CATEGORIES: Record<string, string[]> = {
  'handyman': ['700-7400-0118', '700-7400-0119'], // Handyman services
  'plumber': ['700-7400-0115'], // Plumbing
  'electrician': ['700-7400-0116'], // Electrical
  'hvac': ['700-7400-0117'], // HVAC
  'landscaper': ['700-7300-0108', '700-7300-0109'], // Landscaping, Lawn care
  'cleaner': ['700-7600-0102', '700-7600-0103'], // Cleaning services
  'pest': ['700-7400-0122'], // Pest control
  'roofer': ['700-7400-0123'], // Roofing
  'painter': ['700-7400-0120'], // Painting
};

// Search for places near a location
export async function searchNearby(
  query: string,
  latitude: number,
  longitude: number,
  radiusMeters: number = 16000 // Default 10 miles
): Promise<HerePlace[]> {
  const allResults: HerePlace[] = [];
  const seenIds = new Set<string>();
  
  // Calculate distance helper
  const calculateDistance = (lat: number, lng: number): number => {
    const R = 6371e3;
    const φ1 = latitude * Math.PI / 180;
    const φ2 = lat * Math.PI / 180;
    const Δφ = (lat - latitude) * Math.PI / 180;
    const Δλ = (lng - longitude) * Math.PI / 180;
    const a = Math.sin(Δφ/2) * Math.sin(Δφ/2) + Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ/2) * Math.sin(Δλ/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    return R * c;
  };
  
  // Add results helper (dedupe, calculate distance, filter quality)
  const addResults = (items: HerePlace[]) => {
    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        
        // Calculate distance if not provided
        if (!item.distance) {
          item.distance = calculateDistance(item.position.lat, item.position.lng);
        }
        
        // Filter: Must have at least a phone OR website (basic quality check)
        const hasPhone = item.contacts?.some(c => c.phone?.length);
        const hasWebsite = item.contacts?.some(c => c.www?.length);
        const hasAddress = item.address?.label;
        
        // Keep results that have contact info or are clearly businesses
        if (hasPhone || hasWebsite || hasAddress) {
          allResults.push(item);
        }
      }
    }
  };
  
  const queryLower = query.toLowerCase();
  const categoryIds = HERE_CATEGORIES[queryLower];
  
  // Strategy 1: Use BROWSE endpoint with category IDs (most precise)
  if (categoryIds && categoryIds.length > 0) {
    for (const catId of categoryIds) {
      const url = `${BROWSE_URL}?at=${latitude},${longitude}&radius=${radiusMeters}&categories=${catId}&apiKey=${HERE_API_KEY}&limit=50`;
      
      try {
        const response = await fetch(url);
        if (response.ok) {
          const data = await response.json();
          if (data.items) {
            addResults(data.items);
          }
        }
      } catch (e) {
        console.error('Browse error for category:', catId, e);
      }
    }
  }
  
  // Strategy 2: Use DISCOVER with targeted search terms (fallback/broader)
  const searchTerms: Record<string, string[]> = {
    'handyman': ['licensed handyman', 'home repair service', 'general contractor residential'],
    'plumber': ['licensed plumber', 'plumbing company', 'plumbing repair service'],
    'electrician': ['licensed electrician', 'electrical contractor', 'electrician service'],
    'hvac': ['hvac company', 'heating and cooling', 'air conditioning service'],
    'landscaper': ['landscaping company', 'lawn care service', 'landscape design'],
    'cleaner': ['house cleaning service', 'residential cleaning', 'maid service'],
    'pest': ['pest control service', 'exterminator', 'termite treatment'],
    'roofer': ['roofing company', 'roof repair service', 'licensed roofer'],
    'painter': ['house painting', 'painting contractor', 'residential painter'],
  };
  
  const terms = searchTerms[queryLower] || [query];
  
  for (const term of terms) {
    const url = `${DISCOVER_URL}?at=${latitude},${longitude}&radius=${radiusMeters}&q=${encodeURIComponent(term)}&apiKey=${HERE_API_KEY}&limit=30`;
    
    try {
      const response = await fetch(url);
      if (response.ok) {
        const data = await response.json();
        if (data.items) {
          addResults(data.items);
        }
      }
    } catch (e) {
      console.error('Search error for term:', term, e);
    }
  }
  
  // Sort by distance
  allResults.sort((a, b) => (a.distance || 0) - (b.distance || 0));
  
  console.log('HERE search results:', allResults.length, 'for query:', query);
  return allResults;
}

// Geocode an address to coordinates
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  // Add country filter for US addresses
  const isZip = /^\d{5}$/.test(address.trim());
  const query = isZip ? `${address.trim()}, USA` : address;
  
  const url = `${GEOCODE_URL}?q=${encodeURIComponent(query)}&apiKey=${HERE_API_KEY}&limit=1&in=countryCode:USA`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HERE geocode error: ${response.status}`);
    }
    const data: GeocodeResponse = await response.json();
    if (data.items && data.items.length > 0) {
      console.log('Geocoded:', query, '→', data.items[0].position, data.items[0].address?.label);
      return data.items[0].position;
    }
    console.log('No geocode results for:', query);
    return null;
  } catch (error) {
    console.error('HERE geocode error:', error);
    return null;
  }
}

// Category mapping for quick searches - optimized for HERE API category browse
export const PRO_CATEGORIES_HERE: Record<string, string> = {
  plumber: 'plumbing',
  electrician: 'electrician',
  hvac: 'hvac heating',
  landscaper: 'landscaping lawn',
  cleaner: 'cleaning',
  handyman: 'handyman contractor',
  pest: 'pest control',
  roofer: 'roofing',
  painter: 'painter',
};

// Format distance for display
export function formatDistance(meters: number): string {
  if (meters < 1609) {
    return `${Math.round(meters / 160.9) / 10} mi`;
  }
  const miles = meters / 1609.34;
  return `${miles.toFixed(1)} mi`;
}

// Format phone number for display
export function formatPhone(phone: string): string {
  const cleaned = phone.replace(/\D/g, '');
  if (cleaned.length === 11 && cleaned.startsWith('1')) {
    return `+1 (${cleaned.slice(1, 4)}) ${cleaned.slice(4, 7)}-${cleaned.slice(7)}`;
  }
  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }
  return phone;
}