// ============================================
// HOMEKEEPER - Date Picker Field Component
// ============================================

import { View, Text, StyleSheet, TouchableOpacity, Platform, Modal } from 'react-native';
import { useState } from 'react';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { useTheme } from '../contexts/ThemeContext';

interface DatePickerFieldProps {
  label: string;
  value: string; // ISO date string (YYYY-MM-DD)
  onChange: (date: string) => void;
  placeholder?: string;
  required?: boolean;
  hint?: string;
  minimumDate?: Date;
  maximumDate?: Date;
  style?: any;
}

export function DatePickerField({
  label,
  value,
  onChange,
  placeholder = 'Select date',
  required = false,
  hint,
  minimumDate,
  maximumDate,
  style,
}: DatePickerFieldProps) {
  const { colors, isDark } = useTheme();
  const styles = createStyles(colors);
  const [showPicker, setShowPicker] = useState(false);
  const [tempDate, setTempDate] = useState(() => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        return new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
      }
    }
    return new Date();
  });

  const maxDate = maximumDate || new Date(new Date().getFullYear() + 10, 11, 31);

  const displayDate = value ? formatDateDisplay(value) : '';

  function formatDateDisplay(dateStr: string): string {
    const parts = dateStr.split('-');
    if (parts.length !== 3) return dateStr;
    const date = new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2]));
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  function formatDateLocal(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  const handleChange = (event: any, selectedDate?: Date) => {
    if (Platform.OS === 'ios') {
      if (selectedDate) {
        setTempDate(selectedDate);
      }
    } else {
      setShowPicker(false);
      if (event.type === 'set' && selectedDate) {
        onChange(formatDateLocal(selectedDate));
      }
    }
  };

  const handleIOSConfirm = () => {
    onChange(formatDateLocal(tempDate));
    setShowPicker(false);
  };

  const handleIOSCancel = () => {
    setShowPicker(false);
  };

  const handleOpen = () => {
    if (value) {
      const parts = value.split('-');
      if (parts.length === 3) {
        setTempDate(new Date(parseInt(parts[0]), parseInt(parts[1]) - 1, parseInt(parts[2])));
      }
    }
    setShowPicker(true);
  };

  return (
    <View style={[styles.container, style]}>
      <Text style={styles.label}>
        {label}
        {required && <Text style={styles.required}> *</Text>}
      </Text>
      
      <TouchableOpacity style={styles.inputWrapper} onPress={handleOpen}>
        <Text style={[styles.inputText, !value && styles.placeholder]}>
          {displayDate || placeholder}
        </Text>
        <Ionicons name="calendar-outline" size={20} color={colors.textSecondary} />
      </TouchableOpacity>
      
      {hint && <Text style={styles.hint}>{hint}</Text>}

      {Platform.OS === 'ios' ? (
        <Modal
          visible={showPicker}
          transparent
          animationType="slide"
          onRequestClose={handleIOSCancel}
          statusBarTranslucent
        >
          <View style={styles.modalOverlay}>
            <TouchableOpacity
              style={styles.backdrop}
              activeOpacity={1}
              onPress={handleIOSCancel}
            />
            <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
              <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
                <TouchableOpacity onPress={handleIOSCancel} style={styles.headerButton}>
                  <Text style={styles.cancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={[styles.modalTitle, { color: colors.textPrimary }]}>{label}</Text>
                <TouchableOpacity onPress={handleIOSConfirm} style={styles.headerButton}>
                  <Text style={styles.confirmButton}>Done</Text>
                </TouchableOpacity>
              </View>
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={tempDate}
                  mode="date"
                  display="inline"
                  onChange={handleChange}
                  minimumDate={minimumDate}
                  maximumDate={maxDate}
                  themeVariant={isDark ? "dark" : "light"}
                  accentColor={colors.primary}
                />
              </View>
            </View>
          </View>
        </Modal>
      ) : (
        showPicker && (
          <DateTimePicker
            value={tempDate}
            mode="date"
            display="default"
            onChange={handleChange}
            minimumDate={minimumDate}
            maximumDate={maximumDate}
          />
        )
      )}
    </View>
  );
}

const createStyles = (colors: any) => StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textSecondary,
    marginBottom: 8,
  },
  required: {
    color: colors.error,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    minHeight: 48,
  },
  inputText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  placeholder: {
    color: colors.textTertiary,
  },
  hint: {
    fontSize: 12,
    color: colors.textTertiary,
    marginTop: 4,
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  modalContent: {
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 34,
  },
  modalHeader: {
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
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    fontSize: 16,
    color: colors.textSecondary,
  },
  confirmButton: {
    fontSize: 16,
    color: colors.primary,
    fontWeight: '600',
  },
  pickerContainer: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
});