/**
 * Climate Zone Detection for HomeKeeper
 * 
 * Zones based on climate patterns that affect home maintenance:
 * - Cold/Northern: Heavy winter, short summers
 * - Northeast: Four distinct seasons
 * - Southeast: Hot humid summers, mild winters, hurricane risk
 * - Southwest: Extreme heat, dry, intense sun
 * - Pacific Northwest: Cool, wet winters, mild summers
 * - West Coast: Mediterranean, fire risk, drought concerns
 */

export type ClimateZone = 
  | 'cold_northern'
  | 'northeast'
  | 'southeast'
  | 'southwest'
  | 'pacific_northwest'
  | 'west_coast';

export const CLIMATE_ZONE_NAMES: Record<ClimateZone, string> = {
  cold_northern: 'Cold Northern',
  northeast: 'Northeast',
  southeast: 'Southeast',
  southwest: 'Southwest',
  pacific_northwest: 'Pacific Northwest',
  west_coast: 'West Coast',
};

// State to zone mapping
const STATE_ZONES: Record<string, ClimateZone> = {
  // Cold Northern
  'AK': 'cold_northern',
  'MN': 'cold_northern',
  'ND': 'cold_northern',
  'SD': 'cold_northern',
  'MT': 'cold_northern',
  'WY': 'cold_northern',
  'ID': 'cold_northern',
  
  // Northeast
  'ME': 'northeast',
  'NH': 'northeast',
  'VT': 'northeast',
  'MA': 'northeast',
  'RI': 'northeast',
  'CT': 'northeast',
  'NY': 'northeast',
  'NJ': 'northeast',
  'PA': 'northeast',
  'MD': 'northeast',
  'DE': 'northeast',
  'VA': 'northeast',
  'WV': 'northeast',
  'MI': 'northeast',
  'WI': 'northeast',
  'IL': 'northeast',
  'IN': 'northeast',
  'OH': 'northeast',
  
  // Southeast
  'NC': 'southeast',
  'SC': 'southeast',
  'GA': 'southeast',
  'FL': 'southeast',
  'AL': 'southeast',
  'MS': 'southeast',
  'LA': 'southeast',
  'TN': 'southeast',
  'KY': 'southeast',
  'AR': 'southeast',
  
  // Southwest
  'TX': 'southwest',
  'OK': 'southwest',
  'NM': 'southwest',
  'AZ': 'southwest',
  'NV': 'southwest',
  'UT': 'southwest',
  
  // Pacific Northwest
  'WA': 'pacific_northwest',
  'OR': 'pacific_northwest',
  
  // West Coast
  'CA': 'west_coast',
  
  // Other (default to northeast)
  'CO': 'cold_northern',
  'KS': 'northeast',
  'NE': 'cold_northern',
  'MO': 'northeast',
  'IA': 'cold_northern',
  'HI': 'west_coast',
  'DC': 'northeast',
};

// ZIP code first digit to zone (rough approximation)
const ZIP_ZONE: Record<string, ClimateZone> = {
  '0': 'northeast', // MA, CT, RI, VT, NH, ME, NJ, PR
  '1': 'northeast', // NY, PA, DE, NJ
  '2': 'southeast', // VA, WV, MD, NC, SC, GA, FL
  '3': 'southeast', // AL, MS, TN, LA, AR, FL, GA
  '4': 'northeast', // OH, IN, KY, MI, TN
  '5': 'cold_northern', // IA, WI, MN, SD, ND, MT
  '6': 'southwest', // TX, OK, AR, LA
  '7': 'southwest', // TX, OK, AR, LA
  '8': 'southwest', // CO, WY, NM, AZ, UT, ID, NV
  '9': 'west_coast', // CA, WA, OR, AK, HI
};

/**
 * Detect climate zone from state code
 */
export function getZoneFromState(stateCode: string): ClimateZone {
  const normalized = stateCode.toUpperCase().trim();
  return STATE_ZONES[normalized] || 'northeast'; // Default to northeast
}

/**
 * Detect climate zone from ZIP code (first digit)
 */
export function getZoneFromZip(zipCode: string): ClimateZone {
  const firstDigit = zipCode.trim()[0];
  return ZIP_ZONE[firstDigit] || 'northeast';
}

/**
 * Detect climate zone from coordinates
 * Uses rough lat/lng boundaries for climate regions
 */
export function getZoneFromCoordinates(lat: number, lng: number): ClimateZone {
  // Pacific Northwest: WA, OR, Northern CA
  if (lat >= 42 && lat <= 49 && lng >= -125 && lng <= -116) {
    return 'pacific_northwest';
  }
  
  // West Coast: CA
  if (lat >= 32 && lat <= 42 && lng >= -125 && lng <= -114) {
    return 'west_coast';
  }
  
  // Southwest: AZ, NM, TX, NV
  if (lat >= 25 && lat <= 42 && lng >= -109 && lng <= -93) {
    return 'southwest';
  }
  
  // Southeast: FL, GA, AL, MS, LA, SC, NC, TN
  if (lat >= 25 && lat <= 40 && lng >= -95 && lng <= -75) {
    return 'southeast';
  }
  
  // Cold Northern: ND, SD, MN, WI, MI, MT, WY, ID
  if (lat >= 42 && lat <= 49 && lng >= -105 && lng <= -80) {
    return 'cold_northern';
  }
  
  // Northeast: Default for most of eastern US
  return 'northeast';
}

/**
 * Get climate zone from stored home info
 */
export function getZoneFromHomeInfo(homeInfo: { state?: string; zip?: string; lat?: number; lng?: number }): ClimateZone {
  // Priority: State > Coordinates > ZIP
  if (homeInfo.state) {
    return getZoneFromState(homeInfo.state);
  }
  
  if (homeInfo.lat !== undefined && homeInfo.lng !== undefined) {
    return getZoneFromCoordinates(homeInfo.lat, homeInfo.lng);
  }
  
  if (homeInfo.zip) {
    return getZoneFromZip(homeInfo.zip);
  }
  
  return 'northeast'; // Default
}