// ============================================
// HOMEKEEPER - Yelp Fusion API Service
// ============================================

const YELP_API_KEY = '-NP80rN7xTAh67twUodS4cWxBYTYF2OAT-z0U-ZhzEC9MiXXIst4UJ5lrkEe63tnu-lJNP9nhV2AXAbmPnmnQMcPaEbB5Fl7dvLTQcZh3S5e3p8Ymjo1CmL9uTHiaXYx';
const YELP_BIZ_URL = 'https://api.yelp.com/v3/businesses';

export interface YelpBusiness {
  id: string;
  name: string;
  rating: number;
  review_count: number;
  price?: string;
  photos?: string[];
  hours?: Array<{
    open: Array<{
      day: number;
      start: string;
      end: string;
    }>;
  }>;
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