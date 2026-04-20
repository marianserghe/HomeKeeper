/**
 * Climate-specific seasonal maintenance tips for HomeKeeper
 * 
 * Tips vary by climate zone to provide relevant maintenance advice
 * based on local weather patterns and seasonal concerns.
 */

import { ClimateZone } from './climateZone';

// Month index: 0=Jan, 1=Feb, ..., 11=Dec
type MonthTips = {
  title: string;
  tips: string[];
  icon: string;
  color: string;
};

type ZoneTips = Record<number, MonthTips>;

// ============================================================
// COLD NORTHERN (MN, ND, SD, MT, WY, ID, AK)
// Extreme winters, short summers, heavy snowfall
// ============================================================
const COLD_NORTHERN_TIPS: ZoneTips = {
  11: { // December
    title: 'Deep Winter Prep',
    tips: ['Check furnace filter weekly', 'Insulate exposed pipes', 'Test smoke & CO detectors', 'Clear snow from vents', 'Stock emergency supplies'],
    icon: 'snow',
    color: '#60A5FA',
  },
  0: { // January
    title: 'Peak Winter',
    tips: ['Monitor attic for ice dams', 'Check furnace efficiency', 'Inspect roof snow load', 'Test sump pump if thaw', 'Keep garage door closed'],
    icon: 'thermometer',
    color: '#60A5FA',
  },
  1: { // February
    title: 'Late Winter',
    tips: ['Plan spring projects', 'Check for cold air drafts', 'Service HVAC for spring', 'Inspect foundation for frost heave', 'Order seeds for garden'],
    icon: 'calendar',
    color: '#60A5FA',
  },
  2: { // March
    title: 'Thaw Season',
    tips: ['Watch for basement flooding', 'Inspect roof damage from snow', 'Clean gutters after thaw', 'Check outdoor faucets for damage', 'Schedule AC service'],
    icon: 'water',
    color: '#34D399',
  },
  3: { // April
    title: 'Mud Season',
    tips: ['Inspect foundation cracks', 'Clean window wells', 'Check driveway for frost damage', 'Rake lawn debris', 'Test sprinkler system'],
    icon: 'leaf',
    color: '#34D399',
  },
  4: { // May
    title: 'Spring Rush',
    tips: ['Service lawn mower', 'Aerate and seed lawn', 'Inspect deck for rot', 'Clean grill', 'Plant after last frost date'],
    icon: 'sunny',
    color: '#34D399',
  },
  5: { // June
    title: 'Short Summer',
    tips: ['Clean AC condenser unit', 'Seal deck if needed', 'Check window screens', 'Inspect roof for winter damage', 'Enjoy the brief warmth!'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  6: { // July
    title: 'Peak Summer',
    tips: ['Check for pests (mosquitoes)', 'Clean dryer vent', 'Water lawn deeply', 'Maintain AC efficiency', 'Inspect garage door'],
    icon: 'bug',
    color: '#FBBF24',
  },
  7: { // August
    title: 'Summer Wind-Down',
    tips: ['Order firewood for winter', 'Check attic insulation', 'Clean gutters', 'Schedule furnace tune-up', 'Start winter prep early'],
    icon: 'construct',
    color: '#FBBF24',
  },
  8: { // September
    title: 'Early Fall',
    tips: ['Drain outdoor faucets', 'Winterize sprinklers', 'Inspect chimney', 'Clean gutters', 'Check heating system'],
    icon: 'leaf',
    color: '#F97316',
  },
  9: { // October
    title: 'Fall Rush',
    tips: ['Winterize everything', 'Install storm windows', 'Inspect furnace', 'Seall all exterior gaps', 'Test generator'],
    icon: 'flame',
    color: '#F97316',
  },
  10: { // November
    title: 'Pre-Winter',
    tips: ['Final furnace check', 'Stock up on salt/sand', 'Test snow blower', 'Insulate pipes', 'Seal attic hatches'],
    icon: 'snow',
    color: '#F97316',
  },
};

// ============================================================
// NORTHEAST (NJ, NY, PA, MA, CT, etc.)
// Four distinct seasons, moderate winters, humid summers
// ============================================================
const NORTHEAST_TIPS: ZoneTips = {
  11: {
    title: 'Winter Prep',
    tips: ['Check furnace filter', 'Insulate pipes', 'Test smoke detectors', 'Clear gutters', 'Service snow blower'],
    icon: 'snow',
    color: '#60A5FA',
  },
  0: {
    title: 'January Maintenance',
    tips: ['Inspect attic for ice dams', 'Check furnace efficiency', 'Test carbon monoxide detectors', 'Monitor humidity levels'],
    icon: 'thermometer',
    color: '#60A5FA',
  },
  1: {
    title: 'February Tasks',
    tips: ['Plan spring projects', 'Check for drafts', 'Service HVAC system', 'Order garden supplies'],
    icon: 'calendar',
    color: '#60A5FA',
  },
  2: {
    title: 'Spring Cleaning',
    tips: ['Clean gutters', 'Inspect roof', 'Check outdoor faucets', 'Service AC unit', 'Fertilize lawn'],
    icon: 'leaf',
    color: '#34D399',
  },
  3: {
    title: 'April Showers',
    tips: ['Check sump pump', 'Inspect foundation cracks', 'Clean window screens', 'Plant early crops', 'Test irrigation'],
    icon: 'water',
    color: '#34D399',
  },
  4: {
    title: 'May Maintenance',
    tips: ['Service lawn mower', 'Inspect deck/patio', 'Check outdoor lighting', 'Clean grill', 'Plant garden'],
    icon: 'sunny',
    color: '#34D399',
  },
  5: {
    title: 'Summer Ready',
    tips: ['Check AC efficiency', 'Clean refrigerator coils', 'Inspect pool equipment', 'Seal driveway cracks', 'Mulch garden beds'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  6: {
    title: 'July Tasks',
    tips: ['Check for pests', 'Clean dryer vent', 'Inspect window seals', 'Water landscaping deeply', 'Check deck for rot'],
    icon: 'bug',
    color: '#FBBF24',
  },
  7: {
    title: 'August Prep',
    tips: ['Schedule fall maintenance', 'Check attic ventilation', 'Clean garbage disposal', 'Plan fall plantings', 'Order firewood'],
    icon: 'construct',
    color: '#FBBF24',
  },
  8: {
    title: 'Fall Prep',
    tips: ['Clean gutters', 'Check furnace', 'Seal exterior gaps', 'Test heating system', 'Inspect chimney'],
    icon: 'leaf',
    color: '#F97316',
  },
  9: {
    title: 'October Tasks',
    tips: ['Winterize outdoor faucets', 'Inspect chimney', 'Clean fireplace', 'Check insulation', 'Rake leaves'],
    icon: 'flame',
    color: '#F97316',
  },
  10: {
    title: 'November Prep',
    tips: ['Check heating system', 'Inspect roof for damage', 'Clean dryer vent', 'Stock up on winter supplies', 'Test generators'],
    icon: 'snow',
    color: '#F97316',
  },
};

// ============================================================
// SOUTHEAST (FL, GA, SC, NC, AL, MS, LA, TN)
// Hot humid summers, mild winters, hurricane risk, high moisture
// ============================================================
const SOUTHEAST_TIPS: ZoneTips = {
  11: {
    title: 'Mild Winter',
    tips: ['Service HVAC for heating', 'Check for mold in humid areas', 'Inspect roof for damage', 'Clean gutters', 'Test smoke detectors'],
    icon: 'thermometer',
    color: '#34D399',
  },
  0: {
    title: 'January Tasks',
    tips: ['Check AC ductwork', 'Inspect for termite activity', 'Clean humidifier/dehumidifier', 'Prune shrubs and trees', 'Plan spring garden'],
    icon: 'leaf',
    color: '#34D399',
  },
  1: {
    title: 'February Prep',
    tips: ['Start hurricane prep planning', 'Service generator', 'Check pool equipment', 'Inspect screens for tears', 'Fertilize lawn'],
    icon: 'construct',
    color: '#34D399',
  },
  2: {
    title: 'Spring Start',
    tips: ['Clean gutters', 'Inspect roof for storm damage', 'Check AC efficiency', 'Test irrigation system', 'Apply pre-emergent herbicide'],
    icon: 'sunny',
    color: '#34D399',
  },
  3: {
    title: 'April Tasks',
    tips: ['Inspect for pest infestations', 'Check AC refrigerant levels', 'Clean pool and spa', 'Trim overgrown plants', 'Inspect foundation settling'],
    icon: 'bug',
    color: '#FBBF24',
  },
  4: {
    title: 'May Heat Prep',
    tips: ['Service AC unit', 'Check attic ventilation', 'Clean dryer vent', 'Inspect pool pump', 'Prepare hurricane shutters'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  5: {
    title: 'Hurricane Season Start',
    tips: ['Test hurricane shutters', 'Trim trees near house', 'Clean gutters and drains', 'Check emergency supplies', 'Review evacuation plan'],
    icon: 'warning',
    color: '#EF4444',
  },
  6: {
    title: 'Peak Hurricane Season',
    tips: ['Monitor storm forecasts', 'Clear debris from yard', 'Check generator fuel', 'Inspect roof after storms', 'Maintain AC efficiency'],
    icon: 'warning',
    color: '#EF4444',
  },
  7: {
    title: 'Storm Watch',
    tips: ['Check for roof damage', 'Clean AC condenser', 'Inspect for water intrusion', 'Trim storm-damaged limbs', 'Check pool chemistry'],
    icon: 'cloud',
    color: '#FBBF24',
  },
  8: {
    title: 'Fall Start',
    tips: ['Clean gutters thoroughly', 'Inspect roof and chimney', 'Check AC after heavy use', 'Service pool for fall', 'Check for mold growth'],
    icon: 'leaf',
    color: '#F97316',
  },
  9: {
    title: 'October Relief',
    tips: ['Inspect for termite damage', 'Clean outdoor furniture', 'Check irrigation system', 'Aerate lawn', 'Plan winter garden'],
    icon: 'leaf',
    color: '#F97316',
  },
  10: {
    title: 'November Tasks',
    tips: ['Clean gutters before winter', 'Inspect AC for wear', 'Check window seals', 'Service HVAC for heating', 'Store outdoor cushions'],
    icon: 'construct',
    color: '#60A5FA',
  },
};

// ============================================================
// SOUTHWEST (AZ, TX, NM, NV)
// Extreme heat, dry climate, intense sun, dust, irrigation needs
// ============================================================
const SOUTHWEST_TIPS: ZoneTips = {
  11: {
    title: 'Mild Winter',
    tips: ['Check heating system', 'Inspect for rodent entry', 'Clean window tracks', 'Service pool heater', 'Check irrigation timers'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  0: {
    title: 'January Tasks',
    tips: ['Plan desert landscaping', 'Check drip irrigation', 'Inspect sun damage', 'Clean AC coils', 'Prune frost-damaged plants'],
    icon: 'leaf',
    color: '#34D399',
  },
  1: {
    title: 'February Prep',
    tips: ['Prepare for extreme heat', 'Check AC efficiency', 'Inspect roof for sun damage', 'Seal windows and doors', 'Plan water-efficient garden'],
    icon: 'construct',
    color: '#FBBF24',
  },
  2: {
    title: 'Spring Start',
    tips: ['Deep clean AC system', 'Check pool equipment', 'Inspect irrigation lines', 'Apply sunscreen to outdoor surfaces', 'Plant drought-tolerant species'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  3: {
    title: 'April Tasks',
    tips: ['Check stucco for cracks', 'Inspect roof coatings', 'Clean swamp cooler pads', 'Check window film', 'Adjust irrigation for warming'],
    icon: 'water',
    color: '#34D399',
  },
  4: {
    title: 'Pre-Heat Season',
    tips: ['Service AC unit urgently', 'Check attic insulation', 'Seal air leaks', 'Inspect ductwork', 'Test swamp cooler'],
    icon: 'thermometer',
    color: '#EF4444',
  },
  5: {
    title: 'Extreme Heat Prep',
    tips: ['Verify AC efficiency', 'Check pool pump timing', 'Inspect shade structures', 'Verify irrigation schedule', 'Stock emergency water'],
    icon: 'sunny',
    color: '#EF4444',
  },
  6: {
    title: 'Peak Heat',
    tips: ['Monitor AC performance daily', 'Check pool chemical balance', 'Inspect for sun damage', 'Water plants early morning', 'Check carport/shade structures'],
    icon: 'sunny',
    color: '#EF4444',
  },
  7: {
    title: 'Monsoon Season',
    tips: ['Check for flash flood zones', 'Inspect drainage', 'Clean gutters for sudden rain', 'Check roof for leaks', 'Monitor dust intrusion'],
    icon: 'cloud',
    color: '#60A5FA',
  },
  8: {
    title: 'Late Heat',
    tips: ['Continue AC maintenance', 'Check for monsoon damage', 'Inspect pool after storms', 'Check irrigation efficiency', 'Plan fall plantings'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  9: {
    title: 'Fall Relief',
    tips: ['Clean AC coils', 'Inspect roof and stucco', 'Check window seals', 'Adjust irrigation down', 'Plant fall vegetables'],
    icon: 'leaf',
    color: '#F97316',
  },
  10: {
    title: 'Mild Fall',
    tips: ['Plan winter garden', 'Service heating system', 'Check outdoor lighting', 'Clean outdoor furniture', 'Inspect for pest entry'],
    icon: 'leaf',
    color: '#F97316',
  },
};

// ============================================================
// PACIFIC NORTHWEST (WA, OR)
// Cool wet winters, mild summers, moisture management critical
// ============================================================
const PACIFIC_NORTHWEST_TIPS: ZoneTips = {
  11: {
    title: 'Rainy Season',
    tips: ['Check gutters daily', 'Inspect for leaks', 'Test sump pump', 'Monitor basement moisture', 'Clean drains'],
    icon: 'cloud',
    color: '#60A5FA',
  },
  0: {
    title: 'Peak Rain',
    tips: ['Inspect roof for leaks', 'Check foundation drainage', 'Monitor mold growth', 'Clean gutters frequently', 'Test attic ventilation'],
    icon: 'water',
    color: '#60A5FA',
  },
  1: {
    title: 'Late Rain',
    tips: ['Plan spring projects', 'Check for water damage', 'Inspect crawl space', 'Service HVAC for spring', 'Clean window tracks'],
    icon: 'cloud',
    color: '#60A5FA',
  },
  2: {
    title: 'Spring Transition',
    tips: ['Clean gutters and downspouts', 'Inspect roof for moss', 'Check foundation cracks', 'Fertilize lawn', 'Prune spring bloomers'],
    icon: 'leaf',
    color: '#34D399',
  },
  3: {
    title: 'April Showers',
    tips: ['Check for moss on roof', 'Inspect deck for rot', 'Clean window screens', 'Test irrigation system', 'Apply moss prevention'],
    icon: 'water',
    color: '#60A5FA',
  },
  4: {
    title: 'May Blooms',
    tips: ['Service lawn mower', 'Inspect deck/patio', 'Plant garden', 'Check outdoor lighting', 'Clean grill'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  5: {
    title: 'Dry Season Start',
    tips: ['Set up irrigation', 'Check AC if needed', 'Inspect outdoor furniture', 'Seal deck if needed', 'Clean windows'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  6: {
    title: 'Summer Peak',
    tips: ['Water lawn efficiently', 'Check for pests', 'Clean dryer vent', 'Maintain deck', 'Enjoy the sun!'],
    icon: 'sunny',
    color: '#FBBF24',
  },
  7: {
    title: 'Late Summer',
    tips: ['Plan fall maintenance', 'Check attic insulation', 'Clean gutters before fall', 'Service heating system', 'Order firewood'],
    icon: 'construct',
    color: '#F97316',
  },
  8: {
    title: 'Fall Return',
    tips: ['Clean gutters thoroughly', 'Check roof for moss', 'Inspect drainage', 'Rake falling leaves', 'Test sump pump'],
    icon: 'leaf',
    color: '#F97316',
  },
  9: {
    title: 'October Rain',
    tips: ['Check all seals', 'Inspect for mold', 'Clean chimney', 'Test heating system', 'Winterize outdoor faucets'],
    icon: 'cloud',
    color: '#60A5FA',
  },
  10: {
    title: 'Rain Season Prep',
    tips: ['Stock up on drainage supplies', 'Check basement waterproofing', 'Inspect crawlspace', 'Clean all gutters', 'Test sump pump backup'],
    icon: 'water',
    color: '#60A5FA',
  },
};

// ============================================================
// WEST COAST (CA)
// Mediterranean climate, fire risk, drought, earthquakes
// ============================================================
const WEST_COAST_TIPS: ZoneTips = {
  11: {
    title: 'Rainy Season',
    tips: ['Clean gutters', 'Check for leaks', 'Monitor landslide risk', 'Inspect foundation', 'Test sump pump if needed'],
    icon: 'cloud',
    color: '#60A5FA',
  },
  0: {
    title: 'Winter Tasks',
    tips: ['Check for storm damage', 'Inspect roof and gutters', 'Monitor hillside erosion', 'Service heating system', 'Prune frost-sensitive plants'],
    icon: 'water',
    color: '#60A5FA',
  },
  1: {
    title: 'Late Rain',
    tips: ['Plan spring garden', 'Check irrigation system', 'Inspect for water damage', 'Plan fire prevention', 'Order drought-tolerant plants'],
    icon: 'leaf',
    color: '#34D399',
  },
  2: {
    title: 'Spring Start',
    tips: ['Clean gutters', 'Inspect roof', 'Test irrigation', 'Check AC efficiency', 'Plant garden'],
    icon: 'sunny',
    color: '#34D399',
  },
  3: {
    title: 'April Tasks',
    tips: ['Create defensible space for fire', 'Clear brush 100ft from home', 'Inspect outdoor faucets', 'Check window screens', 'Service lawn equipment'],
    icon: 'leaf',
    color: '#34D399',
  },
  4: {
    title: 'Fire Prep Month',
    tips: ['Clear all dead vegetation', 'Trim trees away from house', 'Clean roof and gutters', 'Check emergency kit', 'Review evacuation plan'],
    icon: 'warning',
    color: '#EF4444',
  },
  5: {
    title: 'Fire Season Start',
    tips: ['Maintain defensible space', 'Check fire extinguishers', 'Clean AC filters', 'Inspect pool equipment', 'Test irrigation timers'],
    icon: 'flame',
    color: '#EF4444',
  },
  6: {
    title: 'Peak Fire Risk',
    tips: ['Monitor fire alerts', 'Keep brush cleared', 'Check emergency supplies', 'Review evacuation routes', 'Inspect insurance coverage'],
    icon: 'warning',
    color: '#EF4444',
  },
  7: {
    title: 'Late Fire Season',
    tips: ['Continue fire prevention', 'Check for drought stress', 'Water deeply but infrequently', 'Inspect pool chemistry', 'Plan fall plantings'],
    icon: 'flame',
    color: '#F97316',
  },
  8: {
    title: 'Fall Transition',
    tips: ['Clean gutters before rain', 'Inspect roof for damage', 'Check earthquake strap water heater', 'Service heating system', 'Plan winter garden'],
    icon: 'leaf',
    color: '#F97316',
  },
  9: {
    title: 'October Tasks',
    tips: ['Prepare for rain season', 'Clean all gutters', 'Check foundation drainage', 'Inspect chimney', 'Test sump pump'],
    icon: 'cloud',
    color: '#60A5FA',
  },
  10: {
    title: 'Rain Prep',
    tips: ['Final gutter cleaning', 'Inspect all seals', 'Check earthquake readiness', 'Service HVAC for heating', 'Stock emergency supplies'],
    icon: 'water',
    color: '#60A5FA',
  },
};

// ============================================================
// ZONE LOOKUP
// ============================================================
const ZONE_TIPS: Record<ClimateZone, ZoneTips> = {
  cold_northern: COLD_NORTHERN_TIPS,
  northeast: NORTHEAST_TIPS,
  southeast: SOUTHEAST_TIPS,
  southwest: SOUTHWEST_TIPS,
  pacific_northwest: PACIFIC_NORTHWEST_TIPS,
  west_coast: WEST_COAST_TIPS,
};

/**
 * Get seasonal tips for a specific zone and month
 */
export function getSeasonalTips(zone: ClimateZone, month: number): MonthTips {
  const tips = ZONE_TIPS[zone]?.[month];
  
  // Fallback to northeast if zone not found
  if (!tips) {
    return NORTHEAST_TIPS[month] || {
      title: 'Home Maintenance',
      tips: ['Check smoke detectors', 'Inspect HVAC system', 'Clean gutters'],
      icon: 'home',
      color: '#60A5FA',
    };
  }
  
  return tips;
}

/**
 * Export all zone tips for reference
 */
export const ALL_ZONE_TIPS = ZONE_TIPS;