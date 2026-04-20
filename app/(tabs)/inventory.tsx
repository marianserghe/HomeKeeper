import { useState, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useInventory } from '../../contexts/AppContext';
import { InventoryItem, InventoryCategory } from '../../contexts/AppContext';
import { AddInventoryModal } from '../../components/AddInventoryModal';

const CATEGORY_ICONS: Record<InventoryCategory, string> = {
  appliances: 'cube',
  furniture: 'bed',
  electronics: 'tv',
  tools: 'construct',
  documents: 'document-text',
  outdoor: 'leaf',
  other: 'ellipsis-horizontal',
};

const CATEGORY_LABELS: Record<InventoryCategory, string> = {
  appliances: 'Appliances',
  furniture: 'Furniture',
  electronics: 'Electronics',
  tools: 'Tools',
  documents: 'Documents',
  outdoor: 'Outdoor',
  other: 'Other',
};

export default function InventoryScreen() {
  const { colors } = useTheme();
  const { inventory, addInventoryItem, updateInventoryItem, deleteInventoryItem } = useInventory();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<InventoryCategory | 'all'>('all');
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset to defaults when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setSelectedCategory('all');
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Filter inventory
  const filteredInventory = selectedCategory === 'all' 
    ? inventory 
    : inventory.filter(item => item.category === selectedCategory);

  // Group by category
  const groupedInventory = inventory.reduce((acc, item) => {
    if (!acc[item.category]) acc[item.category] = [];
    acc[item.category].push(item);
    return acc;
  }, {} as Record<InventoryCategory, InventoryItem[]>);

  // Calculate totals
  const totalValue = inventory.reduce((sum, item) => sum + (item.purchasePrice || 0), 0);

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Item',
      `Remove ${name} from inventory?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteInventoryItem(id) },
      ]
    );
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount);
  };

  const InventoryItemCard = ({ item }: { item: InventoryItem }) => (
    <Pressable
      style={[styles.itemCard, { backgroundColor: colors.surface }]}
      onLongPress={() => handleDelete(item.id, item.name)}
    >
      <View style={styles.itemHeader}>
        <View style={[styles.itemIcon, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons
            name={CATEGORY_ICONS[item.category] as any}
            size={20}
            color={colors.primary}
          />
        </View>
        <View style={styles.itemInfo}>
          <Text style={[styles.itemName, { color: colors.textPrimary }]} numberOfLines={1}>
            {item.name}
          </Text>
          {item.location && (
            <View style={styles.locationRow}>
              <Ionicons name="location" size={12} color={colors.textTertiary} />
              <Text style={[styles.itemLocation, { color: colors.textTertiary }]}>
                {item.location}
              </Text>
            </View>
          )}
        </View>
        {item.purchasePrice && (
          <Text style={[styles.itemPrice, { color: colors.success }]}>
            {formatCurrency(item.purchasePrice)}
          </Text>
        )}
      </View>
      
      {(item.purchaseDate || item.warrantyExpiry) && (
        <View style={styles.itemFooter}>
          {item.purchaseDate && (
            <Text style={[styles.itemDate, { color: colors.textTertiary }]}>
              Purchased: {(() => {
                const [y, m, d] = item.purchaseDate!.split('-');
                return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString();
              })()}
            </Text>
          )}
          {item.warrantyExpiry && (
            <View style={[styles.warrantyBadge, { backgroundColor: colors.info + '20' }]}>
              <Ionicons name="shield-checkmark" size={12} color={colors.info} />
              <Text style={[styles.warrantyText, { color: colors.info }]}>
                Warranty until {(() => {
                  const [y, m, d] = item.warrantyExpiry!.split('-');
                  return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString();
                })()}
              </Text>
            </View>
          )}
        </View>
      )}
      
      {item.notes && (
        <Text style={[styles.itemNotes, { color: colors.textSecondary }]} numberOfLines={2}>
          {item.notes}
        </Text>
      )}
      
      {item.photos && item.photos.length > 0 && (
        <View style={styles.photosRow}>
          {item.photos.map((uri, index) => (
            <Image 
              key={index} 
              source={{ uri }} 
              style={styles.photoThumb}
              accessibilityLabel={`${item.name} photo ${index + 1}`}
            />
          ))}
        </View>
      )}
    </Pressable>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Inventory</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {inventory.length} items • {formatCurrency(totalValue)}
        </Text>
      </View>

      {/* Category Filter */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterContainer}
        contentContainerStyle={styles.filterContent}
      >
        <Pressable
          style={[
            styles.filterButton,
            { backgroundColor: colors.surface },
            selectedCategory === 'all' && { backgroundColor: colors.primary },
          ]}
          onPress={() => setSelectedCategory('all')}
        >
          <Text
            style={[
              styles.filterText,
              { color: colors.textSecondary },
              selectedCategory === 'all' && { color: colors.white },
            ]}
          >
            All
          </Text>
        </Pressable>
        {(Object.keys(CATEGORY_LABELS) as InventoryCategory[]).map(cat => (
          <Pressable
            key={cat}
            style={[
              styles.filterButton,
              { backgroundColor: colors.surface },
              selectedCategory === cat && { backgroundColor: colors.primary },
            ]}
            onPress={() => setSelectedCategory(cat)}
          >
            <Ionicons
              name={CATEGORY_ICONS[cat] as any}
              size={14}
              color={selectedCategory === cat ? colors.white : colors.textSecondary}
            />
            <Text
              style={[
                styles.filterText,
                { color: colors.textSecondary },
                selectedCategory === cat && { color: colors.white },
              ]}
            >
              {CATEGORY_LABELS[cat]}
            </Text>
          </Pressable>
        ))}
      </ScrollView>

      {/* Inventory List */}
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content}>
        {selectedCategory === 'all' ? (
          // Grouped view
          Object.entries(groupedInventory).map(([category, items]) => (
            <View key={category} style={styles.section}>
              <View style={styles.sectionHeader}>
                <Ionicons
                  name={CATEGORY_ICONS[category as InventoryCategory] as any}
                  size={16}
                  color={colors.primary}
                />
                <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
                  {CATEGORY_LABELS[category as InventoryCategory]}
                </Text>
                <Text style={[styles.sectionCount, { color: colors.textTertiary }]}>
                  ({items.length})
                </Text>
              </View>
              {items.map(item => (
                <InventoryItemCard key={item.id} item={item} />
              ))}
            </View>
          ))
        ) : (
          // Filtered view
          filteredInventory.map(item => (
            <InventoryItemCard key={item.id} item={item} />
          ))
        )}

        {/* Empty State */}
        {inventory.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="albums-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Items Yet
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Track appliances, furniture, electronics, and more. Store serial numbers, warranties, and purchase info.
            </Text>
          </View>
        )}
      </ScrollView>

      {/* FAB */}
      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Add Modal */}
      <AddInventoryModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSave={(itemData) => addInventoryItem(itemData)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 16,
    paddingBottom: 8,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
  },
  subtitle: {
    fontSize: 14,
    marginTop: 4,
  },
  filterContainer: {
    maxHeight: 50,
  },
  filterContent: {
    paddingHorizontal: 16,
    gap: 8,
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
  },
  filterText: {
    fontSize: 13,
    fontWeight: '500',
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  section: {
    marginBottom: 24,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  sectionCount: {
    fontSize: 14,
  },
  itemCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  itemHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  itemIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemInfo: {
    flex: 1,
    marginLeft: 12,
  },
  itemName: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  itemLocation: {
    fontSize: 12,
  },
  itemPrice: {
    fontSize: 15,
    fontWeight: '600',
  },
  itemFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    marginLeft: 52,
  },
  itemDate: {
    fontSize: 12,
  },
  warrantyBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  warrantyText: {
    fontSize: 11,
    fontWeight: '500',
  },
  itemNotes: {
    fontSize: 12,
    marginTop: 8,
    marginLeft: 52,
  },
  photosRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
    marginLeft: 52,
  },
  photoThumb: {
    width: 48,
    height: 48,
    borderRadius: 6,
    resizeMode: 'cover',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 16,
  },
  emptySubtitle: {
    fontSize: 14,
    textAlign: 'center',
    marginTop: 8,
    paddingHorizontal: 24,
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
});