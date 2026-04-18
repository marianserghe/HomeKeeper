// ============================================
// HOMEKEEPER - HERE API Search Service
// ============================================

const HERE_API_KEY = 'fOLsRJBzbQTclu5TbUbrgYA9xVwpclFzgKisf_meiJo';
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

// Search for places near a location
export async function searchNearby(
  query: string,
  latitude: number,
  longitude: number,
  radiusMeters: number = 16000 // Default 10 miles
): Promise<HerePlace[]> {
  const allResults: HerePlace[] = [];
  const seenIds = new Set<string>();
  
  // Add results helper (dedupe)
  const addResults = (items: HerePlace[]) => {
    for (const item of items) {
      if (!seenIds.has(item.id)) {
        seenIds.add(item.id);
        allResults.push(item);
      }
    }
  };
  
  // Try the base query first
  const baseUrl = `${DISCOVER_URL}?at=${latitude},${longitude}&radius=${radiusMeters}&q=${encodeURIComponent(query)}&apiKey=${HERE_API_KEY}&limit=50`;
  
  try {
    const response = await fetch(baseUrl);
    if (response.ok) {
      const data = await response.json();
      if (data.items) addResults(data.items);
    }
  } catch (e) {
    console.error('Search error:', e);
  }
  
  // If we didn't get many results, try a broader term
  if (allResults.length < 5) {
    const broaderTerms: Record<string, string> = {
      'electrician': 'electrical',
      'plumber': 'plumbing',
      'hvac': 'heating cooling',
      'landscaper': 'landscaping lawn',
      'cleaner': 'cleaning',
      'roofer': 'roofing contractor',
      'painter': 'painting',
    };
    
    const queryLower = query.toLowerCase();
    const broader = broaderTerms[queryLower];
    
    if (broader) {
      const broaderUrl = `${DISCOVER_URL}?at=${latitude},${longitude}&radius=${radiusMeters}&q=${encodeURIComponent(broader)}&apiKey=${HERE_API_KEY}&limit=50`;
      
      try {
        const response = await fetch(broaderUrl);
        if (response.ok) {
          const data = await response.json();
          if (data.items) addResults(data.items);
        }
      } catch (e) {
        console.error('Broader search error:', e);
      }
    }
  }
  
  console.log('HERE search results:', allResults.length, 'for query:', query);
  return allResults;
}

// Geocode an address to coordinates
export async function geocodeAddress(address: string): Promise<{ lat: number; lng: number } | null> {
  const url = `${GEOCODE_URL}?q=${encodeURIComponent(address)}&apiKey=${HERE_API_KEY}&limit=1`;
  
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`HERE geocode error: ${response.status}`);
    }
    const data: GeocodeResponse = await response.json();
    if (data.items && data.items.length > 0) {
      return data.items[0].position;
    }
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