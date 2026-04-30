// ============================================
// HOMEKEEPER - Weather-Aware Banner
// ============================================

import { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, Pressable, ActivityIndicator, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { fetchWeather, geocodeAddress, getWeatherAdvice, WeatherData } from '../lib/weather';

interface WeatherBannerProps {
  onPress?: () => void;
  onWeatherLoad?: (weather: WeatherData) => void;
}

export function WeatherBanner({ onPress, onWeatherLoad }: WeatherBannerProps) {
  const { colors } = useTheme();
  const { homeInfo } = useApp();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch weather on mount and when location changes
  useEffect(() => {
    const loadWeather = async () => {
      let lat: number | undefined = homeInfo.lat;
      let lng: number | undefined = homeInfo.lng;
      
      // If no coordinates, try to geocode from address
      if (!lat || !lng) {
        if (homeInfo.address || homeInfo.zip) {
          const coords = await geocodeAddress(
            homeInfo.address || '',
            homeInfo.city,
            homeInfo.state,
            homeInfo.zip
          );
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }
        
        // Fallback to NJ if we have state but no address
        if (!lat || !lng) {
          if (homeInfo.state || homeInfo.city) {
            lat = 41.05;
            lng = -74.12;
          } else {
            return; // No location info at all
          }
        }
      }
      
      // Only show loading spinner on initial load
      if (initialLoad) {
        setLoading(true);
      }
      
      const data = await fetchWeather(lat, lng);
      if (data) {
        setWeather(data);
        setError(null);
        onWeatherLoad?.(data);
      } else {
        setError('Unable to load weather');
      }
      setLoading(false);
      setInitialLoad(false);
    };

    loadWeather();
  }, [homeInfo.lat, homeInfo.lng, homeInfo.address, homeInfo.city, homeInfo.state, homeInfo.zip]);

  if ((loading && initialLoad) || error || !weather) {
    if (initialLoad && loading) {
      return (
        <View style={[styles.container, styles.loading, styles.glowContainer, { backgroundColor: colors.surface }]}>
          <ActivityIndicator size="small" color={colors.textTertiary} />
        </View>
      );
    }
    return null; // Don't show banner if no weather data
  }

  const advice = getWeatherAdvice(weather);

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <View style={[styles.container, { backgroundColor: colors.surface, borderColor: advice.color + '50' }]}>
        <View style={styles.leftSection}>
          <View style={[styles.iconBadge, { backgroundColor: advice.color + '20' }]}>
            <Text style={styles.weatherIcon}>{weather.icon}</Text>
          </View>
          <View style={styles.textSection}>
            <Text style={[styles.headline, { color: colors.textPrimary }]}>
              {advice.headline}
            </Text>
            <Text style={[styles.subtext, { color: colors.textSecondary }]}>
              {advice.subtext}
            </Text>
          </View>
        </View>
        <View style={[styles.tempBadge, { backgroundColor: advice.color + '15' }]}>
          <Text style={[styles.tempText, { color: advice.color }]}>
            {Math.round(weather.temp)}°F
          </Text>
        </View>
      </View>
    </Pressable>
  );
}

// Animated version with shimmer effect
export function WeatherBannerAnimated({ onPress }: WeatherBannerProps) {
  const { colors } = useTheme();
  const { homeInfo } = useApp();
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);

  // Shimmer animation
  const shimmerAnim = useState(new Animated.Value(0))[0];

  // Shimmer animation - DISABLED to prevent screen wake lock
  // Continuous animations prevent iOS from sleeping
  // useEffect(() => {
  //   const shimmer = Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(shimmerAnim, {
  //         toValue: 1,
  //         duration: 2000,
  //         useNativeDriver: true,
  //       }),
  //       Animated.timing(shimmerAnim, {
  //         toValue: 0,
  //         duration: 2000,
  //         useNativeDriver: true,
  //       }),
  //     ])
  //   );
  //   shimmer.start();
  //   return () => shimmer.stop();
  // }, [shimmerAnim]);

  useEffect(() => {
    const loadWeather = async () => {
      let lat: number | undefined = homeInfo.lat;
      let lng: number | undefined = homeInfo.lng;
      
      // If no coordinates, try to geocode from address
      if (!lat || !lng) {
        if (homeInfo.address || homeInfo.zip) {
          const coords = await geocodeAddress(
            homeInfo.address || '',
            homeInfo.city,
            homeInfo.state,
            homeInfo.zip
          );
          if (coords) {
            lat = coords.lat;
            lng = coords.lng;
          }
        }
        
        // Fallback to NJ if we have state but no address
        if (!lat || !lng) {
          if (homeInfo.state || homeInfo.city) {
            lat = 41.05;
            lng = -74.12;
          } else {
            return; // No location info at all
          }
        }
      }

      // Only show skeleton on initial load
      if (initialLoad) {
        setLoading(true);
      }

      const data = await fetchWeather(lat, lng);
      if (data) {
        setWeather(data);
      }
      setLoading(false);
      setInitialLoad(false);
    };

    loadWeather();
  }, [homeInfo.lat, homeInfo.lng, homeInfo.address, homeInfo.city, homeInfo.state, homeInfo.zip]);

  if (loading && initialLoad && !weather) {
    return (
      <View style={[styles.wrapper]}>
        <View style={[styles.container, styles.skeleton, { backgroundColor: colors.surface }]}>
          <View style={[styles.skeletonIcon, { backgroundColor: colors.border }]} />
          <View style={styles.skeletonText}>
            <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '60%' }]} />
            <View style={[styles.skeletonLine, { backgroundColor: colors.border, width: '40%', marginTop: 6 }]} />
          </View>
        </View>
      </View>
    );
  }

  if (!weather) return null;

  const advice = getWeatherAdvice(weather);

  const glowOpacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.6],
  });

  return (
    <Pressable onPress={onPress} style={styles.wrapper}>
      <Animated.View
        style={[
          styles.glowContainer,
          {
            shadowColor: advice.color,
            shadowOpacity: glowOpacity,
          }
        ]}
      >
        <View style={[styles.container, { backgroundColor: colors.surface, borderColor: advice.color + '50' }]}>
          <View style={styles.leftSection}>
            <View style={[styles.iconBadge, { backgroundColor: advice.color + '20' }]}>
              <Text style={styles.weatherIcon}>{weather.icon}</Text>
            </View>
            <View style={styles.textSection}>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>
                {advice.headline}
              </Text>
              <Text style={[styles.subtext, { color: colors.textSecondary }]}>
                {advice.subtext}
              </Text>
            </View>
          </View>
          <View style={[styles.tempBadge, { backgroundColor: advice.color + '15' }]}>
            <Text style={[styles.tempText, { color: advice.color }]}>
              {Math.round(weather.temp)}°F
            </Text>
          </View>
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    marginTop: 20,
    marginBottom: 20,
  },
  glowContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 4 },
    shadowRadius: 16,
    elevation: 6,
  },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 20,
    borderWidth: 1.5,
  },
  loading: {
    padding: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  iconBadge: {
    width: 50,
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  weatherIcon: {
    fontSize: 26,
  },
  textSection: {
    flex: 1,
  },
  headline: {
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: -0.3,
  },
  subtext: {
    fontSize: 13,
    marginTop: 3,
    opacity: 0.8,
  },
  tempBadge: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 24,
  },
  tempText: {
    fontSize: 18,
    fontWeight: '800',
  },
  // Skeleton styles
  skeleton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 20,
    gap: 12,
  },
  skeletonIcon: {
    width: 50,
    height: 50,
    borderRadius: 14,
  },
  skeletonText: {
    flex: 1,
  },
  skeletonLine: {
    height: 12,
    borderRadius: 6,
  },
});