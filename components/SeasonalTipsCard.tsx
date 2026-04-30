import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { getZoneFromHomeInfo, ClimateZone, CLIMATE_ZONE_NAMES } from '../lib/climateZone';
import { getSeasonalTips } from '../lib/seasonalTips';

interface SeasonalTipsCardProps {
  month?: number; // 0-11 (JavaScript month)
  onPress?: () => void;
}

// Seasonal colors
const SEASON_COLORS = {
  winter: { bg: '#1e3a5f', accent: '#60A5FA' },
  spring: { bg: '#166534', accent: '#22c55e' },
  summer: { bg: '#f59e0b', accent: '#fbbf24' },
  fall: { bg: '#92400e', accent: '#f97316' },
};

function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'fall' {
  if (month === 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'fall';
}

export function SeasonalTipsCard({ month, onPress }: SeasonalTipsCardProps) {
  const { colors } = useTheme();
  const { homeInfo, tasks, activePropertyId } = useApp();
  
  // Pulse animation for icon - DISABLED to prevent screen wake lock
  // Continuous animations prevent iOS from sleeping
  // const pulseAnim = useRef(new Animated.Value(1)).current;
  // 
  // useEffect(() => {
  //   Animated.loop(
  //     Animated.sequence([
  //       Animated.timing(pulseAnim, { toValue: 1.05, duration: 2000, useNativeDriver: true }),
  //       Animated.timing(pulseAnim, { toValue: 1, duration: 2000, useNativeDriver: true }),
  //     ])
  //   ).start();
  // }, []);
  const pulseAnim = useRef(new Animated.Value(1)).current; // Static value
  
  // Detect climate zone from home info
  const zone = getZoneFromHomeInfo({
    state: homeInfo.state,
    zip: homeInfo.zip,
    lat: homeInfo.lat,
    lng: homeInfo.lng,
  });
  
  // Use current month if not provided
  const currentMonth = month ?? new Date().getMonth();
  const seasonal = getSeasonalTips(zone, currentMonth);
  const season = getSeason(currentMonth);
  const seasonColor = SEASON_COLORS[season];
  
  if (!seasonal) return null;

  // Calculate progress - only count tasks for this property
  const completedTasks = seasonal.tips.filter(tip => 
    tasks.some(t => t.title === tip && (!t.propertyId || t.propertyId === activePropertyId))
  ).length;
  const totalTasks = seasonal.tips.length;

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Icon with gentle pulse */}
        <Animated.View style={[
          styles.iconBadge, 
          { 
            backgroundColor: seasonColor.bg + '20',
            transform: [{ scale: pulseAnim }]
          }
        ]}>
          <Ionicons name={seasonal.icon as any} size={22} color={seasonColor.accent} />
        </Animated.View>
        
        {/* Text content */}
        <View style={styles.textSection}>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            {seasonal.title}
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            {completedTasks > 0 
              ? `${completedTasks}/${totalTasks} done • ${CLIMATE_ZONE_NAMES[zone]?.toLowerCase() || 'local'}`
              : `${totalTasks} tasks • ${CLIMATE_ZONE_NAMES[zone]?.toLowerCase() || 'local'}`
            }
          </Text>
        </View>
        
        {/* Progress indicator */}
        <View style={styles.progressSection}>
          <View style={[styles.progressRing, { borderColor: colors.border }]}>
            <View 
              style={[
                styles.progressFill, 
                { 
                  width: `${(completedTasks / totalTasks) * 100}%`,
                  backgroundColor: seasonColor.accent,
                }
              ]} 
            />
          </View>
          <Text style={[styles.progressText, { color: completedTasks > 0 ? seasonColor.accent : colors.textTertiary }]}>
            {completedTasks}/{totalTasks}
          </Text>
        </View>
        
        <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
      </View>
    </Pressable>
  );
}

// Re-export for SeasonalTipsModal
export { getSeasonalTips } from '../lib/seasonalTips';
export { CLIMATE_ZONE_NAMES, ClimateZone } from '../lib/climateZone';

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    marginBottom: 16,
    borderRadius: 12,
  },
  iconBadge: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textSection: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
  progressSection: {
    alignItems: 'center',
    marginRight: 8,
  },
  progressRing: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    position: 'absolute',
    left: 0,
  },
  progressText: {
    fontSize: 10,
    fontWeight: '600',
    marginTop: 2,
  },
});