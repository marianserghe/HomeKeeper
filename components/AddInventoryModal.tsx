// ============================================
// HOMEKEEPER - Add Inventory Modal
// ============================================

import { useState } from 'react';
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
  Image,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../contexts/ThemeContext';
import { InventoryCategory } from '../contexts/AppContext';
import { DatePickerField } from './DatePickerField';

interface AddInventoryModalProps {
  visible: boolean;
  onClose: () => void;
  onSave: (item: {
    name: string;
    category: InventoryCategory;
    location?: string;
    purchaseDate?: string;
    purchasePrice?: number;
    warrantyExpiry?: string;
    notes?: string;
    photos?: string[];
  }) => void;
}

const INVENTORY_CATEGORIES: { key: InventoryCategory; label: string; icon: string }[] = [
  { key: 'appliances', label: 'Appliances', icon: 'cube' },
  { key: 'furniture', label: 'Furniture', icon: 'bed' },
  { key: 'electronics', label: 'Electronics', icon: 'tv' },
  { key: 'tools', label: 'Tools', icon: 'construct' },
  { key: 'documents', label: 'Documents', icon: 'document-text' },
  { key: 'outdoor', label: 'Outdoor', icon: 'leaf' },
  { key: 'other', label: 'Other', icon: 'ellipsis-horizontal' },
];

export function AddInventoryModal({ visible, onClose, onSave }: AddInventoryModalProps) {
  const { colors } = useTheme();
  
  const [name, setName] = useState('');
  const [category, setCategory] = useState<InventoryCategory>('appliances');
  const [location, setLocation] = useState('');
  const [purchaseDate, setPurchaseDate] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [warrantyExpiry, setWarrantyExpiry] = useState('');
  const [notes, setNotes] = useState('');
  const [photos, setPhotos] = useState<string[]>([]);
  
  // Take photo with camera
  const takePhoto = async () => {
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Camera permission is required to take photos.');
      return;
    }
    
    const result = await ImagePicker.launchCameraAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6, // 60% quality for smaller size
    });
    
    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };
  
  // Pick from gallery
  const pickImage = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Denied', 'Photo library permission is required.');
      return;
    }
    
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [4, 3],
      quality: 0.6, // 60% quality for smaller size
      selectionLimit: 3 - photos.length, // Max 3 photos
    });
    
    if (!result.canceled) {
      const newUris = result.assets.map(asset => asset.uri);
      setPhotos([...photos, ...newUris].slice(0, 3));
    }
  };
  
  // Remove photo
  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };
  
  const handleSave = () => {
    if (!name.trim()) return;
    
    onSave({
      name: name.trim(),
      category,
      location: location.trim() || undefined,
      purchaseDate: purchaseDate.trim() || undefined,
      purchasePrice: purchasePrice ? parseFloat(purchasePrice) : undefined,
      warrantyExpiry: warrantyExpiry.trim() || undefined,
      notes: notes.trim() || undefined,
      photos: photos.length > 0 ? photos : undefined,
    });
    
    // Reset
    setName('');
    setCategory('appliances');
    setLocation('');
    setPurchaseDate('');
    setPurchasePrice('');
    setWarrantyExpiry('');
    setNotes('');
    setPhotos([]);
    
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
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <View style={{ flex: 1, backgroundColor: colors.background }}>
        <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        {/* Header */}
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.headerButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Add Item</Text>
          <Pressable 
            onPress={handleSave}
            style={[styles.headerButton, styles.saveButton, { backgroundColor: colors.primary }]}
            disabled={!name.trim()}
          >
            <Text style={styles.saveText}>Save</Text>
          </Pressable>
        </View>

        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
          {/* Name */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Item Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={name}
              onChangeText={setName}
              placeholder="e.g., Samsung Refrigerator"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Category */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Category</Text>
            <View style={styles.categoryGrid}>
              {INVENTORY_CATEGORIES.map(cat => (
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
                    name={cat.icon as any}
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
          </View>

          {/* Location */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Location</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={location}
              onChangeText={setLocation}
              placeholder="e.g., Kitchen, Garage, Living Room"
              placeholderTextColor={colors.textTertiary}
            />
          </View>

          {/* Purchase Date */}
          <DatePickerField
            label="Purchase Date"
            value={purchaseDate}
            onChange={setPurchaseDate}
            placeholder="Select purchase date"
          />

          {/* Purchase Price */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Purchase Price</Text>
            <TextInput
              style={[styles.input, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={purchasePrice}
              onChangeText={setPurchasePrice}
              placeholder="$0.00"
              placeholderTextColor={colors.textTertiary}
              keyboardType="decimal-pad"
            />
          </View>

          {/* Warranty Expiry */}
          <DatePickerField
            label="Warranty Expires"
            value={warrantyExpiry}
            onChange={setWarrantyExpiry}
            placeholder="Select warranty expiry"
          />

          {/* Notes */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Notes</Text>
            <TextInput
              style={[styles.input, styles.textArea, { backgroundColor: colors.surface, color: colors.textPrimary, borderColor: colors.border }]}
              value={notes}
              onChangeText={setNotes}
              placeholder="Serial number, model, etc."
              placeholderTextColor={colors.textTertiary}
              multiline
              numberOfLines={3}
            />
          </View>

          {/* Photos */}
          <View style={styles.field}>
            <Text style={[styles.label, { color: colors.textSecondary }]}>Photos ({photos.length}/3)</Text>
            <View style={styles.photoRow}>
              {photos.map((uri, index) => (
                <View key={index} style={[styles.photoContainer, { borderColor: colors.border }]}>
                  <Image source={{ uri }} style={styles.photoThumbnail} />
                  <Pressable 
                    style={[styles.removePhotoBtn, { backgroundColor: colors.error }]}
                    onPress={() => removePhoto(index)}
                  >
                    <Ionicons name="close" size={14} color={colors.white} />
                  </Pressable>
                </View>
              ))}
              {photos.length < 3 && (
                <Pressable 
                  style={[styles.addPhotoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={takePhoto}
                >
                  <Ionicons name="camera" size={24} color={colors.textTertiary} />
                </Pressable>
              )}
              {photos.length < 3 && (
                <Pressable 
                  style={[styles.addPhotoBtn, { backgroundColor: colors.surface, borderColor: colors.border }]}
                  onPress={pickImage}
                >
                  <Ionicons name="images" size={24} color={colors.textTertiary} />
                </Pressable>
              )}
            </View>
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
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
  },
  photoRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  photoContainer: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    overflow: 'hidden',
    position: 'relative',
  },
  photoThumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  removePhotoBtn: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addPhotoBtn: {
    width: 80,
    height: 80,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
});