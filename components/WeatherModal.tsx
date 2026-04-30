// ============================================
// HOMEKEEPER - Weather Task Suggestions Modal
// ============================================

import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { useApp } from '../contexts/AppContext';
import { WeatherData, getWeatherAdvice, DailyForecast } from '../lib/weather';

interface WeatherModalProps {
  visible: boolean;
  weather: WeatherData | null;
  onClose: () => void;
  onAddTask: (title: string) => void;
}

export function WeatherModal({ visible, weather, onClose, onAddTask }: WeatherModalProps) {
  const { colors } = useTheme();
  const { addTask, tasks, activePropertyId } = useApp();
  const [addedTasks, setAddedTasks] = useState<Set<string>>(new Set());
  
  // Reset added tasks when modal opens - pre-populate with existing tasks for THIS property
  useEffect(() => {
    if (visible) {
      // Check which tasks already exist for this property
      const existingTaskTitles = new Set(
        tasks
          .filter(t => !t.propertyId || t.propertyId === activePropertyId)
          .map(t => t.title)
      );
      setAddedTasks(existingTaskTitles);
    }
  }, [visible, activePropertyId]);
  
  // Sync with actual tasks for this property - remove from added if task was deleted
  useEffect(() => {
    if (!visible) return;
    const propertyTasks = tasks.filter(t => !t.propertyId || t.propertyId === activePropertyId);
    const taskTitles = new Set(propertyTasks.map(t => t.title));
    setAddedTasks(prev => {
      const stillExists = new Set<string>();
      prev.forEach(title => {
        if (taskTitles.has(title)) stillExists.add(title);
      });
      return stillExists;
    });
  }, [tasks, visible, activePropertyId]);

  if (!weather) return null;

  const advice = getWeatherAdvice(weather);
  
  const handleAddTask = (task: string) => {
    // Mark as added locally
    setAddedTasks(prev => new Set(prev).add(task));
    // Call parent handler
    onAddTask(task);
  };

  // Get day name from date
  const getDayName = (dateStr: string, index: number): string => {
    if (index === 0) return 'Today';
    if (index === 1) return 'Tomorrow';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short' });
  };

  // Get condition emoji
  const getConditionEmoji = (condition: string): string => {
    const emojis: Record<string, string> = {
      clear: '☀️',
      partly_cloudy: '⛅',
      cloudy: '☁️',
      fog: '🌫️',
      drizzle: '🌧️',
      rain: '🌧️',
      heavy_rain: '⛈️',
      snow: '❄️',
      heavy_snow: '🌨️',
      thunderstorm: '⛈️',
    };
    return emojis[condition] || '🌤️';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>
            Weather Suggestions
          </Text>
          <View style={styles.placeholder} />
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Current Weather Card */}
          <View style={[styles.currentCard, { backgroundColor: colors.surface }]}>
            <View style={styles.currentRow}>
              <Text style={styles.currentIcon}>{weather.icon}</Text>
              <View style={styles.currentInfo}>
                <Text style={[styles.currentTemp, { color: colors.textPrimary }]}>
                  {Math.round(weather.temp)}°F
                </Text>
                <Text style={[styles.currentDesc, { color: colors.textSecondary }]}>
                  {weather.description}
                </Text>
              </View>
              {weather.alerts.length > 0 && (
                <View style={[styles.alertBadge, { backgroundColor: advice.color + '20' }]}>
                  <Ionicons name="warning" size={16} color={advice.color} />
                </View>
              )}
            </View>
          </View>

          {/* Alerts */}
          {weather.alerts.length > 0 && (
            <View style={styles.alertsSection}>
              {weather.alerts.map((alert, i) => (
                <View 
                  key={i} 
                  style={[styles.alertCard, { backgroundColor: colors.surface, borderLeftColor: advice.color }]}
                >
                  <View style={styles.alertHeader}>
                    <Ionicons 
                      name={alert.type === 'freeze' ? 'snow' : alert.type === 'heat' ? 'thermometer' : 'warning'} 
                      size={20} 
                      color={advice.color} 
                    />
                    <Text style={[styles.alertTitle, { color: colors.textPrimary }]}>
                      {alert.type === 'freeze' ? 'Freeze Warning' : 
                       alert.type === 'heat' ? 'Heat Advisory' :
                       alert.type === 'rain' ? 'Rain Expected' :
                       alert.type === 'wind' ? 'Wind Advisory' : 'Weather Alert'}
                    </Text>
                  </View>
                  <Text style={[styles.alertMessage, { color: colors.textSecondary }]}>
                    {alert.message}
                  </Text>
                </View>
              ))}
            </View>
          )}

          {/* Suggested Tasks */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Suggested Tasks
            </Text>
            <Text style={[styles.sectionSubtitle, { color: colors.textSecondary }]}>
              Based on today's weather conditions
            </Text>
            
            {advice.tasks.map((task, i) => (
              <Pressable
                key={i}
                style={[
                  styles.taskCard,
                  { backgroundColor: colors.surface },
                  addedTasks.has(task) && { opacity: 0.5 }
                ]}
                onPress={() => !addedTasks.has(task) && handleAddTask(task)}
                disabled={addedTasks.has(task)}
              >
                <View style={styles.taskLeft}>
                  <Text style={[
                    styles.taskTitle, 
                    { color: addedTasks.has(task) ? colors.textTertiary : colors.textPrimary }
                  ]}>
                    {task}
                  </Text>
                </View>
                {addedTasks.has(task) ? (
                  <View style={[styles.doneBadge, { backgroundColor: colors.success + '20' }]}>
                    <Text style={[styles.doneText, { color: colors.success }]}>Done</Text>
                  </View>
                ) : (
                  <View style={[styles.doneButton, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.doneButtonText, { color: colors.primary }]}>Done</Text>
                  </View>
                )}
              </Pressable>
            ))}
          </View>

          {/* 5-Day Forecast */}
          {weather.daily.length > 0 && (
            <View style={styles.section}>
              <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                5-Day Forecast
              </Text>
              
              <View style={[styles.forecastCard, { backgroundColor: colors.surface }]}>
                {weather.daily.slice(0, 5).map((day, i) => (
                  <View 
                    key={i} 
                    style={[
                      styles.forecastRow,
                      i < weather.daily.length - 1 && { borderBottomWidth: 1, borderBottomColor: colors.border }
                    ]}
                  >
                    <Text style={[styles.forecastDay, { color: colors.textPrimary }]}>
                      {getDayName(day.date, i)}
                    </Text>
                    <Text style={styles.forecastIcon}>
                      {getConditionEmoji(day.condition)}
                    </Text>
                    <Text style={[styles.forecastTemp, { color: colors.textSecondary }]}>
                      {Math.round(day.tempHigh)}°
                    </Text>
                    <Text style={[styles.forecastTempLow, { color: colors.textTertiary }]}>
                      {Math.round(day.tempLow)}°
                    </Text>
                    {day.precipitationChance > 20 && (
                      <View style={[styles.precipBadge, { backgroundColor: colors.primary + '15' }]}>
                        <Ionicons name="water" size={10} color={colors.primary} />
                        <Text style={[styles.precipText, { color: colors.primary }]}>
                          {day.precipitationChance}%
                        </Text>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Pro Tip */}
          <View style={[styles.tipCard, { backgroundColor: advice.color + '10', borderColor: advice.color + '30' }]}>
            <Ionicons name="bulb" size={18} color={advice.color} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              {weather.condition === 'clear' && weather.temp > 60 && weather.temp < 85
                ? 'Great day to tackle outdoor maintenance! Start early to avoid peak sun.'
                : weather.condition === 'rain' || weather.condition === 'drizzle'
                ? 'Perfect time for indoor maintenance like checking detectors and filters.'
                : 'Stay safe and choose tasks that match the weather conditions.'}
            </Text>
          </View>
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
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(128, 128, 128, 0.2)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  placeholder: {
    width: 40,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  currentCard: {
    padding: 20,
    borderRadius: 16,
    marginBottom: 16,
  },
  currentRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  currentIcon: {
    fontSize: 48,
    marginRight: 16,
  },
  currentInfo: {
    flex: 1,
  },
  currentTemp: {
    fontSize: 36,
    fontWeight: '700',
  },
  currentDesc: {
    fontSize: 14,
    marginTop: 4,
  },
  alertBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  alertsSection: {
    marginBottom: 24,
  },
  alertCard: {
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    marginBottom: 8,
  },
  alertHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  alertTitle: {
    fontSize: 15,
    fontWeight: '600',
  },
  alertMessage: {
    fontSize: 14,
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  sectionSubtitle: {
    fontSize: 13,
    marginBottom: 12,
  },
  taskCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  taskTitle: {
    fontSize: 15,
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
  addedBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  addedText: {
    fontSize: 12,
    fontWeight: '600',
  },
  forecastCard: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  forecastRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
  },
  forecastDay: {
    fontSize: 14,
    fontWeight: '500',
    width: 80,
  },
  forecastIcon: {
    fontSize: 18,
    marginRight: 12,
  },
  forecastTemp: {
    fontSize: 14,
    fontWeight: '600',
    width: 40,
  },
  forecastTempLow: {
    fontSize: 14,
    width: 40,
  },
  precipBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 'auto',
    gap: 4,
  },
  precipText: {
    fontSize: 12,
    fontWeight: '500',
  },
  tipCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  tipText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
});