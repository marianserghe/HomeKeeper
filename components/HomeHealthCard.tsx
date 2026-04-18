import { useEffect } from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  withDelay,
  Easing,
  interpolate,
  Extrapolation,
} from 'react-native-reanimated';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

interface HomeHealthCardProps {
  score: number;
  overdueCount: number;
  onPress?: () => void;
}

export function HomeHealthCard({ score, overdueCount, onPress }: HomeHealthCardProps) {
  const { colors } = useTheme();

  // Animation values
  const progress = useSharedValue(0);
  const scoreOpacity = useSharedValue(0);
  const scoreScale = useSharedValue(0.5);
  const factor1 = useSharedValue(0);
  const factor2 = useSharedValue(0);
  const factor3 = useSharedValue(0);
  const factor4 = useSharedValue(0);

  // Get color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return colors.success;
    if (s >= 60) return colors.warning;
    return colors.error;
  };

  const scoreColor = getScoreColor(score);

  // Animate on mount
  useEffect(() => {
    // Progress bar animation (fills 0 to score over 1 second)
    progress.value = withTiming(score, {
      duration: 1000,
      easing: Easing.out(Easing.cubic),
    });

    // Score number pops in after progress completes
    scoreOpacity.value = withDelay(1000, withTiming(1, { duration: 300 }));
    scoreScale.value = withDelay(1000, withSpring(1, { damping: 8, stiffness: 200 }));

    // Factors pop in one by one after score appears
    factor1.value = withDelay(1400, withSpring(1, { damping: 10, stiffness: 150 }));
    factor2.value = withDelay(1600, withSpring(1, { damping: 10, stiffness: 150 }));
    factor3.value = withDelay(1800, withSpring(1, { damping: 10, stiffness: 150 }));
    factor4.value = withDelay(2000, withSpring(1, { damping: 10, stiffness: 150 }));
  }, [score]);

  // Animated styles
  const progressStyle = useAnimatedStyle(() => ({
    width: `${progress.value}%`,
  }));

  const scoreStyle = useAnimatedStyle(() => ({
    opacity: scoreOpacity.value,
    transform: [{ scale: scoreScale.value }],
  }));

  // Factor animated styles
  const factorStyle1 = useAnimatedStyle(() => ({
    opacity: factor1.value,
    transform: [{ scale: factor1.value }],
  }));
  const factorStyle2 = useAnimatedStyle(() => ({
    opacity: factor2.value,
    transform: [{ scale: factor2.value }],
  }));
  const factorStyle3 = useAnimatedStyle(() => ({
    opacity: factor3.value,
    transform: [{ scale: factor3.value }],
  }));
  const factorStyle4 = useAnimatedStyle(() => ({
    opacity: factor4.value,
    transform: [{ scale: factor4.value }],
  }));

  // Generate health message
  const getHealthMessage = () => {
    if (score >= 95) return { emoji: '✨', text: 'Excellent! Home is in perfect shape' };
    if (score >= 80) return { emoji: '🏠', text: 'Great! Just a few small things' };
    if (score >= 60) return { emoji: '⚠️', text: 'Needs some attention' };
    if (score >= 40) return { emoji: '🔧', text: 'Several tasks need attention' };
    return { emoji: '🚨', text: 'Urgent: Multiple overdue tasks' };
  };

  const healthMessage = getHealthMessage();

  // Health factors
  const factors = [
    { icon: 'shield-checkmark', label: 'Safety', status: 'good' },
    { icon: 'thermometer', label: 'HVAC', status: 'good' },
    { icon: 'construct', label: 'Maintenance', status: overdueCount > 0 ? 'warning' : 'good' },
    { icon: 'home', label: 'Exterior', status: 'good' },
  ];

  const factorStyles = [factorStyle1, factorStyle2, factorStyle3, factorStyle4];

  return (
    <Pressable onPress={onPress}>
      <View style={[styles.container, { backgroundColor: colors.surface }]}>
        {/* Main Content */}
        <View style={styles.mainContent}>
          {/* Left: Score Circle */}
          <View style={styles.scoreSection}>
            <Animated.View style={[styles.scoreCircle, { borderColor: scoreColor }, scoreStyle]}>
              <Animated.Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {Math.round(score)}
              </Animated.Text>
            </Animated.View>
            <Animated.Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
              Health Score
            </Animated.Text>
          </View>

          {/* Right: Progress & Factors */}
          <View style={styles.rightSection}>
            {/* Progress Bar */}
            <View style={styles.progressContainer}>
              <View style={[styles.progressBackground, { backgroundColor: colors.gray200 }]}>
                <Animated.View style={[styles.progressFill, { backgroundColor: scoreColor }, progressStyle]} />
              </View>
              <View style={styles.progressLabels}>
                <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>0</Text>
                <Text style={[styles.progressLabel, { color: colors.textTertiary }]}>100</Text>
              </View>
            </View>

            {/* Message */}
            <View style={styles.messageRow}>
              <Text style={styles.emoji}>{healthMessage.emoji}</Text>
              <Text style={[styles.message, { color: colors.textSecondary }]} numberOfLines={1}>
                {healthMessage.text}
              </Text>
            </View>

            {/* Health Factors - Pop up one by one */}
            <View style={styles.factorsRow}>
              {factors.map((factor, index) => (
                <Animated.View
                  key={factor.label}
                  style={[
                    styles.factor,
                    factorStyles[index],
                    { backgroundColor: factor.status === 'good' ? colors.success + '15' : colors.warning + '15' },
                  ]}
                >
                  <Ionicons
                    name={factor.icon as any}
                    size={12}
                    color={factor.status === 'good' ? colors.success : colors.warning}
                  />
                  <Text style={[styles.factorLabel, { color: colors.textSecondary }]}>
                    {factor.label}
                  </Text>
                </Animated.View>
              ))}
            </View>
          </View>
        </View>

        {/* Action hint */}
        {overdueCount > 0 && (
          <View style={styles.actionHint}>
            <Ionicons name="arrow-forward" size={14} color={colors.primary} />
            <Text style={[styles.actionText, { color: colors.primary }]}>
              {overdueCount} overdue task{overdueCount > 1 ? 's' : ''} need{overdueCount === 1 ? 's' : ''} attention
            </Text>
          </View>
        )}
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    padding: 20,
    marginBottom: 16,
    overflow: 'hidden',
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  scoreSection: {
    alignItems: 'center',
    marginRight: 20,
  },
  scoreCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    borderWidth: 6,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  scoreNumber: {
    fontSize: 42,
    fontWeight: 'bold',
  },
  scoreLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  rightSection: {
    flex: 1,
    paddingTop: 4,
  },
  progressContainer: {
    marginBottom: 12,
  },
  progressBackground: {
    height: 12,
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 6,
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
  messageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  emoji: {
    fontSize: 16,
  },
  message: {
    fontSize: 13,
    flex: 1,
  },
  factorsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  factor: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 4,
  },
  factorLabel: {
    fontSize: 12,
    fontWeight: '500',
  },
  actionHint: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.1)',
  },
  actionText: {
    fontSize: 13,
    fontWeight: '500',
  },
});