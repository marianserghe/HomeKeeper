import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { getZoneFromHomeInfo, CLIMATE_ZONE_NAMES, ClimateZone } from '../lib/climateZone';
import { getSeasonalTips } from '../lib/seasonalTips';

interface SeasonalTipsModalProps {
  visible: boolean;
  month?: number;
  onClose: () => void;
  onAddTask?: (tip: string) => void;
}

export function SeasonalTipsModal({ visible, month, onClose, onAddTask }: SeasonalTipsModalProps) {
  const { colors } = useTheme();
  const { homeInfo } = useApp();
  
  // Detect climate zone from home info
  const zone: ClimateZone = getZoneFromHomeInfo({
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
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Seasonal Tips</Text>
          <View style={styles.headerRight} />
        </View>

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Title Card */}
          <View style={[styles.titleCard, { backgroundColor: seasonal.color + '15' }]}>
            <View style={[styles.titleIcon, { backgroundColor: seasonal.color + '25' }]}>
              <Ionicons name={seasonal.icon as any} size={32} color={seasonal.color} />
            </View>
            <Text style={[styles.titleText, { color: colors.textPrimary }]}>
              {seasonal.title}
            </Text>
            <Text style={[styles.zoneText, { color: colors.textSecondary }]}>
              {CLIMATE_ZONE_NAMES[zone]} Region
            </Text>
          </View>

          {/* Tips List */}
          <View style={styles.tipsSection}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              TASKS
            </Text>
            {seasonal.tips.map((tip, index) => (
              <Pressable
                key={index}
                style={[styles.tipItem, { backgroundColor: colors.surface }]}
                onPress={() => onAddTask?.(tip)}
                disabled={!onAddTask}
              >
                <View style={[styles.tipNumber, { backgroundColor: seasonal.color + '20' }]}>
                  <Text style={[styles.tipNumberText, { color: seasonal.color }]}>{index + 1}</Text>
                </View>
                <Text style={[styles.tipText, { color: colors.textPrimary }]}>{tip}</Text>
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </Pressable>
            ))}
          </View>

          {/* Add All Button */}
          {onAddTask && (
            <Pressable
              style={[styles.addAllButton, { backgroundColor: colors.primary }]}
              onPress={() => {
                seasonal.tips.forEach(tip => onAddTask(tip));
                onClose();
              }}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addAllButtonText}>Add All as Tasks</Text>
            </Pressable>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  headerRight: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  titleCard: {
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    marginBottom: 24,
  },
  titleIcon: {
    width: 64,
    height: 64,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  titleText: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 4,
  },
  zoneText: {
    fontSize: 14,
  },
  tipsSection: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 0.5,
    marginBottom: 12,
  },
  tipItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
    gap: 12,
  },
  tipNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tipNumberText: {
    fontSize: 13,
    fontWeight: '700',
  },
  tipText: {
    fontSize: 15,
    flex: 1,
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
  },
  addAllButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});