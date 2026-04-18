import { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { HomeInfo } from '../contexts/AppContext';

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (property: Omit<HomeInfo, 'id'>) => void;
}

export function AddPropertyModal({ visible, onClose, onSave }: AddPropertyModalProps) {
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');

  const handleSave = () => {
    onSave({
      name: name.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim().toUpperCase() || undefined,
      zip: zip.trim() || undefined,
      purchasePrice: purchasePrice ? parseInt(purchasePrice) : undefined,
      squareFeet: squareFeet ? parseInt(squareFeet) : undefined,
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
    });
    
    // Reset form
    setName('');
    setAddress('');
    setCity('');
    setState('');
    setZip('');
    setPurchasePrice('');
    setSquareFeet('');
    setYearBuilt('');
    
    onClose();
  };

  const isValid = address.trim() && city.trim();

  if (!visible) return null;

  return (
    <Pressable style={styles.overlay} onPress={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <Pressable style={[styles.modal, { backgroundColor: colors.surface }]} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>Add Property</Text>
            <Pressable onPress={onClose}>
              <Text style={[styles.cancelBtn, { color: colors.textSecondary }]}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Property Name (Optional) */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Property Name (Optional)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Main Home, Beach House"
              placeholderTextColor={colors.textTertiary}
            />

            {/* Address */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              value={address}
              onChangeText={setAddress}
              placeholder="123 Main St"
              placeholderTextColor={colors.textTertiary}
            />

            {/* City, State, ZIP */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Waldwick"
                  placeholderTextColor={colors.textTertiary}
                />
              </View>
              <View style={styles.quarterWidth}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>State</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={state}
                  onChangeText={(t) => setState(t.toUpperCase())}
                  placeholder="NJ"
                  placeholderTextColor={colors.textTertiary}
                  maxLength={2}
                  autoCapitalize="characters"
                />
              </View>
              <View style={styles.quarterWidth}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>ZIP</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={zip}
                  onChangeText={setZip}
                  placeholder="07463"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={5}
                />
              </View>
            </View>

            {/* Purchase Price */}
            <Text style={[styles.label, { color: colors.textSecondary }]}>Purchase Price</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="500000"
              placeholderTextColor={colors.textTertiary}
              keyboardType="number-pad"
            />

            {/* Sq Ft & Year Built */}
            <View style={styles.row}>
              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Square Feet</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={squareFeet}
                  onChangeText={setSquareFeet}
                  placeholder="2000"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                />
              </View>
              <View style={styles.halfWidth}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Year Built</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={yearBuilt}
                  onChangeText={setYearBuilt}
                  placeholder="1990"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                />
              </View>
            </View>
          </ScrollView>

          <Pressable
            style={[styles.saveBtn, { backgroundColor: isValid ? colors.primary : colors.gray300 }]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={[styles.saveBtnText, { color: isValid ? colors.white : colors.textTertiary }]}>Add Property</Text>
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
    zIndex: 1000,
  },
  keyboardView: {
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelBtn: {
    fontSize: 16,
  },
  form: {
    maxHeight: 400,
  },
  label: {
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 6,
    marginTop: 12,
  },
  input: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  halfWidth: {
    flex: 1,
  },
  quarterWidth: {
    flex: 0.5,
  },
  saveBtn: {
    marginTop: 20,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});