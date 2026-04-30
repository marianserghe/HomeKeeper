import { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { getZoneFromHomeInfo, CLIMATE_ZONE_NAMES, ClimateZone } from '../lib/climateZone';
import { getSeasonalTips } from '../lib/seasonalTips';
import { fetchWeather, getWeatherAdvice, WeatherData } from '../lib/weather';

const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const FULL_MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

// Seasonal colors
const SEASON_CONFIG = {
  winter: { gradient: ['#1e3a5f', '#2d5a87'], icon: 'snow' },
  spring: { gradient: ['#166534', '#22c55e'], icon: 'leaf' },
  summer: { gradient: ['#f59e0b', '#fbbf24'], icon: 'sunny' },
  fall: { gradient: ['#92400e', '#f97316'], icon: 'leaf' },
};

function getSeason(month: number): 'winter' | 'spring' | 'summer' | 'fall' {
  if (month === 11 || month <= 1) return 'winter';
  if (month >= 2 && month <= 4) return 'spring';
  if (month >= 5 && month <= 7) return 'summer';
  return 'fall';
}

interface SeasonalTipsModalProps {
  visible: boolean;
  month?: number;
  onClose: () => void;
  onAddTask?: (tip: string) => void;
}

export function SeasonalTipsModal({ visible, month, onClose, onAddTask }: SeasonalTipsModalProps) {
  const { colors } = useTheme();
  const { homeInfo, tasks, activePropertyId } = useApp();
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  const [selectedMonth, setSelectedMonth] = useState(month ?? new Date().getMonth());
  const [weather, setWeather] = useState<WeatherData | null>(null);
  const [bestDays, setBestDays] = useState<string[]>([]);
  const monthScrollRef = useRef<ScrollView>(null);
  
  // Reset added tasks and selected month when modal opens
  useEffect(() => {
    if (visible) {
      setAddedTasks(new Set());
      setSelectedMonth(month ?? new Date().getMonth());
    }
  }, [visible, month]);
  
  // Sync with actual tasks - check both added AND completed
  useEffect(() => {
    if (!visible) return;
    
    const taskMap = new Map(tasks.map(t => [t.title, t.status]));
    
    setAddedTasks(prev => {
      const stillExists = new Set<string>();
      prev.forEach(title => {
        if (taskMap.has(title)) stillExists.add(title);
      });
      return stillExists;
    });
  }, [tasks, visible]);
  
  // Check if a task is completed for THIS property
  const isTaskCompleted = (tip: string): boolean => {
    // If just added this session, don't check for completion
    if (addedTasks.has(tip)) return false;
    // Only check tasks for this property
    const task = tasks.find(t => t.title === tip && (!t.propertyId || t.propertyId === activePropertyId));
    return task?.status === 'completed';
  };
  
  // Fetch weather for best day recommendations
  useEffect(() => {
    const loadWeather = async () => {
      if (!homeInfo.lat && !homeInfo.zip) return;
      
      const lat = homeInfo.lat || 41.05;
      const lng = homeInfo.lng || -74.12;
      
      const data = await fetchWeather(lat, lng);
      if (data) {
        setWeather(data);
        
        // Find best days for outdoor work (low precipitation, mild temps)
        const goodDays: string[] = [];
        data.daily.forEach((day, i) => {
          if (day.precipitationChance < 30 && day.tempHigh >= 50 && day.tempHigh <= 85) {
            goodDays.push(day.date);
          }
        });
        setBestDays(goodDays.slice(0, 3));
      }
    };
    
    if (visible) loadWeather();
  }, [visible, homeInfo.lat, homeInfo.lng, homeInfo.zip]);
  
  // Detect climate zone
  const zone: ClimateZone = getZoneFromHomeInfo({
    state: homeInfo.state,
    zip: homeInfo.zip,
    lat: homeInfo.lat,
    lng: homeInfo.lng,
  });
  
  const seasonal = getSeasonalTips(zone, selectedMonth);
  const season = getSeason(selectedMonth);
  const seasonConfig = SEASON_CONFIG[season];
  
  if (!seasonal) return null;
  
  // Group tips by weather suitability
  const outdoorTips = seasonal.tips.filter(tip => 
    tip.toLowerCase().includes('gutter') ||
    tip.toLowerCase().includes('roof') ||
    tip.toLowerCase().includes('lawn') ||
    tip.toLowerCase().includes('garden') ||
    tip.toLowerCase().includes('deck') ||
    tip.toLowerCase().includes('driveway') ||
    tip.toLowerCase().includes('outdoor') ||
    tip.toLowerCase().includes('sprinkler') ||
    tip.toLowerCase().includes('pool')
  );
  const indoorTips = seasonal.tips.filter(tip => !outdoorTips.includes(tip));
  
  // Sort outdoor tips first if good weather coming
  const sortedTips = bestDays.length > 0 
    ? [...outdoorTips, ...indoorTips] 
    : seasonal.tips;
  
  const handleAddTask = (tip: string) => {
    if (addedTasks.has(tip)) return;
    setAddedTasks(prev => new Set(prev).add(tip));
    onAddTask?.(tip);
  };
  
  const handleAddAll = () => {
    // Only add tasks that aren't already added AND aren't completed
    const notAddedOrDone = seasonal.tips.filter(tip => !addedTasks.has(tip) && !isTaskCompleted(tip));
    notAddedOrDone.forEach(tip => onAddTask?.(tip));
    // Mark all as added (including completed ones)
    setAddedTasks(new Set(seasonal.tips));
  };
  
  // Check if all tasks are either added or completed
  const allTasksHandled = seasonal.tips.every(tip => addedTasks.has(tip) || isTaskCompleted(tip));
  
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'][date.getDay()]} ${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: seasonConfig.gradient[0] }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color="white" />
          </Pressable>
          
          <View style={styles.headerContent}>
            <Ionicons name={seasonal.icon as any} size={28} color="white" />
            <Text style={styles.headerTitle}>{seasonal.title}</Text>
            <Text style={styles.headerSubtitle}>{FULL_MONTHS[selectedMonth]}</Text>
          </View>
        </View>

        {/* Month Carousel */}
        <View style={styles.monthCarouselContainer}>
          <ScrollView 
            horizontal 
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.monthCarousel}
          >
            {MONTHS.map((m, i) => (
              <Pressable
                key={m}
                style={[
                  styles.monthChip,
                  { backgroundColor: i === selectedMonth ? colors.primary : colors.surface, borderColor: colors.border }
                ]}
                onPress={() => setSelectedMonth(i)}
              >
                <Text style={[styles.monthChipText, { color: i === selectedMonth ? colors.white : colors.textSecondary }]}>
                  {m}
                </Text>
              </Pressable>
            ))}
          </ScrollView>
        </View>

        {/* Best Days Banner */}
        {bestDays.length > 0 && selectedMonth === new Date().getMonth() && (
          <View style={[styles.bestDaysBanner, { backgroundColor: '#22c55e15', borderColor: '#22c55e50' }]}>
            <Ionicons name="sunny" size={18} color="#22c55e" />
            <Text style={[styles.bestDaysText, { color: '#22c55e' }]}>
              Best for outdoor work: {bestDays.slice(0, 2).map(formatDate).join(', ')}
            </Text>
          </View>
        )}

        {/* Content */}
        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Outdoor Tasks First */}
          {outdoorTips.length > 0 && bestDays.length > 0 && selectedMonth === new Date().getMonth() && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons name="sunny-outline" size={16} color={colors.primary} />
                <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>TASKS</Text>
              </View>
              {outdoorTips.map((tip, index) => {
                const isAdded = addedTasks.has(tip);
                const isDone = isTaskCompleted(tip);
                return (
                  <Pressable
                    key={`outdoor-${index}`}
                    style={[styles.tipItem, { backgroundColor: colors.surface }, (isAdded || isDone) && { opacity: 0.5 }]}
                    onPress={() => handleAddTask(tip)}
                    disabled={isAdded || isDone}
                  >
                    <View style={[styles.tipNumber, { backgroundColor: seasonal.color + '20' }]}>
                      <Text style={[styles.tipNumberText, { color: seasonal.color }]}>{index + 1}</Text>
                    </View>
                    <Text style={[styles.tipText, { color: (isAdded || isDone) ? colors.textTertiary : colors.textPrimary }]}>
                      {tip}
                    </Text>
                    {isDone ? (
                      <View style={[styles.doneBadge, { backgroundColor: colors.success + '20' }]}>
                        <Text style={[styles.doneText, { color: colors.success }]}>Done</Text>
                      </View>
                    ) : isAdded ? (
                      <View style={[styles.addedBadge, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.addedText, { color: colors.primary }]}>Added</Text>
                      </View>
                    ) : (
                      <View style={[styles.doneButton, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.doneButtonText, { color: colors.primary }]}>Done</Text>
                      </View>
                    )}
                  </Pressable>
                );
              })}
            </View>
          )}

          {/* All Tips */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>
              TASKS
            </Text>
            {(bestDays.length > 0 && selectedMonth === new Date().getMonth() ? indoorTips : seasonal.tips).map((tip, index) => {
              const isAdded = addedTasks.has(tip);
              const isDone = isTaskCompleted(tip);
              return (
                <Pressable
                  key={index}
                  style={[styles.tipItem, { backgroundColor: colors.surface }, (isAdded || isDone) && { opacity: 0.5 }]}
                  onPress={() => handleAddTask(tip)}
                  disabled={isAdded || isDone}
                >
                  <View style={[styles.tipNumber, { backgroundColor: seasonal.color + '20' }]}>
                    <Text style={[styles.tipNumberText, { color: seasonal.color }]}>{index + 1}</Text>
                  </View>
                  <Text style={[styles.tipText, { color: (isAdded || isDone) ? colors.textTertiary : colors.textPrimary }]}>
                    {tip}
                  </Text>
                  {isDone ? (
                    <View style={[styles.doneBadge, { backgroundColor: colors.success + '20' }]}>
                      <Text style={[styles.doneText, { color: colors.success }]}>Done</Text>
                    </View>
                  ) : isAdded ? (
                    <View style={[styles.addedBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.addedText, { color: colors.primary }]}>Added</Text>
                    </View>
                  ) : (
                      <View style={[styles.doneButton, { backgroundColor: colors.primary + '20' }]}>
                        <Text style={[styles.doneButtonText, { color: colors.primary }]}>Done</Text>
                      </View>
                    )}
                </Pressable>
              );
            })}
          </View>

          {/* Mark All Done Button */}
          {onAddTask && (
            <Pressable
              style={[styles.addAllButton, { backgroundColor: colors.primary }, allTasksHandled && { opacity: 0.5 }]}
              onPress={handleAddAll}
              disabled={allTasksHandled}
            >
              <Ionicons name="add" size={20} color="white" />
              <Text style={styles.addAllButtonText}>
                {allTasksHandled ? 'All Done' : 'Mark All Done'}
              </Text>
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
    paddingTop: 50,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  closeButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    zIndex: 10,
    padding: 4,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: 'white',
  },
  headerSubtitle: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.8)',
    marginLeft: 'auto',
  },
  // Month carousel
  monthCarouselContainer: {
    paddingVertical: 12,
  },
  monthCarousel: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    gap: 6,
  },
  monthChip: {
    height: 32,
    paddingHorizontal: 14,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 16,
    borderWidth: 1,
    marginRight: 8,
  },
  monthChipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  // Best days banner
  bestDaysBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginHorizontal: 16,
    marginBottom: 12,
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  bestDaysText: {
    fontSize: 13,
    fontWeight: '500',
  },
  // Content
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
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
    fontWeight: '600',
  },
  tipText: {
    flex: 1,
    fontSize: 15,
  },
  addedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  doneText: {
    fontSize: 12,
    fontWeight: '600',
  },
  doneButton: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  doneButtonText: {
    fontSize: 12,
    fontWeight: '600',
  },
  addAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
    marginTop: 8,
    gap: 8,
  },
  addAllButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});