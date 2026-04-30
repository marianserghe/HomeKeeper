// ============================================
// HOMEKEEPER - Yelp Fusion API Service
// ============================================

const YELP_API_KEY = process.env.EXPO_PUBLIC_YELP_API_KEY;
const YELP_BIZ_URL = 'https://api.yelp.com/v3/businesses';
const YELP_SEARCH_URL = 'https://api.yelp.com/v3/businesses/search';

export interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price?: string;
  photos?: string[];
  phone?: string;
  display_phone?: string;
  url?: string;
  website?: string;
  location?: {
    address1?: string;
    address2?: string;
    address3?: string;
    city?: string;
    state?: string;
    zip_code?: string;
    country?: string;
    display_address?: string[];
  };
  coordinates?: {
    latitude: number;
    longitude: number;
  };
  hours?: Array<{
    open: Array<{
      day: number;
      start: string;
      end: string;
    }>;
  }>;
}

export interface YelpSearchResult {
  total: number;
  businesses: YelpBusiness[];
}

// Search for business by name and location
export async function searchByNameAndLocation(
  name: string,
  latitude: number,
  longitude: number,
  radiusMiles: number = 10
): Promise<YelpBusiness | null> {
  const radiusMeters = Math.round(radiusMiles * 1609.34);
  const url = `${YELP_SEARCH_URL}?term=${encodeURIComponent(name)}&latitude=${latitude}&longitude=${longitude}&radius=${radiusMeters}&limit=3`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      // Yelp API blocks CORS from mobile apps - requires backend proxy
      // 403/401 = CORS blocked, 429 = rate limited
      if (response.status === 403 || response.status === 401) {
        console.warn('Yelp API CORS blocked - requires backend proxy');
      } else {
        console.error('Yelp search error:', response.status);
      }
      return null;
    }
    
    const data: YelpSearchResult = await response.json();
    
    if (data.businesses && data.businesses.length > 0) {
      // Return the first match (closest/best match)
      return data.businesses[0];
    }
    
    return null;
  } catch (error) {
    console.error('Yelp search error:', error);
    return null;
  }
}

// Fetch business details by Yelp ID
export async function getBusinessById(yelpId: string): Promise<YelpBusiness | null> {
  const url = `${YELP_BIZ_URL}/${yelpId}`;
  
  try {
    const response = await fetch(url, {
      headers: {
        'Authorization': `Bearer ${YELP_API_KEY}`,
      },
    });
    
    if (!response.ok) {
      console.error('Yelp API error:', response.status);
      return null;
    }
    
    const data: YelpBusiness = await response.json();
    return data;
  } catch (error) {
    console.error('Yelp fetch error:', error);
    return null;
  }
}

// Format rating for display
export function formatRating(rating: number): string {
  const fullStars = Math.floor(rating);
  const hasHalf = rating % 1 >= 0.5;
  return '⭐'.repeat(fullStars) + (hasHalf ? '½' : '');
}