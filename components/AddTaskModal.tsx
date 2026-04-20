// ============================================
// HOMEKEEPER - Add Task Modal
// ============================================

import { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  TextInput,
  Modal,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { TaskCategory, TaskCategoryLabels, TaskPriority, Task } from '../lib/tasks';
import { HomeInfo } from '../contexts/AppContext';
import { DatePickerField } from './DatePickerField';

interface AddTaskModalProps {
  visible: boolean;
  onClose: () => void;
  properties: HomeInfo[];
  activePropertyId: string | null;
  editingTask: Task | null;
  onSave: (task: {
    title: string;
    description?: string;
    category: TaskCategory;
    priority: TaskPriority;
    dueDate: string;
    propertyId?: string;
    recurring?: { frequency: 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'; interval: number };
  }) => void;
}

export function AddTaskModal({ visible, onClose, properties, activePropertyId, editingTask, onSave }: AddTaskModalProps) {
  const { colors } = useTheme();
  
  // Form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<TaskCategory>('hvac');
  const [priority, setPriority] = useState<TaskPriority>('medium');
  const [dueDate, setDueDate] = useState('');
  const [selectedPropertyId, setSelectedPropertyId] = useState<string | null>(null);
  const [isRecurring, setIsRecurring] = useState(false);
  const [frequency, setFrequency] = useState<'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'>('monthly');
  
  // Initialize selected property to active property
  useEffect(() => {
    setSelectedPropertyId(activePropertyId);
  }, [activePropertyId]);

  // Get today's date for default
  const today = new Date();
  const defaultDueDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
  const formattedDefault = defaultDueDate.toISOString().split('T')[0];

  // Populate form when editing a task
  useEffect(() => {
    if (editingTask) {
      setTitle(editingTask.title);
      setDescription(editingTask.description || '');
      setCategory(editingTask.category);
      setPriority(editingTask.priority);
      setDueDate(editingTask.dueDate);
      setSelectedPropertyId(editingTask.propertyId || activePropertyId);
      
      // Check for recurring - support both data structures
      if (editingTask.recurring) {
        setIsRecurring(true);
        setFrequency(editingTask.recurring.frequency);
      } else if (editingTask.isRecurring && editingTask.recurringFrequency) {
        setIsRecurring(true);
        // Map template frequencies to form frequencies
        const freqMap: Record<string, 'daily' | 'weekly' | 'monthly' | 'quarterly' | 'yearly'> = {
          'monthly': 'monthly',
          'quarterly': 'quarterly',
          'semi-annual': 'quarterly', // Map semi-annual to quarterly
          'annual': 'yearly',
        };
        setFrequency(freqMap[editingTask.recurringFrequency] || 'monthly');
      } else {
        setIsRecurring(false);
      }
    } else {
      // Reset form for new task
      setTitle('');
      setDescription('');
      setCategory('hvac');
      setPriority('medium');
      setDueDate('');
      setIsRecurring(false);
    }
  }, [editingTask, activePropertyId]);

  const categories: TaskCategory[] = [
    'hvac', 'plumbing', 'electrical', 'roofing', 'exterior',
    'interior', 'appliances', 'safety', 'landscaping', 'cleaning', 'pest_control', 'other'
  ];

  const priorities: { key: TaskPriority; label: string; color: string }[] = [
    { key: 'urgent', label: 'Urgent', color: colors.error },
    { key: 'high', label: 'High', color: colors.warning },
    { key: 'medium', label: 'Medium', color: colors.info },
    { key: 'low', label: 'Low', color: colors.textTertiary },
  ];

  const handleSave = () => {
    if (!title.trim()) return;

    onSave({
      title: title.trim(),
      description: description.trim() || undefined,
      category,
      priority,
      dueDate: dueDate || formattedDefault,
      propertyId: selectedPropertyId || undefined,
      recurring: isRecurring ? { frequency, interval: 1 } : undefined,
    });

    // Reset form
    setTitle('');
    setDescription('');
    setCategory('hvac');
    setPriority('medium');
    setDueDate('');
    setIsRecurring(false);
    setFrequency('monthly');

    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={0}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={styles.container} edges={['top']}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <Pressable onPress={onClose} style={styles.headerButton}>
              <Ionicons name="close" size={24} color={colors.textSecondary} />
            </Pressable>
            <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{editingTask ? 'Edit Task' : 'New Task'}</Text>
            <Pressable 
              onPress={handleSave}
              style={[styles.headerButton, styles.saveButton, { backgroundColor: colors.primary }]}
              disabled={!title.trim()}
            >
              <Text style={styles.saveText}>Save</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
            {/* Title */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Task Name *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                value={title}
                onChangeText={setTitle}
                placeholder="e.g., Replace HVAC filter"
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Description */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Notes (optional)</Text>
              <TextInput
                style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add details..."
                placeholderTextColor={colors.textTertiary}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Property */}
            {properties.length > 1 && (
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Property</Text>
                <View style={styles.optionsRow}>
                  {properties.map(property => (
                    <Pressable
                      key={property.id}
                      style={[
                        styles.propertyChip,
                        { backgroundColor: colors.surface, borderColor: colors.border },
                        selectedPropertyId === property.id && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                      ]}
                      onPress={() => setSelectedPropertyId(property.id || null)}
                    >
                      <Ionicons name="home" size={14} color={selectedPropertyId === property.id ? colors.primary : colors.textSecondary} />
                      <Text
                        style={[
                          styles.optionText,
                          { color: colors.textSecondary },
                          selectedPropertyId === property.id && { color: colors.primary, fontWeight: '600' },
                        ]}
                      >
                        {property.name || property.address || 'Property'}
                      </Text>
                    </Pressable>
                  ))}
                </View>
              </View>
            )}

            {/* Category */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
              <View style={styles.optionsGrid}>
                {categories.map(cat => (
                  <Pressable
                    key={cat}
                    style={[
                      styles.optionChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      category === cat && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                    ]}
                    onPress={() => setCategory(cat)}
                  >
                    <Text
                      style={[
                        styles.optionText,
                        { color: colors.textSecondary },
                        category === cat && { color: colors.primary, fontWeight: '600' },
                      ]}
                    >
                      {TaskCategoryLabels[cat]}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Priority */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Priority</Text>
              <View style={styles.optionsRow}>
                {priorities.map(p => (
                  <Pressable
                    key={p.key}
                    style={[
                      styles.priorityChip,
                      { backgroundColor: colors.surface, borderColor: colors.border },
                      priority === p.key && { backgroundColor: p.color + '20', borderColor: p.color },
                    ]}
                    onPress={() => setPriority(p.key)}
                  >
                    <View style={[styles.priorityDot, { backgroundColor: p.color }]} />
                    <Text
                      style={[
                        styles.priorityText,
                        { color: colors.textSecondary },
                        priority === p.key && { color: p.color, fontWeight: '600' },
                      ]}
                    >
                      {p.label}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Due Date */}
            <DatePickerField
              label="Due Date"
              value={dueDate}
              onChange={setDueDate}
              placeholder="Select due date"
            />

            {/* Recurring */}
            <View style={styles.field}>
              <Pressable
                style={[styles.toggleRow, { backgroundColor: colors.surface }]}
                onPress={() => setIsRecurring(!isRecurring)}
              >
                <View style={styles.toggleLeft}>
                  <Ionicons name="repeat" size={20} color={colors.primary} />
                  <Text style={[styles.toggleLabel, { color: colors.textPrimary }]}>Recurring Task</Text>
                </View>
                <View style={[styles.toggleSwitch, { backgroundColor: isRecurring ? colors.primary : colors.gray300 }]}>
                  <View style={[styles.toggleKnob, { backgroundColor: colors.white }]} />
                </View>
              </Pressable>
              
              {isRecurring && (
                <View style={styles.recurringOptions}>
                  <Text style={[styles.label, { color: colors.textSecondary }]}>Repeat Every</Text>
                  <View style={styles.optionsRow}>
                    {(['daily', 'weekly', 'monthly', 'quarterly', 'yearly'] as const).map(freq => (
                      <Pressable
                        key={freq}
                        style={[
                          styles.optionChip,
                          styles.smallChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          frequency === freq && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                        ]}
                        onPress={() => setFrequency(freq)}
                      >
                        <Text
                          style={[
                            styles.optionText,
                            { color: colors.textSecondary, fontSize: 12 },
                            frequency === freq && { color: colors.primary, fontWeight: '600' },
                          ]}
                        >
                          {freq.charAt(0).toUpperCase() + freq.slice(1)}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </View>
              )}
            </View>
          </ScrollView>
        </SafeAreaView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  saveText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 15,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  field: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  propertyChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
  },
  smallChip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
  },
  optionText: {
    fontSize: 14,
  },
  priorityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    gap: 6,
  },
  priorityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  priorityText: {
    fontSize: 14,
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 14,
    borderRadius: 10,
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  toggleLabel: {
    fontSize: 15,
    fontWeight: '500',
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleKnob: {
    width: 20,
    height: 20,
    borderRadius: 10,
  },
  recurringOptions: {
    marginTop: 12,
    paddingLeft: 8,
  },
});