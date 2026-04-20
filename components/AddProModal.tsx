// ============================================
// HOMEKEEPER - Add Pro Modal
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export interface ProFormData {
  name: string;
  category: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
}

export interface SavedPro {
  id: string;
  name: string;
  category: string;
  phone?: string;
  email?: string;
  company?: string;
  notes?: string;
  createdAt: string;
}

interface AddProModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (pro: ProFormData) => void;
  initialCategory?: string;
  editingPro?: SavedPro | null;
}

const PRO_CATEGORIES = [
  { key: 'plumber', label: 'Plumber', icon: 'water' as const },
  { key: 'electrician', label: 'Electrician', icon: 'flash' as const },
  { key: 'hvac', label: 'HVAC Tech', icon: 'thermometer' as const },
  { key: 'landscaper', label: 'Landscaper', icon: 'leaf' as const },
  { key: 'cleaner', label: 'Cleaner', icon: 'sparkles' as const },
  { key: 'handyman', label: 'Handyman', icon: 'construct' as const },
  { key: 'pest', label: 'Pest Control', icon: 'bug' as const },
  { key: 'roofer', label: 'Roofer', icon: 'home' as const },
  { key: 'painter', label: 'Painter', icon: 'brush' as const },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' as const },
];

export function AddProModal({ visible, onClose, onSave, initialCategory, editingPro }: AddProModalProps) {
  const { colors } = useTheme();

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState(initialCategory || 'handyman');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [company, setCompany] = useState('');
  const [notes, setNotes] = useState('');

  // Sync category when initialCategory changes
  useEffect(() => {
    if (initialCategory) {
      setCategory(initialCategory);
    }
  }, [initialCategory]);

  // Populate form when editing
  useEffect(() => {
    if (editingPro) {
      setName(editingPro.name);
      setCategory(editingPro.category);
      setPhone(editingPro.phone || '');
      setEmail(editingPro.email || '');
      setCompany(editingPro.company || '');
      setNotes(editingPro.notes || '');
    } else {
      // Reset form for new pro
      setName('');
      setCategory(initialCategory || 'handyman');
      setPhone('');
      setEmail('');
      setCompany('');
      setNotes('');
    }
  }, [editingPro, initialCategory]);

  const handleSave = () => {
    if (!name.trim()) return;

    onSave({
      name: name.trim(),
      category,
      phone: phone.trim() || undefined,
      email: email.trim() || undefined,
      company: company.trim() || undefined,
      notes: notes.trim() || undefined,
    });

    // Reset form
    setName('');
    setCategory('handyman');
    setPhone('');
    setEmail('');
    setCompany('');
    setNotes('');

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
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: colors.border }]}>
              <Pressable onPress={onClose} style={styles.headerButton}>
                <Ionicons name="close" size={24} color={colors.textSecondary} />
              </Pressable>
              <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>{editingPro ? 'Edit Pro' : 'Add Pro'}</Text>
              <Pressable
                onPress={handleSave}
                style={[styles.headerButton, styles.saveButton, { backgroundColor: colors.primary }]}
                disabled={!name.trim()}
              >
                <Text style={styles.saveText}>Save</Text>
              </Pressable>
            </View>

            <ScrollView style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
              {/* Name */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Name *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g., John Smith"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>

              {/* Category */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Type</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.categoryRow}>
                    {PRO_CATEGORIES.map(cat => (
                      <Pressable
                        key={cat.key}
                        style={[
                          styles.categoryChip,
                          { backgroundColor: colors.surface, borderColor: colors.border },
                          category === cat.key && { backgroundColor: colors.primary + '20', borderColor: colors.primary },
                        ]}
                        onPress={() => setCategory(cat.key)}
                      >
                        <Ionicons
                          name={cat.icon}
                          size={18}
                          color={category === cat.key ? colors.primary : colors.textTertiary}
                        />
                        <Text
                          style={[
                            styles.categoryText,
                            { color: colors.textSecondary },
                            category === cat.key && { color: colors.primary, fontWeight: '600' },
                          ]}
                        >
                          {cat.label}
                        </Text>
                      </Pressable>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Company */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Company (optional)</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  value={company}
                  onChangeText={setCompany}
                  placeholder="Company name"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>

              {/* Phone */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Phone</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  value={phone}
                  onChangeText={(text) => {
                    // Format phone as user types: (555) 123-4567
                    const digits = text.replace(/\D/g, '');
                    let formatted = digits;
                    if (digits.length > 0) {
                      formatted = '(' + digits.substring(0, 3);
                    }
                    if (digits.length > 3) {
                      formatted += ') ' + digits.substring(3, 6);
                    }
                    if (digits.length > 6) {
                      formatted += '-' + digits.substring(6, 10);
                    }
                    setPhone(formatted);
                  }}
                  placeholder="(555) 123-4567"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="phone-pad"
                  maxLength={14}
                />
              </View>

              {/* Email */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Email</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="email@example.com"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              </View>

              {/* Notes */}
              <View style={styles.field}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
                <TextInput
                  style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
                  value={notes}
                  onChangeText={setNotes}
                  placeholder="Add notes about this contractor..."
                  placeholderTextColor={colors.textTertiary}
                  multiline
                  numberOfLines={4}
                />
              </View>
            </ScrollView>
          </SafeAreaView>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  keyboardView: {
    flex: 1,
  },
  container: {
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
    minHeight: 100,
    textAlignVertical: 'top',
  },
  categoryRow: {
    flexDirection: 'row',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
  },
});