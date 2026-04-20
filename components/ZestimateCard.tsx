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
}

export function ZestimateCard({
  zestimate,
  purchasePrice,
  zillowUrl,
  loading,
  error,
  hasAddress,
  onRefresh,
}: ZestimateCardProps) {
  const { colors } = useTheme();

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
        duration: 400,
        useNativeDriver: true,
      }).start();
    }
  }, [zestimate, loading]);

  // Shimmer animation for loading
  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(shimmer, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      shimmer.setValue(0);
    }
  }, [loading]);

  const shimmerTranslate = shimmer.interpolate({
    inputRange: [0, 1],
    outputRange: [-100, 100],
  });

  // No address - show minimal prompt
  if (!hasAddress && !loading) {
    return (
      <Pressable onPress={() => {}}>
        <View style={[styles.container, styles.condensed, { backgroundColor: colors.surface }]}>
          <View style={styles.row}>
            <Ionicons name="home-outline" size={18} color={colors.textTertiary} />
            <Text style={[styles.label, { color: colors.textSecondary }]}>Add address for Zestimate</Text>
            <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
          </View>
        </View>
      </Pressable>
    );
  }

  return (
    <View style={[styles.container, styles.condensed, { backgroundColor: colors.surface }]}>
      <View style={styles.row}>
        {/* Icon */}
        <View style={[styles.iconBadge, { backgroundColor: colors.primary + '15' }]}>
          <Ionicons name="home" size={18} color={colors.primary} />
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          {loading ? (
            <View style={styles.loadingRow}>
              <View style={[styles.skeletonBar, { backgroundColor: colors.gray200 }]}>
                <Animated.View style={[styles.skeletonShimmer, { transform: [{ translateX: shimmerTranslate }] }]} />
              </View>
            </View>
          ) : error ? (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle" size={14} color={colors.error} />
              <Text style={[styles.errorText, { color: colors.error }]}>{error}</Text>
              {onRefresh && (
                <Pressable onPress={onRefresh}>
                  <Ionicons name="refresh" size={18} color={colors.primary} />
                </Pressable>
              )}
            </View>
          ) : zestimate ? (
            <Animated.View style={[styles.valueRow, { opacity: valueOpacity }]}>
              <Text style={[styles.value, { color: colors.textPrimary }]}>
                {formatZestimate(zestimate)}
              </Text>
              {equity !== null && equityPercent !== null && (
                <View style={[styles.equityBadge, { backgroundColor: isUp ? colors.success + '15' : colors.error + '15' }]}>
                  <Ionicons name={isUp ? 'trending-up' : 'trending-down'} size={14} color={isUp ? colors.success : colors.error} />
                  <Text style={[styles.equityText, { color: isUp ? colors.success : colors.error }]}>
                    {isUp ? '+' : ''}{formatZestimate(Math.abs(equity))} ({isUp ? '+' : ''}{equityPercent.toFixed(1)}%)
                  </Text>
                </View>
              )}
            </Animated.View>
          ) : (
            <Text style={[styles.label, { color: colors.textSecondary }]}>Looking up value...</Text>
          )}
        </View>

        {/* Actions */}
        <View style={styles.actions}>
          {zillowUrl && (
            <Pressable style={styles.linkBtn} onPress={() => zillowUrl && Linking.openURL(zillowUrl)}>
              <Ionicons name="open-outline" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  condensed: {
    padding: 12,
    marginBottom: 16,
  },
  row: {
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
  content: {
    flex: 1,
  },
  valueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  value: {
    fontSize: 18,
    fontWeight: '700',
  },
  equityBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  equityText: {
    fontSize: 13,
    fontWeight: '600',
  },
  label: {
    fontSize: 14,
  },
  actions: {
    flexDirection: 'row',
    gap: 4,
  },
  linkBtn: {
    padding: 6,
    borderRadius: 8,
  },
  loadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonBar: {
    width: 120,
    height: 20,
    borderRadius: 4,
    overflow: 'hidden',
  },
  skeletonShimmer: {
    width: 100,
    height: '100%',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  errorText: {
    fontSize: 13,
    flex: 1,
  },
});