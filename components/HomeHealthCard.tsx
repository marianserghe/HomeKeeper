import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface HomeHealthCardProps {
  score: number;
  overdueCount: number;
  completedCount?: number;
  totalCount?: number;
  onPress?: () => void;
}

export function HomeHealthCard({ score, overdueCount, completedCount = 0, totalCount = 0, onPress }: HomeHealthCardProps) {
  const { colors, isDark } = useTheme();

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Get color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return colors.success;
    if (s >= 60) return colors.warning; // amber
    return colors.error;
  };

  const scoreColor = getScoreColor(score);

  // Pulse animation for glow effect
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Animate on mount
  useEffect(() => {
    // Progress bar animation
    Animated.timing(progressAnim, {
      toValue: score,
      duration: 1000,
      useNativeDriver: false,
    }).start();

    // Score number pops in after progress completes
    Animated.sequence([
      Animated.delay(500),
      Animated.parallel([
        Animated.timing(scoreOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scoreScale, {
          toValue: 1,
          damping: 8,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [score]);

  // Generate health message - clever/fun messages
  const getHealthMessage = () => {
    if (score >= 95) return 'Pristine! Your home is sparkling';
    if (score >= 80) return "Lookin' good! Minor touch-ups";
    if (score >= 60) return "A few things need love";
    if (score >= 40) return "Your house called. It's lonely.";
    if (score >= 20) return "Things are piling up... literally";
    return "Your house needs therapy";
  };

  // Dynamic headline based on score
  const getHeadline = () => {
    if (score >= 80) return 'House Champion';
    if (score >= 60) return 'Could Be Worse';
    if (score >= 40) return 'Reality Check';
    if (score >= 20) return 'Fire Drill';
    return 'Emergency Room';
  };

  const healthMessage = getHealthMessage();

  // Animated progress width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

  // Calculate completion ratio
  const completedRatio = totalCount > 0 ? completedCount / totalCount : 0;

  return (
    <Pressable onPress={onPress}>
      {/* Glow layer */}
      <Animated.View 
        style={[
          styles.glowContainer,
          {
            shadowColor: scoreColor,
            shadowOpacity: pulseAnim.interpolate({
              inputRange: [0, 1],
              outputRange: [0.15, 0.35],
            }),
          }
        ]}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Header Row */}
          <View style={styles.headerRow}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>{getHeadline()}</Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {healthMessage}
              </Text>
            </View>
            
            {/* Score Badge */}
            <Animated.View 
              style={[
                styles.scoreBadge, 
                { backgroundColor: scoreColor + '20' },
                { opacity: scoreOpacity, transform: [{ scale: scoreScale }] }
              ]}
            >
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {Math.round(score)}
              </Text>
            </Animated.View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressSection}>
            <View style={[styles.progressBar, { backgroundColor: colors.gray200 }]}>
              <Animated.View 
                style={[
                  styles.progressFill, 
                  { backgroundColor: scoreColor, width: progressWidth }
                ]} 
              />
            </View>
            <View style={styles.progressLabels}>
              <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>0</Text>
              <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>100</Text>
            </View>
          </View>

          {/* Stats Row */}
          <View style={styles.statsRow}>
            {/* Completed */}
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.success + '15' }]}>
                <Ionicons name="checkmark-circle" size={18} color={colors.success} />
              </View>
              <View style={styles.statText}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{completedCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Completed</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            {/* Overdue */}
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: overdueCount > 0 ? colors.error + '15' : colors.gray200 }]}>
                <Ionicons name="alert-circle" size={18} color={overdueCount > 0 ? colors.error : colors.textTertiary} />
              </View>
              <View style={styles.statText}>
                <Text style={[styles.statValue, { color: overdueCount > 0 ? colors.error : colors.textPrimary }]}>{overdueCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Overdue</Text>
              </View>
            </View>

            {/* Divider */}
            <View style={[styles.statDivider, { backgroundColor: colors.border }]} />

            {/* Total */}
            <View style={styles.statItem}>
              <View style={[styles.statIcon, { backgroundColor: colors.primary + '15' }]}>
                <Ionicons name="list" size={18} color={colors.primary} />
              </View>
              <View style={styles.statText}>
                <Text style={[styles.statValue, { color: colors.textPrimary }]}>{totalCount}</Text>
                <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Total</Text>
              </View>
            </View>
          </View>

          {/* Action hint if overdue */}
          {overdueCount > 0 && (
            <View style={[styles.actionHint, { borderTopColor: colors.border }]}>
              <Ionicons name="arrow-forward" size={14} color={colors.primary} />
              <Text style={[styles.actionText, { color: colors.primary }]}>
                {overdueCount} overdue task{overdueCount > 1 ? 's' : ''} need{overdueCount === 1 ? 's' : ''} attention
              </Text>
            </View>
          )}
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowContainer: {
    borderRadius: 20,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 20,
    elevation: 8,
    marginTop: 8,
    marginBottom: 24,
  },
  container: {
    borderRadius: 20,
    padding: 20,
    overflow: 'hidden',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  titleSection: {
    flex: 1,
    marginRight: 12,
  },
  title: {
    fontSize: 36,
    fontFamily: 'BebasNeue',
    fontWeight: '400',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  scoreBadge: {
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 18,
  },
  scoreNumber: {
    fontSize: 48,
    fontFamily: 'BebasNeue',
    fontWeight: '400',
    letterSpacing: -1,
  },
  progressSection: {
    marginBottom: 16,
  },
  progressBar: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 5,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 6,
  },
  progressLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-around',
  },
  statItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  statIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statText: {
    alignItems: 'flex-start',
  },
  statValue: {
    fontSize: 16,
    fontWeight: '700',
  },
  statLabel: {
    fontSize: 11,
    marginTop: 1,
  },
  statDivider: {
    width: 1,
    height: 36,
    opacity: 0.3,
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});