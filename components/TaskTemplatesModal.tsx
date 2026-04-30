import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';
import { TASK_TEMPLATES, TaskTemplate, TASK_TEMPLATES_BY_FREQUENCY } from '../lib/taskTemplates';
import { TaskCategoryLabels } from '../lib/tasks';

interface TaskTemplatesModalProps {
  visible: boolean;
  onClose: () => void;
  onAddTemplate: (template: TaskTemplate, dueDate: string) => void;
  existingTemplateIds: string[];
}

export function TaskTemplatesModal({ visible, onClose, onAddTemplate, existingTemplateIds }: TaskTemplatesModalProps) {
  const { colors, isDark } = useTheme();
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<TaskTemplate | null>(null);
  const [tempDate, setTempDate] = useState(new Date());

  const frequencies = [
    { key: 'all', label: 'All' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'semi-annual', label: '6 Months' },
    { key: 'annual', label: 'Yearly' },
  ];

  const filteredTemplates = selectedFrequency === 'all'
    ? TASK_TEMPLATES
    : TASK_TEMPLATES_BY_FREQUENCY[selectedFrequency as keyof typeof TASK_TEMPLATES_BY_FREQUENCY] || [];

  const isAdded = (templateId: string) => existingTemplateIds.includes(templateId);

  const formatDateLocal = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  const handleAddPress = (template: TaskTemplate) => {
    if (isAdded(template.id)) return;
    setSelectedTemplate(template);
    setTempDate(new Date());
    setShowDatePicker(true);
  };

  const handleDateConfirm = () => {
    if (selectedTemplate) {
      onAddTemplate(selectedTemplate, formatDateLocal(tempDate));
    }
    setShowDatePicker(false);
    setSelectedTemplate(null);
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
    setSelectedTemplate(null);
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    } else {
      setShowDatePicker(false);
      if (event.type === 'set' && selectedDate && selectedTemplate) {
        onAddTemplate(selectedTemplate, formatDateLocal(selectedDate));
        setSelectedTemplate(null);
      }
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Close</Text>
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Task Templates</Text>
          <View style={styles.headerButton} />
        </View>

        {/* Frequency Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterScroll}
          contentContainerStyle={styles.filterContent}
        >
          {frequencies.map(freq => (
            <Pressable
              key={freq.key}
              style={[
                styles.filterChip,
                { backgroundColor: colors.surface, borderColor: colors.border },
                selectedFrequency === freq.key && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
              ]}
              onPress={() => setSelectedFrequency(freq.key)}
            >
              <Text
                style={[
                  styles.filterText,
                  { color: colors.textSecondary },
                  selectedFrequency === freq.key && { color: colors.primary, fontWeight: '600' },
                ]}
              >
                {freq.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Templates List */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredTemplates.map(template => {
            const added = isAdded(template.id);
            return (
              <View
                key={template.id}
                style={[
                  styles.templateCard,
                  { backgroundColor: colors.surface },
                  added && { opacity: 0.5 },
                ]}
              >
                <View style={styles.templateHeader}>
                  <View style={[styles.iconCircle, { backgroundColor: colors.primary + '15' }]}>
                    <Ionicons name={template.icon as any} size={20} color={colors.primary} />
                  </View>
                  <View style={styles.templateInfo}>
                    <Text style={[styles.templateTitle, { color: colors.textPrimary }]}>
                      {template.title}
                    </Text>
                    <Text style={[styles.templateMeta, { color: colors.textTertiary }]}>
                      {TaskCategoryLabels[template.category]} • {template.frequency}
                    </Text>
                  </View>
                </View>

                {template.description && (
                  <Text style={[styles.templateDesc, { color: colors.textSecondary }]}>
                    {template.description}
                  </Text>
                )}

                <View style={styles.templateFooter}>
                  <View style={styles.templateStats}>
                    <Ionicons name="time-outline" size={14} color={colors.textTertiary} />
                    <Text style={[styles.templateTime, { color: colors.textTertiary }]}>
                      {template.estimatedMinutes} min
                    </Text>
                    <View style={[styles.priorityBadge, { 
                      backgroundColor: 
                        template.priority === 'high' || template.priority === 'urgent' 
                          ? colors.error + '20' 
                          : template.priority === 'medium'
                            ? colors.warning + '20'
                            : colors.textTertiary + '20'
                    }]}>
                      <Text style={[
                        styles.priorityText,
                        { color: template.priority === 'high' || template.priority === 'urgent' 
                          ? colors.error 
                          : template.priority === 'medium'
                            ? colors.warning
                            : colors.textTertiary 
                        }
                      ]}>
                        {template.priority}
                      </Text>
                    </View>
                  </View>

                  <Pressable
                    style={[
                      styles.addButton,
                      { backgroundColor: added ? colors.gray300 : colors.primary },
                    ]}
                    onPress={() => handleAddPress(template)}
                    disabled={added}
                  >
                    <Text style={[styles.addButtonText, { color: colors.white }]}>
                      {added ? 'Added' : 'Add'}
                    </Text>
                  </Pressable>
                </View>
              </View>
            );
          })}
        </ScrollView>

        {/* Date Picker Modal for iOS */}
        {Platform.OS === 'ios' && showDatePicker && selectedTemplate && (
          <Modal
            visible={showDatePicker}
            transparent
            animationType="slide"
            onRequestClose={handleDateCancel}
          >
            <View style={styles.datePickerOverlay}>
              <Pressable style={styles.datePickerBackdrop} onPress={handleDateCancel} />
              <View style={[styles.datePickerContent, { backgroundColor: colors.surface }]}>
                <View style={[styles.datePickerHeader, { borderBottomColor: colors.border }]}>
                  <Pressable onPress={handleDateCancel} style={styles.datePickerButton}>
                    <Text style={styles.datePickerCancel}>Cancel</Text>
                  </Pressable>
                  <Text style={[styles.datePickerTitle, { color: colors.textPrimary }]}>
                    Due Date
                  </Text>
                  <Pressable onPress={handleDateConfirm} style={styles.datePickerButton}>
                    <Text style={[styles.datePickerConfirm, { color: colors.primary }]}>Add</Text>
                  </Pressable>
                </View>
                <View style={styles.datePickerContainer}>
                  <DateTimePicker
                    value={tempDate}
                    mode="date"
                    display="inline"
                    onChange={handleDateChange}
                    minimumDate={new Date()}
                    themeVariant={isDark ? 'dark' : 'light'}
                    accentColor={colors.primary}
                  />
                </View>
              </View>
            </View>
          </Modal>
        )}

        {/* Date Picker for Android */}
        {Platform.OS === 'android' && showDatePicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
            minimumDate={new Date()}
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerButton: {
    minWidth: 60,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  filterScroll: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 6,
    flexDirection: 'row',
  },
  filterChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  filterText: {
    fontSize: 13,
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    gap: 12,
  },
  templateCard: {
    borderRadius: 12,
    padding: 16,
  },
  templateHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  iconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  templateInfo: {
    flex: 1,
  },
  templateTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  templateMeta: {
    fontSize: 12,
    marginTop: 2,
  },
  templateDesc: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 12,
  },
  templateFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  templateStats: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  templateTime: {
    fontSize: 12,
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  priorityText: {
    fontSize: 11,
    fontWeight: '500',
    textTransform: 'capitalize',
  },
  addButton: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    borderRadius: 8,
  },
  addButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  datePickerOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  datePickerBackdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  datePickerContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  datePickerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  datePickerButton: {
    padding: 8,
    minWidth: 50,
  },
  datePickerCancel: {
    fontSize: 16,
    color: '#8e8e93',
  },
  datePickerTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerConfirm: {
    fontSize: 16,
    fontWeight: '600',
  },
  datePickerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});