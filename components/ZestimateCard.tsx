import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Linking } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSpring,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { formatZestimate, getDaysSinceUpdate } from '../lib/zestimate';

interface ZestimateCardProps {
  zestimate?: number;
  purchasePrice?: number;
  zestimateDate?: string;
  zillowUrl?: string;
  rentZestimate?: number;
  loading?: boolean;
  error?: string | null;
  hasAddress?: boolean;
  onRefresh?: () => void;
}

export function ZestimateCard({
  zestimate,
  purchasePrice,
  zestimateDate,
  zillowUrl,
  rentZestimate,
  loading,
  error,
  hasAddress,
  onRefresh,
}: ZestimateCardProps) {
  const { colors } = useTheme();

  // Animation values
  const valueOpacity = useSharedValue(0);
  const valueTranslate = useSharedValue(20);
  const equityOpacity = useSharedValue(0);
  const equityTranslate = useSharedValue(15);
  const detailsOpacity = useSharedValue(0);
  const shimmer = useSharedValue(0);

  // Calculate equity
  const equity = zestimate && purchasePrice ? zestimate - purchasePrice : null;
  const equityPercent = equity && purchasePrice ? (equity / purchasePrice) * 100 : null;

  // Animate on mount / when zestimate loads
  useEffect(() => {
    if (zestimate && !loading) {
      valueOpacity.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) });
      valueTranslate.value = withSpring(0, { damping: 15, stiffness: 120 });
      equityOpacity.value = withDelay(400, withTiming(1, { duration: 500 }));
      equityTranslate.value = withDelay(400, withSpring(0, { damping: 15, stiffness: 120 }));
      detailsOpacity.value = withDelay(700, withTiming(1, { duration: 400 }));
    }
  }, [zestimate, loading]);

  // Shimmer animation for loading
  useEffect(() => {
    if (loading) {
      shimmer.value = withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) });
    }
  }, [loading]);

  const valueStyle = useAnimatedStyle(() => ({
    opacity: valueOpacity.value,
    transform: [{ translateY: valueTranslate.value }],
  }));

  const equityStyle = useAnimatedStyle(() => ({
    opacity: equityOpacity.value,
    transform: [{ translateY: equityTranslate.value }],
  }));

  const detailsStyle = useAnimatedStyle(() => ({
    opacity: detailsOpacity.value,
  }));

  const shimmerStyle = useAnimatedStyle(() => {
    const translateX = interpolate(shimmer.value, [0, 1], [-200, 200], Extrapolation.CLAMP);
    return {
      transform: [{ translateX }],
    };
  });

  const isUp = equity !== null && equity >= 0;

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Background gradient accent */}
      <View style={[styles.accentBar, { backgroundColor: colors.primary + '15' }]} />

      <View style={styles.content}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="home-outline" size={16} color={colors.primary} />
            <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Zillow Zestimate</Text>
          </View>
          <View style={styles.headerRight}>
            {zillowUrl && (
              <Pressable style={styles.zillowBtn} onPress={() => zillowUrl && Linking.openURL(zillowUrl)}>
                <Ionicons name="open-outline" size={12} color={colors.primary} />
                <Text style={[styles.zillowBtnText, { color: colors.primary }]}>Zillow</Text>
              </Pressable>
            )}
            {hasAddress && onRefresh && !loading && (
              <Pressable style={styles.refreshBtn} onPress={onRefresh}>
                <Ionicons name="refresh" size={14} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
        </View>

        {/* Loading state */}
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.skeletonBar, { backgroundColor: colors.gray200, width: '60%' }]}>
              <Animated.View style={[styles.skeletonShimmer, shimmerStyle]} />
            </View>
            <View style={[styles.skeletonBar, { backgroundColor: colors.gray200, width: '40%', marginTop: 12 }]}>
              <Animated.View style={[styles.skeletonShimmer, shimmerStyle]} />
            </View>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle-outline" size={24} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            {onRefresh && (
              <Pressable style={[styles.retryBtn, { borderColor: colors.error }]} onPress={onRefresh}>
                <Text style={[styles.retryText, { color: colors.error }]}>Retry</Text>
              </Pressable>
            )}
          </View>
        ) : zestimate ? (
          <>
            {/* Main Value */}
            <Animated.View style={valueStyle}>
              <Text style={[styles.valueText, { color: colors.textPrimary }]}>
                {formatZestimate(zestimate)}
              </Text>
            </Animated.View>

            {/* Equity Change */}
            {equity !== null && equityPercent !== null && (
              <Animated.View style={[styles.equityRow, equityStyle]}>
                <View style={[styles.equityBadge, { backgroundColor: isUp ? colors.success + '15' : colors.error + '15' }]}>
                  <Ionicons 
                    name={isUp ? 'trending-up' : 'trending-down'} 
                    size={16} 
                    color={isUp ? colors.success : colors.error} 
                  />
                  <Text style={[styles.equityValue, { color: isUp ? colors.success : colors.error }]}>
                    {isUp ? '+' : ''}{formatZestimate(Math.abs(equity))}
                  </Text>
                </View>
                <Text style={[styles.equityPercent, { color: isUp ? colors.success : colors.error }]}>
                  {isUp ? '+' : ''}{equityPercent.toFixed(1)}%
                </Text>
                <Text style={[styles.equityLabel, { color: colors.textTertiary }]}>
                  equity
                </Text>
              </Animated.View>
            )}

            {/* Details Row */}
            <Animated.View style={[styles.detailsRow, detailsStyle]}>
              {/* Rent Zestimate */}
              {rentZestimate && (
                <View style={styles.detailItem}>
                  <Ionicons name="key-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Rent</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {formatZestimate(rentZestimate)}/mo
                  </Text>
                </View>
              )}

              {/* Last Updated */}
              {zestimateDate && (
                <View style={styles.detailItem}>
                  <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                  <Text style={[styles.detailLabel, { color: colors.textTertiary }]}>Updated</Text>
                  <Text style={[styles.detailValue, { color: colors.textSecondary }]}>
                    {getDaysSinceUpdate(zestimateDate) === 0 
                      ? 'Today' 
                      : `${getDaysSinceUpdate(zestimateDate)}d ago`}
                  </Text>
                </View>
              )}
            </Animated.View>
          </>
        ) : hasAddress ? (
          <View style={styles.emptyContainer}>
            <Ionicons name="search-outline" size={24} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Looking up your home value...
            </Text>
            {onRefresh && (
              <Pressable style={[styles.retryBtn, { borderColor: colors.primary }]} onPress={onRefresh}>
                <Text style={[styles.retryText, { color: colors.primary }]}>Refresh</Text>
              </Pressable>
            )}
          </View>
        ) : (
          <View style={styles.emptyContainer}>
            <Ionicons name="location-outline" size={24} color={colors.textTertiary} />
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Set your home address in Settings to see your Zestimate
            </Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    marginBottom: 16,
    overflow: 'hidden',
    position: 'relative',
  },
  accentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 3,
  },
  content: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  headerLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zillowBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
  },
  zillowBtnText: {
    fontSize: 12,
    fontWeight: '600',
  },
  refreshBtn: {
    padding: 6,
    borderRadius: 12,
  },
  valueText: {
    fontSize: 40,
    fontWeight: 'bold',
    letterSpacing: -1,
    marginBottom: 8,
  },
  equityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  equityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
  },
  equityValue: {
    fontSize: 15,
    fontWeight: '600',
  },
  equityPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  equityLabel: {
    fontSize: 12,
  },
  detailsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.06)',
  },
  detailItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  detailLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  loadingContainer: {
    paddingVertical: 8,
  },
  skeletonBar: {
    height: 24,
    borderRadius: 8,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    width: 200,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flexWrap: 'wrap',
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryBtn: {
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
  },
  retryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  emptyContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flexWrap: 'wrap',
  },
  emptyText: {
    fontSize: 14,
    flex: 1,
  },
});