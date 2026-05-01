import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, Pressable, KeyboardAvoidingView, Platform, ScrollView, TouchableOpacity, Keyboard } from 'react-native';
import { useTheme } from '../contexts/ThemeContext';
import { HomeInfo } from '../contexts/AppContext';
import { geocodeAddress } from '../lib/hereSearch';
import { autocompleteAddress, AddressSuggestion } from '../lib/zestimate';

interface AddPropertyModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (property: Omit<HomeInfo, 'id'>) => void;
  initialProperty?: HomeInfo | null;
}

export function AddPropertyModal({ visible, onClose, onSave, initialProperty }: AddPropertyModalProps) {
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Populate form when initialProperty changes
  useEffect(() => {
    if (initialProperty) {
      setName(initialProperty.name || '');
      setAddress(initialProperty.address || '');
      setCity(initialProperty.city || '');
      setState(initialProperty.state || '');
      setZip(initialProperty.zip || '');
      setPurchasePrice(initialProperty.purchasePrice?.toString() || '');
      setSquareFeet(initialProperty.squareFeet?.toString() || '');
      setYearBuilt(initialProperty.yearBuilt?.toString() || '');
    } else {
      setName('');
      setAddress('');
      setCity('');
      setState('');
      setZip('');
      setPurchasePrice('');
      setSquareFeet('');
      setYearBuilt('');
    }
    setSuggestions([]);
    setShowSuggestions(false);
  }, [initialProperty]);

  // Address autocomplete
  useEffect(() => {
    if (!address || address.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        console.log('[AddPropertyModal] Fetching autocomplete for:', address);
        const results = await autocompleteAddress(address);
        console.log('[AddPropertyModal] Got', results.length, 'suggestions:', results);
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (e) {
        console.error('[AddPropertyModal] Autocomplete error:', e);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [address]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    console.log('=== SUGGESTION TAPPED ===');
    
    // Hide suggestions immediately
    setShowSuggestions(false);
    setSuggestions([]);
    Keyboard.dismiss();
    
    // Set all values
    setAddress(suggestion.street || suggestion.label.split(',')[0] || '');
    if (suggestion.city) setCity(suggestion.city);
    if (suggestion.state) setState(suggestion.state);
    if (suggestion.postalCode) setZip(suggestion.postalCode);
  };

  const handleSave = async () => {
    // Geocode the address to get coordinates for climate zone detection
    let coords = null;
    if (zip.trim()) {
      coords = await geocodeAddress(zip.trim());
      if (!coords && address.trim() && city.trim()) {
        const fullAddress = `${address.trim()}, ${city.trim()}, ${state.trim() || 'NJ'} ${zip.trim()}`;
        coords = await geocodeAddress(fullAddress);
      }
    }
    
    onSave({
      name: name.trim() || undefined,
      address: address.trim() || undefined,
      city: city.trim() || undefined,
      state: state.trim().toUpperCase() || undefined,
      zip: zip.trim() || undefined,
      lat: coords?.lat,
      lng: coords?.lng,
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
    setSuggestions([]);
    setShowSuggestions(false);
    
    onClose();
  };

  const isValid = address.trim() && city.trim();

  if (!visible) return null;

  return (
    <View style={styles.overlay}>
      <Pressable style={styles.backdrop} onPress={onClose} />
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <View style={[styles.modal, { backgroundColor: colors.surface }]}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.textPrimary }]}>
              {initialProperty ? 'Edit Property' : 'Add Property'}
            </Text>
            <Pressable onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Text style={[styles.cancelBtn, { color: colors.primary }]}>Cancel</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.form} showsVerticalScrollIndicator={false} nestedScrollEnabled keyboardShouldPersistTaps="handled">
            {/* Property Name */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Property Name (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={name}
                onChangeText={setName}
                placeholder="e.g., Main Home, Beach House"
                placeholderTextColor={colors.textTertiary}
                autoCapitalize="words"
              />
            </View>

            {/* Address with autocomplete */}
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={address}
                onChangeText={setAddress}
                placeholder="Start typing address..."
                placeholderTextColor={colors.textTertiary}
              />
            </View>

            {/* Suggestions Dropdown - rendered outside modal for proper z-index */}
            {showSuggestions && suggestions.length > 0 && (
              <View style={[styles.suggestionsContainer, { backgroundColor: colors.background, borderColor: colors.border }]}>
                <ScrollView nestedScrollEnabled keyboardShouldPersistTaps="handled" style={styles.suggestionsScroll}>
                  {suggestions.map((item, index) => (
                    <TouchableOpacity
                      key={item.label + index}
                      style={styles.suggestionItem}
                      onPress={() => handleSelectSuggestion(item)}
                      activeOpacity={0.6}
                    >
                      <Text style={[styles.suggestionText, { color: colors.textPrimary }]} numberOfLines={2}>
                        {item.label}
                      </Text>
                      {item.city && item.state && (
                        <Text style={[styles.suggestionSubtext, { color: colors.textSecondary }]}>
                          {item.city}, {item.state} {item.postalCode}
                        </Text>
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            {/* City, State, ZIP row */}
            <View style={styles.row}>
              <View style={[styles.field, styles.cityField]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>City *</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={city}
                  onChangeText={setCity}
                  placeholder="Waldwick"
                  placeholderTextColor={colors.textTertiary}
                  autoCapitalize="words"
                />
              </View>
              <View style={[styles.field, styles.stateField]}>
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
              <View style={[styles.field, styles.zipField]}>
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
            <View style={styles.field}>
              <Text style={[styles.label, { color: colors.textSecondary }]}>Purchase Price (for equity tracking)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={purchasePrice}
                onChangeText={setPurchasePrice}
                placeholder="500000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
            </View>

            {/* Sq Ft & Year Built row */}
            <View style={styles.row}>
              <View style={[styles.field, styles.halfField]}>
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
              <View style={[styles.field, styles.halfField]}>
                <Text style={[styles.label, { color: colors.textSecondary }]}>Year Built</Text>
                <TextInput
                  style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                  value={yearBuilt}
                  onChangeText={setYearBuilt}
                  placeholder="1990"
                  placeholderTextColor={colors.textTertiary}
                  keyboardType="number-pad"
                  maxLength={4}
                />
              </View>
            </View>
          </ScrollView>

          {/* Save Button */}
          <Pressable
            style={[styles.saveBtn, { backgroundColor: isValid ? colors.primary : colors.gray300 }]}
            onPress={handleSave}
            disabled={!isValid}
          >
            <Text style={[styles.saveBtnText, { color: isValid ? colors.white : colors.textTertiary }]}>
              {initialProperty ? 'Save Changes' : 'Add Property'}
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    zIndex: 1000,
  },
  backdrop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 34,
    maxHeight: '85%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  cancelBtn: {
    fontSize: 16,
    fontWeight: '600',
  },
  form: {
    maxHeight: 400,
  },
  field: {
    marginBottom: 12,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 6,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    fontSize: 16,
  },
  suggestionsContainer: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    maxHeight: 200,
    overflow: 'hidden',
  },
  suggestionsScroll: {
    flexGrow: 0,
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionText: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
  suggestionSubtext: {
    fontSize: 12,
    marginTop: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
  },
  cityField: {
    flex: 1,
  },
  stateField: {
    width: 70,
  },
  zipField: {
    width: 90,
  },
  halfField: {
    flex: 1,
  },
  saveBtn: {
    marginTop: 16,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  saveBtnText: {
    fontSize: 16,
    fontWeight: '600',
  },
});