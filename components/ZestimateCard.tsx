import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Linking, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { formatZestimate } from '../lib/zestimate';

interface ZestimateCardProps {
  zestimate?: number;
  purchasePrice?: number;
  zillowUrl?: string;
  loading?: boolean;
  error?: string | null;
  hasAddress?: boolean;
  onRefresh?: () => void;
  bedrooms?: number;
  bathrooms?: number;
  sqft?: number;
  yearBuilt?: number;
}

export function ZestimateCard({
  zestimate,
  purchasePrice,
  zillowUrl,
  loading,
  error,
  hasAddress,
  onRefresh,
  bedrooms,
  bathrooms,
  sqft,
  yearBuilt,
}: ZestimateCardProps) {
  const { colors, isDark } = useTheme();

  // Animation values
  const valueOpacity = useRef(new Animated.Value(0)).current;
  const shimmer = useRef(new Animated.Value(0)).current;

  // Calculate equity
  const equity = zestimate && purchasePrice ? zestimate - purchasePrice : null;
  const equityPercent = equity && purchasePrice ? (equity / purchasePrice) * 100 : null;
  const isUp = equity !== null && equity >= 0;

  // Animate on mount
  useEffect(() => {
    if (zestimate && !loading) {
      Animated.timing(valueOpacity, {
        toValue: 1,
        duration: 500,
        useNativeDriver: true,
      }).start();
    }
  }, [zestimate, loading]);

  // Shimmer animation for loading - only runs while loading
  useEffect(() => {
    if (loading) {
      const animation = Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      );
      animation.start();
      return () => animation.stop();
    } else {
      shimmer.setValue(0);
    }
  }, [loading]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  // Generate sparkline data (simulated trend)
  const sparklineBars = [0.7, 0.75, 0.72, 0.8, 0.85, 0.82, 0.9, 0.88, 0.95, 1];

  // No address - show minimal prompt
  if (!hasAddress && !loading) {
    return (
      <Pressable onPress={() => {}}>
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          <View style={styles.emptyState}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="home-outline" size={28} color={colors.primary} />
            </View>
            <View style={styles.emptyContent}>
              <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>Add Your Home</Text>
              <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>Get your Zestimate and track home value</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={colors.textTertiary} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.surface }]}>
      {/* Header with gradient effect */}
      <View style={[styles.header, { backgroundColor: isDark ? colors.primary + '20' : colors.primary + '08' }]}>
        <View style={styles.headerLeft}>
          <View style={[styles.iconBadge, { backgroundColor: colors.primary + '20' }]}>
            <Ionicons name="home" size={20} color={colors.primary} />
          </View>
          <Text style={[styles.headerLabel, { color: colors.textSecondary }]}>Home Value</Text>
        </View>
        {zillowUrl && (
          <Pressable style={styles.linkBtn} onPress={() => zillowUrl && Linking.openURL(zillowUrl)}>
            <Ionicons name="open-outline" size={18} color={colors.primary} />
            <Text style={[styles.linkText, { color: colors.primary }]}>Zillow</Text>
          </Pressable>
        )}
      </View>

      {/* Main Value Section */}
      <View style={styles.valueSection}>
        {loading ? (
          <View style={styles.loadingContainer}>
            <View style={[styles.skeletonLarge, { backgroundColor: colors.gray200 }]}>
              <Animated.View style={[styles.skeletonShimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
            </View>
            <View style={[styles.skeletonSmall, { backgroundColor: colors.gray200 }]} />
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Ionicons name="alert-circle" size={20} color={colors.error} />
            <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
            {onRefresh && (
              <Pressable style={styles.retryBtn} onPress={onRefresh}>
                <Ionicons name="refresh" size={18} color={colors.primary} />
              </Pressable>
            )}
          </View>
        ) : zestimate ? (
          <Animated.View style={[styles.valueContainer, { opacity: valueOpacity }]}>
            {/* Main Zestimate */}
            <View style={styles.mainValueRow}>
              <Animated.Text style={[styles.zestimateValue, { color: colors.textPrimary }]}>
                {formatZestimate(zestimate)}
              </Animated.Text>
              
              {/* Mini sparkline chart */}
              <View style={styles.sparkline}>
                {sparklineBars.map((height, i) => (
                  <View
                    key={i}
                    style={[
                      styles.sparkBar,
                      {
                        height: `${height * 100}%`,
                        backgroundColor: i === sparklineBars.length - 1 ? colors.primary : colors.primary + '30',
                      },
                    ]}
                  />
                ))}
              </View>
            </View>

            {/* Equity Display */}
            {equity !== null && equityPercent !== null && (
              <View 
                style={[
                  styles.equityContainer, 
                  { 
                    backgroundColor: isUp ? colors.success + '12' : colors.error + '12',
                    borderColor: isUp ? colors.success + '30' : colors.error + '30',
                  }
                ]}
              >
                <View style={styles.equityIconRow}>
                  <Ionicons 
                    name={isUp ? 'trending-up' : 'trending-down'} 
                    size={18} 
                    color={isUp ? colors.success : colors.error} 
                  />
                  <Text style={[styles.equityLabel, { color: colors.textSecondary }]}>
                    {isUp ? 'Equity Gained' : 'Under Water'}
                  </Text>
                </View>
                <View style={styles.equityValues}>
                  <Text style={[styles.equityAmount, { color: isUp ? colors.success : colors.error }]}>
                    {isUp ? '+' : '-'}{formatZestimate(Math.abs(equity))}
                  </Text>
                  <Text style={[styles.equityPercent, { color: isUp ? colors.success : colors.error }]}>
                    ({isUp ? '+' : ''}{equityPercent.toFixed(1)}%)
                  </Text>
                </View>
              </View>
            )}

            {/* Property Details */}
            {(bedrooms || bathrooms || sqft || yearBuilt) && (
              <View style={[styles.detailsRow, { borderTopColor: colors.border }]}>
                {bedrooms && (
                  <View style={styles.detail}>
                    <Ionicons name="bed-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{bedrooms} bed</Text>
                  </View>
                )}
                {bathrooms && (
                  <View style={styles.detail}>
                    <Ionicons name="water-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{bathrooms} bath</Text>
                  </View>
                )}
                {sqft && (
                  <View style={styles.detail}>
                    <Ionicons name="resize-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{sqft.toLocaleString()} sqft</Text>
                  </View>
                )}
                {yearBuilt && (
                  <View style={styles.detail}>
                    <Ionicons name="calendar-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.detailText, { color: colors.textSecondary }]}>{yearBuilt}</Text>
                  </View>
                )}
              </View>
            )}

            {/* Purchase Price Reference */}
            {purchasePrice && (
              <View style={styles.purchaseRow}>
                <Text style={[styles.purchaseLabel, { color: colors.textTertiary }]}>Purchased for</Text>
                <Text style={[styles.purchaseValue, { color: colors.textSecondary }]}>{formatZestimate(purchasePrice)}</Text>
              </View>
            )}
          </Animated.View>
        ) : (
          <Text style={[styles.label, { color: colors.textSecondary }]}>Looking up value...</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerLabel: {
    fontSize: 14,
    fontWeight: '600',
  },
  linkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  linkText: {
    fontSize: 13,
    fontWeight: '500',
  },
  valueSection: {
    padding: 16,
  },
  valueContainer: {
    gap: 12,
  },
  mainValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  zestimateValue: {
    fontSize: 28,
    fontWeight: '800',
    letterSpacing: -0.5,
  },
  sparkline: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 32,
    gap: 3,
    paddingHorizontal: 8,
  },
  sparkBar: {
    width: 4,
    borderRadius: 2,
  },
  equityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  equityIconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  equityLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  equityValues: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  equityAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
  equityPercent: {
    fontSize: 14,
    fontWeight: '600',
  },
  detailsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  detail: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 13,
  },
  purchaseRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 4,
  },
  purchaseLabel: {
    fontSize: 12,
  },
  purchaseValue: {
    fontSize: 12,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
  },
  loadingContainer: {
    gap: 10,
  },
  skeletonLarge: {
    width: 160,
    height: 32,
    borderRadius: 6,
    overflow: 'hidden',
  },
  skeletonSmall: {
    width: 100,
    height: 16,
    borderRadius: 4,
  },
  skeletonShimmer: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.2)',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  errorText: {
    fontSize: 14,
    flex: 1,
  },
  retryBtn: {
    padding: 8,
    borderRadius: 8,
    backgroundColor: 'rgba(0,0,0,0.05)',
  },
  emptyState: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    padding: 16,
  },
  emptyIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContent: {
    flex: 1,
    gap: 4,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  emptySubtitle: {
    fontSize: 13,
  },
});