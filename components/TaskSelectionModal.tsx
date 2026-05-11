import { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  Modal,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { TASK_TEMPLATES, TaskTemplate, TASK_TEMPLATES_BY_FREQUENCY } from '../lib/taskTemplates';

interface TaskSelectionModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (selectedTemplateIds: string[]) => void;
  propertyName?: string;
}

export function TaskSelectionModal({ visible, onClose, onConfirm, propertyName }: TaskSelectionModalProps) {
  const { colors } = useTheme();
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedFrequency, setSelectedFrequency] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const frequencies = [
    { key: 'all', label: 'All' },
    { key: 'monthly', label: 'Monthly' },
    { key: 'quarterly', label: 'Quarterly' },
    { key: 'semi-annual', label: '6 Mo' },
    { key: 'annual', label: 'Yearly' },
  ];

  const filteredTemplates = useMemo(() => {
    let templates = selectedFrequency === 'all'
      ? TASK_TEMPLATES
      : TASK_TEMPLATES_BY_FREQUENCY[selectedFrequency as keyof typeof TASK_TEMPLATES_BY_FREQUENCY] || [];

    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      templates = templates.filter(t =>
        t.title.toLowerCase().includes(query) ||
        t.description?.toLowerCase().includes(query) ||
        t.category.toLowerCase().includes(query)
      );
    }

    return templates;
  }, [selectedFrequency, searchQuery]);

  // Reset selection when modal opens
  useEffect(() => {
    if (visible) {
      setSelectedIds(new Set());
      setSelectedFrequency('all');
      setSearchQuery('');
    }
  }, [visible]);

  const toggleTask = (templateId: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (next.has(templateId)) {
        next.delete(templateId);
      } else {
        next.add(templateId);
      }
      return next;
    });
  };

  const selectAll = () => {
    setSelectedIds(new Set(TASK_TEMPLATES.map(t => t.id)));
  };

  const deselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleConfirm = () => {
    onConfirm(Array.from(selectedIds));
    onClose();
  };

  const getCategoryIcon = (category: string): string => {
    const icons: Record<string, string> = {
      hvac: 'thermometer',
      plumbing: 'water',
      electrical: 'bulb',
      appliances: 'cube',
      safety: 'shield-checkmark',
      exterior: 'home',
      interior: 'bed',
      roofing: 'home',
      landscaping: 'leaf',
      pest_control: 'bug',
    };
    return icons[category] || 'construct';
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.header}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.title, { color: colors.textPrimary }]}>Add Tasks</Text>
          <View style={styles.closeButton} />
        </View>

        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {propertyName ? `Select maintenance tasks for ${propertyName}` : 'Select maintenance tasks to add'}
        </Text>

        {/* Filter tabs */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={styles.filterContainer}
          contentContainerStyle={styles.filterContent}
        >
          {frequencies.map(freq => (
            <Pressable
              key={freq.key}
              style={[
                styles.filterTab,
                { backgroundColor: selectedFrequency === freq.key ? colors.primary : colors.surface },
              ]}
              onPress={() => setSelectedFrequency(freq.key)}
            >
              <Text style={[
                styles.filterText,
                { color: selectedFrequency === freq.key ? 'white' : colors.textSecondary }
              ]}>
                {freq.label}
              </Text>
            </Pressable>
          ))}
        </ScrollView>

        {/* Search */}
        <View style={[styles.searchContainer, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, { color: colors.textPrimary }]}
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search tasks..."
            placeholderTextColor={colors.textTertiary}
            autoCapitalize="none"
            autoCorrect={false}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
            </Pressable>
          )}
        </View>

        {/* Select all / none */}
        <View style={styles.selectionRow}>
          <Pressable onPress={selectAll} style={styles.selectionButton}>
            <Text style={[styles.selectionText, { color: colors.primary }]}>Select All</Text>
          </Pressable>
          <Pressable onPress={deselectAll} style={styles.selectionButton}>
            <Text style={[styles.selectionText, { color: colors.textSecondary }]}>Deselect All</Text>
          </Pressable>
        </View>

        {/* Task list */}
        <ScrollView style={styles.list} contentContainerStyle={styles.listContent}>
          {filteredTemplates.map(template => {
            const isSelected = selectedIds.has(template.id);
            return (
              <Pressable
                key={template.id}
                style={[
                  styles.taskItem,
                  {
                    backgroundColor: colors.surface,
                    borderColor: isSelected ? colors.primary : colors.border,
                    borderWidth: isSelected ? 2 : 1,
                  }
                ]}
                onPress={() => toggleTask(template.id)}
              >
                <View style={styles.taskCheck}>
                  <Ionicons
                    name={isSelected ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={isSelected ? colors.primary : colors.textTertiary}
                  />
                </View>
                <Ionicons
                  name={getCategoryIcon(template.category) as any}
                  size={20}
                  color={colors.textSecondary}
                  style={styles.taskIcon}
                />
                <View style={styles.taskContent}>
                  <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>
                    {template.title}
                  </Text>
                  <Text style={[styles.taskMeta, { color: colors.textTertiary }]}>
                    {template.frequency.charAt(0).toUpperCase() + template.frequency.slice(1)} • {template.estimatedMinutes} min
                  </Text>
                </View>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.countText, { color: colors.textSecondary }]}>
            {selectedIds.size} task{selectedIds.size !== 1 ? 's' : ''} selected
          </Text>
          <Pressable
            style={[
              styles.confirmButton,
              { backgroundColor: selectedIds.size > 0 ? colors.primary : colors.gray300 }
            ]}
            onPress={handleConfirm}
            disabled={selectedIds.size === 0}
          >
            <Text style={styles.confirmText}>Add Tasks</Text>
          </Pressable>
        </View>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 15,
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  filterContainer: {
    maxHeight: 44,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
  },
  filterText: {
    fontSize: 14,
    fontWeight: '600',
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 16,
    marginVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
  },
  clearButton: {
    padding: 4,
  },
  selectionRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 16,
  },
  selectionButton: {
    paddingVertical: 4,
  },
  selectionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  list: {
    flex: 1,
  },
  listContent: {
    padding: 16,
    paddingTop: 8,
  },
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    marginBottom: 8,
  },
  taskCheck: {
    marginRight: 12,
  },
  taskIcon: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 2,
  },
  taskMeta: {
    fontSize: 12,
  },
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  countText: {
    fontSize: 15,
  },
  confirmButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
  },
  confirmText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
});