// ============================================
// HOMEKEEPER - Weather Service
// ============================================

// Open-Meteo API (free, no API key required)
// https://open-meteo.com/en/docs

import AsyncStorage from '@react-native-async-storage/async-storage';

const CACHE_KEY = '@homekeeper_weather_cache';
const GEOCACHE_KEY = '@homekeeper_geocode_cache';
const CACHE_DURATION_MS = 3 * 60 * 60 * 1000; // 3 hours
const GEOCACHE_DURATION_MS = 30 * 24 * 60 * 60 * 1000; // 30 days (addresses don't change)

// HERE Geocoding API key (from MEMORY.md)
const HERE_API_KEY = process.env.EXPO_PUBLIC_HERE_API_KEY;

export interface WeatherData {
  temp: number;
  condition: WeatherCondition;
  description: string;
  icon: string;
  precipitationChance: number;
  windSpeed: number;
  isDay: boolean;
  hourly: HourlyForecast[];
  daily: DailyForecast[];
  alerts: WeatherAlert[];
  fetchedAt: number;
}

export interface HourlyForecast {
  hour: number; // 0-23
  temp: number;
  condition: WeatherCondition;
  precipitationChance: number;
}

export interface DailyForecast {
  date: string; // YYYY-MM-DD
  tempHigh: number;
  tempLow: number;
  condition: WeatherCondition;
  precipitationChance: number;
}

export interface WeatherAlert {
  type: 'freeze' | 'heat' | 'storm' | 'rain' | 'wind';
  severity: 'low' | 'medium' | 'high';
  message: string;
}

export type WeatherCondition = 
  | 'clear'
  | 'partly_cloudy'
  | 'cloudy'
  | 'fog'
  | 'drizzle'
  | 'rain'
  | 'heavy_rain'
  | 'snow'
  | 'heavy_snow'
  | 'thunderstorm';

interface OpenMeteoResponse {
  current: {
    temperature_2m: number;
    weather_code: number;
    is_day: number;
    precipitation_probability: number;
    wind_speed_10m: number;
  };
  hourly: {
    temperature_2m: number[];
    weather_code: number[];
    precipitation_probability: number[];
  };
  daily: {
    temperature_2m_max: number[];
    temperature_2m_min: number[];
    weather_code: number[];
    precipitation_probability_max: number[];
  };
}

// Map WMO weather codes to our conditions
function mapWeatherCode(code: number): WeatherCondition {
  // WMO codes: https://open-meteo.com/en/docs
  if (code === 0) return 'clear';
  if (code <= 3) return 'partly_cloudy';
  if (code <= 48) return 'cloudy';
  if (code <= 57) return 'drizzle';
  if (code <= 67) return 'rain';
  if (code <= 82) return 'heavy_rain';
  if (code <= 86) return 'snow';
  if (code <= 99) return 'thunderstorm';
  return 'clear';
}

// Get emoji icon for condition
function getConditionIcon(condition: WeatherCondition, isDay: boolean): string {
  const icons: Record<WeatherCondition, { day: string; night: string }> = {
    clear: { day: '☀️', night: '🌙' },
    partly_cloudy: { day: '⛅', night: '☁️' },
    cloudy: { day: '☁️', night: '☁️' },
    fog: { day: '🌫️', night: '🌫️' },
    drizzle: { day: '🌧️', night: '🌧️' },
    rain: { day: '🌧️', night: '🌧️' },
    heavy_rain: { day: '⛈️', night: '⛈️' },
    snow: { day: '❄️', night: '❄️' },
    heavy_snow: { day: '🌨️', night: '🌨️' },
    thunderstorm: { day: '⛈️', night: '⛈️' },
  };
  return isDay ? icons[condition].day : icons[condition].night;
}

// Get human-readable description
function getConditionDescription(condition: WeatherCondition): string {
  const descriptions: Record<WeatherCondition, string> = {
    clear: 'Clear skies',
    partly_cloudy: 'Partly cloudy',
    cloudy: 'Overcast',
    fog: 'Foggy',
    drizzle: 'Light drizzle',
    rain: 'Rainy',
    heavy_rain: 'Heavy rain',
    snow: 'Snowing',
    heavy_snow: 'Heavy snow',
    thunderstorm: 'Thunderstorm',
  };
  return descriptions[condition];
}

// Check for weather alerts
function checkAlerts(data: WeatherData, tempF: number): WeatherAlert[] {
  const alerts: WeatherAlert[] = [];
  
  // Freeze warning (below 32°F)
  if (tempF < 32) {
    alerts.push({
      type: 'freeze',
      severity: tempF < 20 ? 'high' : 'medium',
      message: 'Freeze warning — Disconnect outdoor hoses, cover plants',
    });
  }
  
  // Extreme heat (above 95°F)
  if (tempF > 95) {
    alerts.push({
      type: 'heat',
      severity: tempF > 105 ? 'high' : 'medium',
      message: 'Extreme heat — Check HVAC filter, stay hydrated',
    });
  }
  
  // High precipitation
  if (data.precipitationChance > 70) {
    alerts.push({
      type: 'rain',
      severity: 'medium',
      message: 'Rain expected — Great time for indoor tasks',
    });
  }
  
  // High wind
  if (data.windSpeed > 25) {
    alerts.push({
      type: 'wind',
      severity: 'low',
      message: 'High winds — Secure outdoor items',
    });
  }
  
  return alerts;
}

// Get weather advice based on conditions
export function getWeatherAdvice(data: WeatherData): {
  headline: string;
  subtext: string;
  color: string;
  tasks: string[];
} {
  const tempF = data.temp;
  const condition = data.condition;
  
  // Check for alerts first
  if (data.alerts.length > 0) {
    const alert = data.alerts[0];
    return {
      headline: alert.message.split(' — ')[0],
      subtext: alert.message.split(' — ')[1] || 'Tap for details',
      color: alert.severity === 'high' ? '#EF4444' : alert.severity === 'medium' ? '#F59E0B' : '#3B82F6',
      tasks: getAlertTasks(alert),
    };
  }
  
  // Good outdoor weather
  if (condition === 'clear' || condition === 'partly_cloudy') {
    if (tempF >= 60 && tempF <= 85) {
      return {
        headline: 'Perfect Weekend for Outdoor Work',
        subtext: `${Math.round(tempF)}°F • Clear through ${getDayName(data.daily[2]?.date)}`,
        color: '#22C55E',
        tasks: ['Clean gutters', 'Inspect roof', 'Wash exterior windows', 'Check outdoor lighting'],
      };
    }
    if (tempF > 85) {
      return {
        headline: 'Hot Day — Morning Work Best',
        subtext: `${Math.round(tempF)}°F • Work outside before 10 AM`,
        color: '#F59E0B',
        tasks: ['Water plants early', 'Check irrigation', 'Inspect AC filter'],
      };
    }
    if (tempF < 60) {
      return {
        headline: 'Cool Day — Great for Heavy Work',
        subtext: `${Math.round(tempF)}°F • Perfect for attic/crawlspace`,
        color: '#3B82F6',
        tasks: ['Inspect attic insulation', 'Check crawlspace', 'Organize garage'],
      };
    }
  }
  
  // Rainy/indoor weather
  if (condition === 'rain' || condition === 'drizzle' || condition === 'heavy_rain') {
    return {
      headline: 'Great Day for Indoor Tasks',
      subtext: `${Math.round(tempF)}°F • Rain expected`,
      color: '#3B82F6',
      tasks: ['Check smoke detectors', 'Test CO alarms', 'Inspect fire extinguisher', 'Clean dryer vent'],
    };
  }
  
  // Snow
  if (condition === 'snow' || condition === 'heavy_snow') {
    return {
      headline: 'Snow Day',
      subtext: 'Stay warm and safe',
      color: '#60A5FA',
      tasks: ['Check furnace filter', 'Inspect water heater', 'Test sump pump'],
    };
  }
  
  // Default
  return {
    headline: 'Check Weather for Ideas',
    subtext: `${Math.round(tempF)}°F • ${data.description}`,
    color: '#6366F1',
    tasks: ['Review maintenance schedule'],
  };
}

function getDayName(dateStr?: string): string {
  if (!dateStr) return 'later';
  const date = new Date(dateStr);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  
  if (date.toDateString() === today.toDateString()) return 'today';
  if (date.toDateString() === tomorrow.toDateString()) return 'tomorrow';
  
  return date.toLocaleDateString('en-US', { weekday: 'long' });
}

function getAlertTasks(alert: WeatherAlert): string[] {
  switch (alert.type) {
    case 'freeze':
      return ['Disconnect outdoor hoses', 'Cover sensitive plants', 'Check pipe insulation', 'Open cabinet doors under sinks'];
    case 'heat':
      return ['Check HVAC filter', 'Close blinds/curtains', 'Water plants early', 'Inspect attic ventilation'];
    case 'rain':
      return ['Check gutters', 'Inspect downspouts', 'Test sump pump', 'Seal drafty windows'];
    case 'wind':
      return ['Secure patio furniture', 'Check fence posts', 'Inspect tree limbs', 'Store loose items'];
    case 'storm':
      return ['Charge devices', 'Check flashlight batteries', 'Review emergency kit', 'Clear drains'];
    default:
      return ['Stay safe!'];
  }
}

// Fetch weather from Open-Meteo
export async function fetchWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    // Check cache first
    const cached = await getCachedWeather(lat, lng);
    if (cached) return cached;
    
    // Fetch from Open-Meteo (free, no API key)
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lng}&current=temperature_2m,weather_code,is_day,precipitation_probability,wind_speed_10m&hourly=temperature_2m,weather_code,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,weather_code,precipitation_probability_max&temperature_unit=fahrenheit&wind_speed_unit=mph&timezone=auto&forecast_days=5`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Weather API error: ${response.status}`);
    
    const data: OpenMeteoResponse = await response.json();
    
    // Get current hour index
    const now = new Date();
    const currentHour = now.getHours();
    
    // Build hourly forecast (next 24 hours)
    const hourly: HourlyForecast[] = [];
    for (let i = 0; i < 24; i++) {
      const hourIndex = currentHour + i;
      if (hourIndex < data.hourly.temperature_2m.length) {
        hourly.push({
          hour: (currentHour + i) % 24,
          temp: data.hourly.temperature_2m[hourIndex],
          condition: mapWeatherCode(data.hourly.weather_code[hourIndex]),
          precipitationChance: data.hourly.precipitation_probability[hourIndex],
        });
      }
    }
    
    // Build daily forecast
    const daily: DailyForecast[] = data.daily.temperature_2m_max.slice(0, 5).map((max, i) => ({
      date: data.daily.temperature_2m_min[i] ? new Date(now.getTime() + i * 24 * 60 * 60 * 1000).toISOString().split('T')[0] : '',
      tempHigh: max,
      tempLow: data.daily.temperature_2m_min[i],
      condition: mapWeatherCode(data.daily.weather_code[i]),
      precipitationChance: data.daily.precipitation_probability_max[i],
    }));
    
    const condition = mapWeatherCode(data.current.weather_code);
    const isDay = data.current.is_day === 1;
    
    const weatherData: WeatherData = {
      temp: data.current.temperature_2m,
      condition,
      description: getConditionDescription(condition),
      icon: getConditionIcon(condition, isDay),
      precipitationChance: data.current.precipitation_probability || 0,
      windSpeed: data.current.wind_speed_10m || 0,
      isDay,
      hourly,
      daily,
      alerts: [],
      fetchedAt: Date.now(),
    };
    
    // Check for alerts
    weatherData.alerts = checkAlerts(weatherData, weatherData.temp);
    
    // Cache the result
    await cacheWeather(lat, lng, weatherData);
    
    return weatherData;
  } catch (error) {
    console.error('Failed to fetch weather:', error);
    return null;
  }
}

// Cache management
async function getCachedWeather(lat: number, lng: number): Promise<WeatherData | null> {
  try {
    const cacheKey = `${CACHE_KEY}_${Math.round(lat)}_${Math.round(lng)}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data: WeatherData = JSON.parse(cached);
    const age = Date.now() - data.fetchedAt;
    
    if (age < CACHE_DURATION_MS) {
      return data;
    }
    
    return null;
  } catch {
    return null;
  }
}

async function cacheWeather(lat: number, lng: number, data: WeatherData): Promise<void> {
  try {
    const cacheKey = `${CACHE_KEY}_${Math.round(lat)}_${Math.round(lng)}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify(data));
  } catch (error) {
    console.error('Failed to cache weather:', error);
  }
}

// Geocoding - convert address/zip to lat/lng
export interface GeoCoords {
  lat: number;
  lng: number;
}

export async function geocodeAddress(address: string, city?: string, state?: string, zip?: string): Promise<GeoCoords | null> {
  try {
    // Build query - prefer full address over just zip
    const queryParts: string[] = [];
    if (address) queryParts.push(address);
    if (city) queryParts.push(city);
    if (state) queryParts.push(state);
    if (zip) queryParts.push(zip);
    
    const query = queryParts.join(', ');
    
    // Check cache first
    const cachedCoords = await getCachedGeocode(query);
    if (cachedCoords) return cachedCoords;
    
    // Use HERE Geocoding API
    const url = `https://geocode.search.hereapi.com/v1/geocode?q=${encodeURIComponent(query)}&apiKey=${HERE_API_KEY}`;
    
    const response = await fetch(url);
    if (!response.ok) throw new Error(`Geocoding API error: ${response.status}`);
    
    const data = await response.json();
    
    if (data.items && data.items.length > 0) {
      const coords: GeoCoords = {
        lat: data.items[0].position.lat,
        lng: data.items[0].position.lng,
      };
      
      // Cache the result
      await cacheGeocode(query, coords);
      
      return coords;
    }
    
    return null;
  } catch (error) {
    console.error('Failed to geocode address:', error);
    return null;
  }
}

// Geocoding cache management
async function getCachedGeocode(query: string): Promise<GeoCoords | null> {
  try {
    const cacheKey = `${GEOCACHE_KEY}_${query.toLowerCase().replace(/\s+/g, '_')}`;
    const cached = await AsyncStorage.getItem(cacheKey);
    if (!cached) return null;
    
    const data = JSON.parse(cached);
    const age = Date.now() - (data.timestamp || 0);
    
    if (age < GEOCACHE_DURATION_MS) {
      return { lat: data.lat, lng: data.lng };
    }
    
    return null;
  } catch {
    return null;
  }
}

async function cacheGeocode(query: string, coords: GeoCoords): Promise<void> {
  try {
    const cacheKey = `${GEOCACHE_KEY}_${query.toLowerCase().replace(/\s+/g, '_')}`;
    await AsyncStorage.setItem(cacheKey, JSON.stringify({
      lat: coords.lat,
      lng: coords.lng,
      timestamp: Date.now(),
    }));
  } catch (error) {
    console.error('Failed to cache geocode:', error);
  }
}