// ============================================
// HOMEKEEPER - Zestimate Service (Apify Zillow Scraper)
// ============================================

// Apify API configuration
const APIFY_API_KEY = process.env.EXPO_PUBLIC_APIFY_API_KEY;
const APIFY_ACTOR_ID = 'axesso_data~zillow-search-by-address-scraper'; // Search by address
const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;

// Address autocomplete result
export interface AddressSuggestion {
  label: string;
  street?: string;
  city?: string;
  state?: string;
  postalCode?: string;
  country?: string;
}

// Property input for Zestimate lookup
export interface PropertyInput {
  address: string;
  city: string;
  state: string;
  zip?: string;
}

/**
 * Get address suggestions using HERE Geocoding API
 */
export async function autocompleteAddress(query: string): Promise<AddressSuggestion[]> {
  if (!query || query.length < 3) return [];
  
  // Check if API key is available
  if (!HERE_API_KEY) {
    console.error('HERE_API_KEY is not set in environment variables');
    return [];
  }
  
  try {
    // Filter to US addresses only for better results
    const url = `https://autocomplete.search.hereapi.com/v1/autocomplete?` +
      `q=${encodeURIComponent(query)}` +
      `&limit=5` +
      `&in=countryCode:USA` +
      `&apikey=${HERE_API_KEY}`;
    
    console.log('Fetching autocomplete for:', query);
    const res = await fetch(url);
    const data = await res.json();
    
    console.log('HERE API response:', JSON.stringify(data).slice(0, 500));
    
    if (!data.items) return [];
    
    const results = data.items.map((item: any) => ({
      label: item.address.label,
      // Combine house number + street for full address
      street: item.address.houseNumber && item.address.street 
        ? `${item.address.houseNumber} ${item.address.street}`
        : item.address.street,
      city: item.address.city,
      state: item.address.stateCode || item.address.state, // Use stateCode (CA) not state (California)
      postalCode: item.address.postalCode,
      country: item.address.countryCode,
    }));
    
    console.log('Parsed suggestions:', JSON.stringify(results));
    return results;
  } catch (error) {
    console.error('Address autocomplete error:', error);
    return [];
  }
}

interface ZillowPropertyData {
  address?: {
    streetAddress: string;
    city: string;
    state: string;
    zipcode: string;
  } | string;
  streetAddress?: string;
  zpid: number;
  zestimate?: number;
  price?: number;
  rentZestimate?: number;
  bedrooms?: number;
  bathrooms?: number;
  livingArea?: number;
  yearBuilt?: number;
  homeType?: string;
  homeStatus?: string;
  priceHistory?: Array<{
    date: string;
    event: string;
    price: number;
  }>;
  photos?: Array<{ mixedSources?: { jpeg?: Array<{ url: string }> } }>;
  statusCode?: number;
  statusMessage?: string;
  // Fields from detail scraper
  detailUrl?: string;
  hdpData?: {
    homeInfo?: {
      zestimate?: number;
      rentZestimate?: number;
      price?: number;
    };
  };
  resoFacts?: any;
}

interface ApifyRunResult {
  zpid: string;
  zestimate: number | null;
  rentZestimate: number | null;
  price: number | null;
  zillowUrl: string;
  lastUpdated: string;
  confidence: 'high' | 'medium' | 'low';
  matchedAddress?: string;
  error?: string;
  // Property details
  bedrooms?: number;
  bathrooms?: number;
  squareFeet?: number;
  yearBuilt?: number;
  homeType?: string;
}

/**
 * Fetch Zestimate by searching for an address on Zillow
 * Uses Apify's Zillow Search by Address Scraper
 */
export async function fetchZestimate(property: PropertyInput): Promise<ApifyRunResult | null> {
  if (!APIFY_API_KEY) {
    console.warn('APIFY_API_KEY not configured. Zestimate fetching disabled.');
    return null;
  }

  try {
    // Build the full address
    const fullAddress = `${property.address}, ${property.city}, ${property.state} ${property.zip || ''}`.trim();
    
    console.log('Searching for property:', fullAddress);

    // Check if Apify API key is valid (must start with 'apify_api_')
    if (!APIFY_API_KEY || !APIFY_API_KEY.startsWith('apify_api_')) {
      console.warn('Invalid Apify API key format');
      return {
        zpid: '',
        zestimate: null,
        rentZestimate: null,
        price: null,
        zillowUrl: '',
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
        error: 'Zestimate requires valid API key',
      };
    }

    // Start the Apify actor with address search
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${APIFY_ACTOR_ID}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          input: [{ address: fullAddress }]
        }),
      }
    );

    if (!runResponse.ok) {
      const errorText = await runResponse.text();
      console.error('Apify run failed:', runResponse.status, errorText);
      throw new Error(`Apify run failed: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      throw new Error('No dataset ID returned from Apify');
    }

    // Poll for results (with timeout)
    const result = await pollForResults(datasetId, 60000);

    if (!result || result.length === 0) {
      return {
        zpid: '',
        zestimate: null,
        rentZestimate: null,
        price: null,
        zillowUrl: '',
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
        error: 'No results found',
      };
    }

    const propertyData = result[0];
    
    console.log('=== ZILLOW API RESPONSE ===');
    console.log('Full response:', JSON.stringify(propertyData, null, 2));

    // Check for invalid address
    if (propertyData.statusMessage === 'Invalid address' || propertyData.statusCode !== 200) {
      return {
        zpid: '',
        zestimate: null,
        rentZestimate: null,
        price: null,
        zillowUrl: '',
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
        error: 'Property not found on Zillow. Try pasting a Zillow URL manually.',
      };
    }

    // Build Zillow URL from zpid
    const zillowUrl = `https://www.zillow.com/homedetails/${propertyData.zpid}_zpid/`;

    // Extract address - can be object or string
    let matchedAddress = fullAddress;
    if (typeof propertyData.address === 'object' && propertyData.address?.streetAddress) {
      matchedAddress = `${propertyData.address.streetAddress}, ${propertyData.address.city}, ${propertyData.address.state} ${propertyData.address.zipcode}`;
    } else if (typeof propertyData.address === 'string') {
      matchedAddress = propertyData.address;
    }

    // Check if we got a zestimate - if not, try the detail scraper for fuller data
    let zestimateValue = propertyData.zestimate || null;
    let priceValue = propertyData.price || null;
    let rentZestimateValue = propertyData.rentZestimate || null;
    let bedroomsValue = propertyData.bedrooms;
    let bathroomsValue = propertyData.bathrooms;
    let squareFeetValue = propertyData.livingArea;
    let yearBuiltValue = propertyData.yearBuilt;

    // Always try the detail scraper for fuller data (search-by-address is often incomplete)
    console.log('=== TRYING DETAIL SCRAPER FOR FULLER DATA ===');
    try {
      const detailResult = await fetchZestimateFromUrl(zillowUrl);
      if (detailResult) {
        console.log('Detail scraper result:', JSON.stringify(detailResult, null, 2));
        // Use detail scraper values if they're more complete
        if (detailResult.zestimate) zestimateValue = detailResult.zestimate;
        if (detailResult.price) priceValue = detailResult.price;
        if (detailResult.rentZestimate) rentZestimateValue = detailResult.rentZestimate;
        if (detailResult.bedrooms) bedroomsValue = detailResult.bedrooms;
        if (detailResult.bathrooms) bathroomsValue = detailResult.bathrooms;
        if (detailResult.squareFeet) squareFeetValue = detailResult.squareFeet;
        if (detailResult.yearBuilt) yearBuiltValue = detailResult.yearBuilt;
      }
    } catch (detailError) {
      console.log('Detail scraper failed, using search results:', detailError);
    }

    return {
      zpid: String(propertyData.zpid),
      zestimate: zestimateValue,
      rentZestimate: rentZestimateValue,
      price: priceValue,
      zillowUrl,
      lastUpdated: new Date().toISOString(),
      confidence: 'high',
      matchedAddress,
      // Property details
      bedrooms: bedroomsValue,
      bathrooms: bathroomsValue,
      squareFeet: squareFeetValue,
      yearBuilt: yearBuiltValue,
      homeType: propertyData.homeType,
    };
  } catch (error) {
    console.error('Error fetching Zestimate:', error);
    return null;
  }
}

/**
 * Fetch Zestimate using a direct Zillow property URL
 * This is a fallback for properties not found by address search
 */
export async function fetchZestimateFromUrl(zillowUrl: string): Promise<ApifyRunResult | null> {
  if (!APIFY_API_KEY) {
    console.warn('APIFY_API_KEY not configured. Zestimate fetching disabled.');
    return null;
  }

  if (!zillowUrl || !zillowUrl.includes('zillow.com')) {
    console.error('Invalid Zillow URL');
    return null;
  }

  try {
    // Extract ZPID from URL
    const zpidMatch = zillowUrl.match(/(\d+)_zpid/);
    if (!zpidMatch) {
      throw new Error('Could not find ZPID in URL');
    }

    const zpid = zpidMatch[1];
    console.log('Extracted ZPID:', zpid);

    // Use the detail scraper with the direct URL
    const detailActorId = 'maxcopell~zillow-detail-scraper';
    
    const runResponse = await fetch(
      `https://api.apify.com/v2/acts/${detailActorId}/runs?token=${APIFY_API_KEY}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          propertyUrls: [zillowUrl],
        }),
      }
    );

    if (!runResponse.ok) {
      throw new Error(`Apify run failed: ${runResponse.statusText}`);
    }

    const runData = await runResponse.json();
    const datasetId = runData.data?.defaultDatasetId;

    if (!datasetId) {
      throw new Error('No dataset ID returned from Apify');
    }

    // Poll for results
    const result = await pollForResults(datasetId, 60000);

    if (!result || result.length === 0) {
      return {
        zpid: zpid,
        zestimate: null,
        rentZestimate: null,
        price: null,
        zillowUrl: zillowUrl,
        lastUpdated: new Date().toISOString(),
        confidence: 'low',
        error: 'No data found at this URL',
      };
    }

    const property = result[0];

    // Extract address - can be object or string
    let matchedAddress = '';
    if (typeof property.address === 'string') {
      matchedAddress = property.address;
    } else if (property.address) {
      matchedAddress = `${property.address.streetAddress}, ${property.address.city}, ${property.address.state} ${property.address.zipcode}`;
    } else if (property.streetAddress) {
      matchedAddress = property.streetAddress;
    }

    return {
      zpid: zpid,
      zestimate: property.zestimate || property.hdpData?.homeInfo?.zestimate || null,
      rentZestimate: property.rentZestimate || property.hdpData?.homeInfo?.rentZestimate || null,
      price: property.price || property.hdpData?.homeInfo?.price || null,
      zillowUrl: property.detailUrl || zillowUrl,
      lastUpdated: new Date().toISOString(),
      confidence: 'high',
      matchedAddress,
      // Property details
      bedrooms: property.bedrooms,
      bathrooms: property.bathrooms,
      squareFeet: property.livingArea,
      yearBuilt: property.yearBuilt,
    };
  } catch (error) {
    console.error('Error fetching Zestimate from URL:', error);
    return null;
  }
}

/**
 * Validate a Zillow URL
 */
export function isValidZillowUrl(url: string): boolean {
  if (!url) return false;
  const normalized = url.toLowerCase();
  return normalized.includes('zillow.com') && normalized.includes('/homedetails/');
}

/**
 * Poll Apify dataset for results
 */
async function pollForResults(datasetId: string, timeoutMs: number): Promise<ZillowPropertyData[]> {
  const startTime = Date.now();
  const pollInterval = 2000; // 2 seconds

  while (Date.now() - startTime < timeoutMs) {
    try {
      const response = await fetch(
        `https://api.apify.com/v2/datasets/${datasetId}/items?token=${APIFY_API_KEY}`
      );

      if (response.ok) {
        const data = await response.json();
        if (data && data.length > 0) {
          return data;
        }
      }

      // Wait before polling again
      await new Promise(resolve => setTimeout(resolve, pollInterval));
    } catch (error) {
      console.error('Error polling for results:', error);
    }
  }

  return [];
}

export function formatZestimate(value: number | null | undefined): string {
  if (!value) return 'N/A';
  
  if (value >= 1000000) {
    return `$${(value / 1000000).toFixed(2)}M`;
  }
  return `$${value.toLocaleString()}`;
}

/**
 * Get Zestimate change indicator
 */
export function getZestimateChange(currentValue: number, previousValue?: number): {
  change: number;
  percent: number;
  direction: 'up' | 'down' | 'flat';
} | null {
  if (!previousValue) return null;
  
  const change = currentValue - previousValue;
  const percent = (change / previousValue) * 100;
  
  return {
    change,
    percent: Math.abs(percent),
    direction: change > 0 ? 'up' : change < 0 ? 'down' : 'flat',
  };
}

/**
 * Check if Zestimate needs refresh (older than 30 days)
 */
export function needsRefresh(zestimateDate?: string): boolean {
  if (!zestimateDate) return true;
  
  const date = new Date(zestimateDate);
  const now = new Date();
  const daysSinceUpdate = (now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24);
  
  return daysSinceUpdate > 30;
}

/**
 * Get days since last Zestimate update
 */
export function getDaysSinceUpdate(zestimateDate?: string): number | null {
  if (!zestimateDate) return null;
  
  const date = new Date(zestimateDate);
  const now = new Date();
  return Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
}