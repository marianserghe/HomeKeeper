// ============================================
// HOMEKEEPER - Home Health Card
// ============================================

import { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Pressable, Animated } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';

interface HomeHealthCardProps {
  score: number;
  overdueCount: number;
  onPress?: () => void;
}

export function HomeHealthCard({ score, overdueCount, onPress }: HomeHealthCardProps) {
  const { colors } = useTheme();

  // Animation values
  const progressAnim = useRef(new Animated.Value(0)).current;
  const scoreOpacity = useRef(new Animated.Value(0)).current;
  const scoreScale = useRef(new Animated.Value(0.5)).current;
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Get color based on score
  const getScoreColor = (s: number) => {
    if (s >= 80) return colors.success;
    if (s >= 60) return colors.warning;
    return colors.error;
  };

  const scoreColor = getScoreColor(score);

  // Pulse animation for glow effect
  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  // Animate on mount
  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: score,
      duration: 1200,
      useNativeDriver: false,
    }).start();

    Animated.sequence([
      Animated.delay(300),
      Animated.parallel([
        Animated.timing(scoreOpacity, {
          toValue: 1,
          duration: 400,
          useNativeDriver: true,
        }),
        Animated.spring(scoreScale, {
          toValue: 1,
          damping: 6,
          stiffness: 150,
          useNativeDriver: true,
        }),
      ]),
    ]).start();
  }, [score]);

  // Dynamic headline based on score
  const getHeadline = () => {
    if (score >= 95) return 'Pristine Condition';
    if (score >= 80) return 'Looking Great';
    if (score >= 60) return 'Room to Improve';
    if (score >= 40) return 'Needs Attention';
    if (score >= 20) return 'Urgent Care';
    return 'Critical Status';
  };

  // Subtitle message
  const getSubtitle = () => {
    if (overdueCount > 0) {
      return `${overdueCount} overdue task${overdueCount > 1 ? 's' : ''} waiting`;
    }
    if (score >= 80) return 'Your home is in great shape';
    if (score >= 60) return 'A few tasks could use some love';
    return 'Time to tackle some maintenance';
  };

  // Animated progress width
  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 100],
    outputRange: ['0%', '100%'],
  });

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
              outputRange: [0.2, 0.45],
            }),
          }
        ]}
      >
        <View style={[styles.container, { backgroundColor: colors.surface }]}>
          {/* Main Content */}
          <View style={styles.content}>
            {/* Score */}
            <Animated.View style={[
              styles.scoreContainer,
              { opacity: scoreOpacity, transform: [{ scale: scoreScale }] }
            ]}>
              <Text style={[styles.scoreLabel, { color: colors.textSecondary }]}>
                Home Health
              </Text>
              <Text style={[styles.scoreNumber, { color: scoreColor }]}>
                {Math.round(score)}
              </Text>
            </Animated.View>

            {/* Headline & Subtitle */}
            <View style={styles.textSection}>
              <Text style={[styles.headline, { color: colors.textPrimary }]}>
                {getHeadline()}
              </Text>
              <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
                {getSubtitle()}
              </Text>
            </View>
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
        </View>
      </Animated.View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  glowContainer: {
    borderRadius: 24,
    shadowOffset: { width: 0, height: 0 },
    shadowRadius: 24,
    elevation: 12,
    marginTop: 8,
    marginBottom: 24,
  },
  container: {
    borderRadius: 24,
    padding: 28,
    overflow: 'hidden',
  },
  content: {
    alignItems: 'center',
    marginBottom: 24,
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreNumber: {
    fontSize: 128,
    fontFamily: 'BebasNeue',
    fontWeight: '400',
    letterSpacing: -2,
    lineHeight: 128,
    marginTop: 4,
  },
  scoreLabel: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  textSection: {
    alignItems: 'center',
    marginTop: 16,
  },
  headline: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 15,
    lineHeight: 20,
    textAlign: 'center',
  },
  progressSection: {
    width: '100%',
  },
  progressBar: {
    height: 8,
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
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
});