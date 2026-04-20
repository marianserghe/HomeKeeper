import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { getZoneFromHomeInfo, ClimateZone, CLIMATE_ZONE_NAMES } from '../lib/climateZone';
import { getSeasonalTips } from '../lib/seasonalTips';

interface SeasonalTipsCardProps {
  month?: number; // 0-11 (JavaScript month)
  onPress?: () => void;
}

export function SeasonalTipsCard({ month, onPress }: SeasonalTipsCardProps) {
  const { colors } = useTheme();
  const { homeInfo } = useApp();
  
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
  
  if (!seasonal) return null;

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        <View style={styles.row}>
          <View style={[styles.iconBadge, { backgroundColor: seasonal.color + '20' }]}>
            <Ionicons name={seasonal.icon as any} size={18} color={seasonal.color} />
          </View>
          <View style={styles.textSection}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>{seasonal.title}</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Tap for {CLIMATE_ZONE_NAMES[zone]?.toLowerCase() || 'local'} tips
            </Text>
          </View>
          <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
        </View>
      </View>
    </Pressable>
  );
}

// Re-export for SeasonalTipsModal
export { getSeasonalTips } from '../lib/seasonalTips';
export { CLIMATE_ZONE_NAMES, ClimateZone } from '../lib/climateZone';

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textSection: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '600',
  },
  subtitle: {
    fontSize: 12,
    marginTop: 2,
  },
});