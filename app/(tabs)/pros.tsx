import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Alert, Linking, ActivityIndicator, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import Slider from '@react-native-community/slider';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { useTheme } from '../../contexts/ThemeContext';
import { usePros } from '../../contexts/AppContext';
import { AddProModal, ProFormData, SavedPro } from '../../components/AddProModal';
import { PlaceDetailModal } from '../../components/PlaceDetailModal';
import { ProDetailModal } from '../../components/ProDetailModal';
import { searchNearby, HerePlace, formatDistance, formatPhone, geocodeAddress } from '../../lib/hereSearch';
import { YelpBusiness } from '../../lib/yelpApi';

export default function ProsScreen() {
  const { colors } = useTheme();
  const { pros, addPro, updatePro, deletePro } = usePros();
  const [modalVisible, setModalVisible] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('handyman');
  const [searchQuery, setSearchQuery] = useState('');
  const scrollViewRef = useRef<ScrollView>(null);
  
  // Location state
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationError, setLocationError] = useState<string | null>(null);
  const [manualZip, setManualZip] = useState('');
  const [usingManualZip, setUsingManualZip] = useState(false);
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<HerePlace[]>([]);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [searchRadius, setSearchRadius] = useState(10); // miles
  const [allResults, setAllResults] = useState<HerePlace[]>([]); // All fetched results
  const [lastQuery, setLastQuery] = useState<string | null>(null);
  const [selectedPlace, setSelectedPlace] = useState<HerePlace | null>(null);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedPro, setSelectedPro] = useState<SavedPro | null>(null);
  const [proDetailModalVisible, setProDetailModalVisible] = useState(false);
  const [editingPro, setEditingPro] = useState<SavedPro | null>(null);

  // Reset to defaults when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      setSearchQuery('');
      setActiveCategory(null);
      setSearchResults([]);
      setAllResults([]);
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Get location on mount
  useEffect(() => {
    (async () => {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setLocationError('Location permission denied');
        return;
      }
      
      try {
        const position = await Location.getCurrentPositionAsync({});
        setLocation({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
        });
      } catch (error) {
        setLocationError('Could not get location');
      }
    })();
  }, []);

  // Handle manual ZIP code
  const handleUseZip = async () => {
    if (!manualZip || manualZip.length !== 5) {
      Alert.alert('Invalid ZIP', 'Please enter a 5-digit ZIP code.');
      return;
    }
    
    setSearching(true);
    setLocationError(null);
    
    // Geocode the ZIP code
    const coords = await geocodeAddress(manualZip);
    if (coords) {
      setLocation(coords);
      setUsingManualZip(true);
    } else {
      setLocationError('Could not find location for ZIP code');
    }
    setSearching(false);
  };

  // Filter results when radius changes
  useEffect(() => {
    if (allResults.length > 0) {
      const radiusMeters = searchRadius * 1609.34;
      const filtered = allResults.filter(r => (r.distance || 0) <= radiusMeters);
      const sorted = filtered.sort((a, b) => (a.distance || 0) - (b.distance || 0));
      setSearchResults(sorted);
    }
  }, [searchRadius, allResults]); // eslint-disable-line react-hooks/exhaustive-deps

  const suggestedCategories = [
    { key: 'plumber', label: 'Plumber', icon: 'water' as const },
    { key: 'electrician', label: 'Electrician', icon: 'flash' as const },
    { key: 'hvac', label: 'HVAC Tech', icon: 'thermometer' as const },
    { key: 'landscaper', label: 'Landscaper', icon: 'leaf' as const },
    { key: 'cleaner', label: 'Cleaner', icon: 'sparkles' as const },
    { key: 'handyman', label: 'Handyman', icon: 'construct' as const },
    { key: 'pest', label: 'Pest Control', icon: 'bug' as const },
    { key: 'roofer', label: 'Roofer', icon: 'home' as const },
  ];

  const handleSavePro = (proData: ProFormData) => {
    if (editingPro) {
      // Update existing pro
      updatePro(editingPro.id, proData);
      setEditingPro(null);
    } else {
      // Add new pro
      addPro(proData);
    }
  };

  const handleDeletePro = (id: string, name: string) => {
    Alert.alert(
      'Delete Contact',
      `Remove ${name} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deletePro(id) },
      ]
    );
  };

  const handleQuickSearch = async (categoryKey: string) => {
    if (!location) {
      Alert.alert('Location Required', 'Please enable location services to search nearby.');
      return;
    }

    setActiveCategory(categoryKey);
    setLastQuery(categoryKey);
    setSearching(true);
    setSearchResults([]);

    // Use HERE API - pass category key directly (searchNearby handles expansion)
    console.log('Searching HERE for:', categoryKey);
    const results = await searchNearby(categoryKey, location.lat, location.lng, 80467);
    console.log('HERE results:', results.length, 'sample:', results[0]?.title, results[0]?.contacts?.[0]?.phone?.[0]?.value);
    setAllResults(results);
    setSearching(false);
  };

  const handleCustomSearch = async () => {
    if (!searchQuery.trim() || !location) return;
    
    setActiveCategory(null);
    setLastQuery(searchQuery.trim());
    setSearching(true);
    setSearchResults([]);
    
    // Use HERE API (better coverage)
    const results = await searchNearby(searchQuery.trim(), location.lat, location.lng, 80467);
    setAllResults(results);
    setSearching(false);
  };

  const handleAddFromSearch = (place: HerePlace, yelpData?: YelpBusiness | null) => {
    // Use Yelp data if available (enriched from search results), otherwise use HERE data
    const phone = yelpData?.phone || yelpData?.display_phone || place.contacts?.[0]?.phone?.[0]?.value;
    const email = place.contacts?.[0]?.email?.[0]?.value;
    const website = yelpData?.url || place.contacts?.[0]?.www?.[0]?.value;
    
    // Extract just the business name (before any comma or dash)
    const name = place.title.split(/[-,]/)[0].trim();
    
    // Check if already exists (by phone or company name)
    const formattedPhone = phone ? formatPhone(phone) : undefined;
    const existingByPhone = formattedPhone ? pros.find(p => p.phone === formattedPhone) : null;
    const existingByCompany = pros.find(p => p.company === place.title);
    
    if (existingByPhone || existingByCompany) {
      Alert.alert('Already Saved', `${name} is already in your contacts.`);
      return;
    }
    
    // Build notes - address only, keep it clean
    const notes = place.address.label;
    
    addPro({
      name,
      category: activeCategory || 'other',
      phone: formattedPhone,
      email,
      company: place.title,
      notes,
      rating: yelpData?.rating, // Store Yelp rating separately
    });
    
    Alert.alert('Added!', `${name} saved to your contacts.`);
  };

  const SearchResultCard = ({ place }: { place: HerePlace }) => {
    const phone = place.contacts?.[0]?.phone?.[0]?.value;
    const isOpen = place.openingHours?.[0]?.isOpen;
    
    const handlePress = () => {
      setSelectedPlace(place);
      setDetailModalVisible(true);
    };
    
    const handleAdd = () => {
      handleAddFromSearch(place);
    };
    
    return (
      <Pressable
        style={[styles.resultCard, { backgroundColor: colors.surface }]}
        onPress={handlePress}
      >
        <View style={styles.resultHeader}>
          <View style={styles.resultInfo}>
            <Text style={[styles.resultName, { color: colors.textPrimary }]} numberOfLines={1}>
              {place.title}
            </Text>
            <Text style={[styles.resultAddress, { color: colors.textSecondary }]} numberOfLines={1}>
              {place.address.label}
            </Text>
          </View>
          {place.distance && (
            <View style={[styles.distanceBadge, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="location" size={12} color={colors.primary} />
              <Text style={[styles.distanceText, { color: colors.primary }]}>
                {formatDistance(place.distance)}
              </Text>
            </View>
          )}
        </View>
        
        <View style={styles.resultFooter}>
          {phone && (
            <Pressable style={[styles.resultButton, { backgroundColor: colors.success + '20' }]} onPress={() => Linking.openURL(`tel:${phone}`)}>
              <Ionicons name="call" size={14} color={colors.success} />
              <Text style={[styles.resultButtonText, { color: colors.success }]}>Call</Text>
            </Pressable>
          )}
          <Pressable style={[styles.resultButton, { backgroundColor: colors.primary + '20' }]} onPress={handleAdd}>
            <Ionicons name="add-circle" size={14} color={colors.primary} />
            <Text style={[styles.resultButtonText, { color: colors.primary }]}>Add</Text>
          </Pressable>
          {isOpen !== undefined && (
            <View style={[styles.openBadge, { backgroundColor: isOpen ? colors.success + '20' : colors.error + '20' }]}>
              <View style={[styles.openDot, { backgroundColor: isOpen ? colors.success : colors.error }]} />
              <Text style={[styles.openText, { color: isOpen ? colors.success : colors.error }]}>
                {isOpen ? 'Open' : 'Closed'}
              </Text>
            </View>
          )}
        </View>
      </Pressable>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={styles.header}>
        <Text style={[styles.title, { color: colors.textPrimary }]}>Pros</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          {pros.length} contact{pros.length !== 1 ? 's' : ''}
        </Text>
      </View>

      {/* Your Pros List */}
      <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content}>
        {pros.length > 0 ? (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Your Contacts ({pros.length})
            </Text>
            {pros.map(pro => (
              <Pressable
                key={pro.id}
                style={[styles.proCard, { backgroundColor: colors.surface }]}
                onPress={() => {
                  setSelectedPro(pro as SavedPro);
                  setProDetailModalVisible(true);
                }}
                onLongPress={() => handleDeletePro(pro.id, pro.name)}
              >
                <View style={styles.proHeader}>
                  <View style={styles.proInfo}>
                    <Text style={[styles.proName, { color: colors.textPrimary }]}>{pro.name}</Text>
                    {pro.company && (
                      <Text style={[styles.proCompany, { color: colors.textSecondary }]}>
                        {pro.company}
                      </Text>
                    )}
                  </View>
                  <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
                    <Text style={[styles.categoryText, { color: colors.primary }]}>
                      {pro.category.charAt(0).toUpperCase() + pro.category.slice(1).toLowerCase()}
                    </Text>
                  </View>
                </View>
                
                <View style={styles.proContact}>
                  {pro.phone && (
                    <Pressable style={[styles.actionButton, { backgroundColor: colors.success + '20' }]} onPress={() => Linking.openURL(`tel:${pro.phone}`)}>
                      <Ionicons name="call" size={16} color={colors.success} />
                      <Text style={[styles.actionButtonText, { color: colors.success }]}>Call</Text>
                    </Pressable>
                  )}
                  {pro.email && (
                    <Pressable style={[styles.actionButton, { backgroundColor: colors.info + '20' }]} onPress={() => Linking.openURL(`mailto:${pro.email}`)}>
                      <Ionicons name="mail" size={16} color={colors.info} />
                      <Text style={[styles.actionButtonText, { color: colors.info }]}>Email</Text>
                    </Pressable>
                  )}
                </View>
                
                {pro.notes && (
                  <Text style={[styles.proNotes, { color: colors.textTertiary }]} numberOfLines={2}>
                    {pro.notes}
                  </Text>
                )}
              </Pressable>
            ))}
          </View>
        ) : (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={64} color={colors.textTertiary} />
            <Text style={[styles.emptyTitle, { color: colors.textPrimary }]}>
              No Saved Pros
            </Text>
            <Text style={[styles.emptySubtitle, { color: colors.textSecondary }]}>
              Search for contractors nearby or add your trusted contacts.
            </Text>
          </View>
        )}

        {/* Find Pros Nearby */}
        <View style={[styles.findSection, { backgroundColor: colors.surface }]}>
          <View style={styles.findHeader}>
            <Text style={[styles.findTitle, { color: colors.textPrimary }]}>Find Pros Nearby</Text>
            {location && !usingManualZip && (
              <View style={styles.locationBadge}>
                <Ionicons name="locate" size={12} color={colors.success} />
                <Text style={[styles.locationText, { color: colors.success }]}>GPS Active</Text>
              </View>
            )}
            {usingManualZip && (
              <View style={styles.locationBadge}>
                <Ionicons name="pin" size={12} color={colors.primary} />
                <Text style={[styles.locationText, { color: colors.primary }]}>ZIP: {manualZip}</Text>
              </View>
            )}
            {locationError && (
              <Text style={[styles.locationError, { color: colors.error }]}>{locationError}</Text>
            )}
          </View>
          
          {/* Manual ZIP Code */}
          {locationError && !location && (
            <View style={[styles.zipRow, { marginTop: 12 }]}>
              <TextInput
                style={[styles.zipInput, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={manualZip}
                onChangeText={setManualZip}
                placeholder="Enter ZIP code"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
                maxLength={5}
              />
              <Pressable 
                style={[styles.zipButton, { backgroundColor: colors.primary }]}
                onPress={handleUseZip}
              >
                <Text style={[styles.zipButtonText, { color: colors.white }]}>Use ZIP</Text>
              </Pressable>
            </View>
          )}
          
          {/* Switch to ZIP button if GPS active */}
          {location && !usingManualZip && (
            <Pressable 
              style={[styles.switchLocationBtn, { borderColor: colors.border }]}
              onPress={() => {
                setLocation(null);
                setLocationError('GPS disabled - enter ZIP code');
              }}
            >
              <Ionicons name="swap-horizontal" size={14} color={colors.textSecondary} />
              <Text style={[styles.switchLocationText, { color: colors.textSecondary }]}>Use ZIP instead</Text>
            </Pressable>
          )}
          
          {/* Switch back to GPS if using ZIP */}
          {usingManualZip && (
            <Pressable 
              style={[styles.switchLocationBtn, { borderColor: colors.border }]}
              onPress={async () => {
                setUsingManualZip(false);
                setLocationError(null);
                const { status } = await Location.requestForegroundPermissionsAsync();
                if (status === 'granted') {
                  const position = await Location.getCurrentPositionAsync({});
                  setLocation({
                    lat: position.coords.latitude,
                    lng: position.coords.longitude,
                  });
                }
              }}
            >
              <Ionicons name="locate" size={14} color={colors.primary} />
              <Text style={[styles.switchLocationText, { color: colors.primary }]}>Use GPS instead</Text>
            </Pressable>
          )}
          
          {/* Radius Slider */}
          <View style={styles.radiusRow}>
            <Text style={[styles.radiusLabel, { color: colors.textSecondary }]}>
              Search radius
            </Text>
            <Text style={[styles.radiusValue, { color: colors.primary }]}>
              {searchRadius} mi
            </Text>
          </View>
          <Slider
            style={styles.slider}
            minimumValue={1}
            maximumValue={50}
            step={1}
            value={searchRadius}
            onValueChange={setSearchRadius}
            minimumTrackTintColor={colors.primary}
            maximumTrackTintColor={colors.gray300}
            thumbTintColor={colors.primary}
          />
          
          {/* Custom Search */}
          <View style={[styles.searchBox, { backgroundColor: colors.background, borderColor: colors.border }]}>
            <Ionicons name="search" size={18} color={colors.textTertiary} style={styles.searchIcon} />
            <TextInput
              style={[styles.searchInput, { color: colors.textPrimary }]}
              value={searchQuery}
              onChangeText={setSearchQuery}
              placeholder="Search for contractors..."
              placeholderTextColor={colors.textTertiary}
              returnKeyType="search"
              onSubmitEditing={handleCustomSearch}
            />
            {searchQuery.length > 0 && (
              <Pressable onPress={() => setSearchQuery('')} style={styles.clearButton}>
                <Ionicons name="close-circle" size={18} color={colors.textTertiary} />
              </Pressable>
            )}
          </View>
          
          {/* Category Quick Search */}
          <Text style={[styles.quickLabel, { color: colors.textTertiary }]}>Quick search:</Text>
          <View style={styles.quickSearches}>
            {suggestedCategories.slice(0, 6).map(cat => (
              <Pressable
                key={cat.key}
                style={[
                  styles.quickChip, 
                  { backgroundColor: colors.primary + '20' },
                  activeCategory === cat.key && { backgroundColor: colors.primary }
                ]}
                onPress={() => handleQuickSearch(cat.key)}
              >
                <Ionicons name={cat.icon} size={14} color={activeCategory === cat.key ? colors.white : colors.primary} />
                <Text style={[styles.quickChipText, { color: activeCategory === cat.key ? colors.white : colors.primary }]}>
                  {cat.label}
                </Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* Search Results */}
        {searching && (
          <View style={styles.loadingSection}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
              Searching nearby...
            </Text>
          </View>
        )}

        {searchResults.length > 0 && !searching && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
              Within {searchRadius} mi ({searchResults.length})
            </Text>
            {searchResults.map(place => (
              <SearchResultCard key={place.id} place={place} />
            ))}
          </View>
        )}

        {searchResults.length === 0 && activeCategory && !searching && (
          <View style={styles.noResults}>
            <Ionicons name="search-outline" size={32} color={colors.textTertiary} />
            <Text style={[styles.noResultsText, { color: colors.textSecondary }]}>
              No results found nearby. Try a different search.
            </Text>
          </View>
        )}

        {/* Suggested Categories */}
        <Text style={[styles.sectionTitle, { color: colors.textPrimary }]}>
          Quick Add by Type
        </Text>
        <View style={styles.categoriesGrid}>
          {suggestedCategories.map(category => (
            <Pressable
              key={category.key}
              style={[styles.categoryCard, { backgroundColor: colors.surface }]}
              onPress={() => {
                setSelectedCategory(category.key);
                setModalVisible(true);
              }}
            >
              <View style={[styles.categoryIcon, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name={category.icon} size={22} color={colors.primary} />
              </View>
              <Text style={[styles.categoryLabel, { color: colors.textPrimary }]}>
                {category.label}
              </Text>
              <Ionicons name="add" size={16} color={colors.textTertiary} />
            </Pressable>
          ))}
        </View>
      </ScrollView>
      </KeyboardAvoidingView>

      {/* FAB */}
      <Pressable style={[styles.fab, { backgroundColor: colors.primary }]} onPress={() => setModalVisible(true)}>
        <Ionicons name="add" size={28} color={colors.white} />
      </Pressable>

      {/* Add Pro Modal */}
      <AddProModal
        visible={modalVisible}
        onClose={() => {
          setModalVisible(false);
          setEditingPro(null);
        }}
        onSave={handleSavePro}
        initialCategory={selectedCategory}
        editingPro={editingPro}
      />

      {/* Place Detail Modal */}
      <PlaceDetailModal
        visible={detailModalVisible}
        place={selectedPlace}
        onClose={() => setDetailModalVisible(false)}
        onAdd={handleAddFromSearch}
      />

      {/* Pro Detail Modal */}
      <ProDetailModal
        visible={proDetailModalVisible}
        pro={selectedPro}
        onClose={() => setProDetailModalVisible(false)}
        onDelete={handleDeletePro}
        onEdit={(pro) => {
          setEditingPro(pro);
          setModalVisible(true);
        }}
      />
    </SafeAreaView>
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
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 12,
  },
  proCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 8,
  },
  proHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  proInfo: {
    flex: 1,
  },
  proName: {
    fontSize: 16,
    fontWeight: '600',
  },
  proCompany: {
    fontSize: 13,
    marginTop: 2,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '500',
  },
  proContact: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  proNotes: {
    fontSize: 12,
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(150,150,150,0.2)',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 32,
    marginBottom: 24,
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
  findSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  findHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  findTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  locationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '500',
  },
  locationError: {
    fontSize: 12,
  },
  radiusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  radiusLabel: {
    fontSize: 13,
  },
  radiusValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  slider: {
    width: '100%',
    height: 40,
    marginBottom: 8,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 12,
    fontSize: 15,
  },
  clearButton: {
    padding: 4,
  },
  quickLabel: {
    fontSize: 12,
    marginTop: 12,
    marginBottom: 8,
  },
  quickSearches: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  quickChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    gap: 6,
  },
  quickChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  loadingSection: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
  },
  resultCard: {
    padding: 14,
    borderRadius: 12,
    marginBottom: 8,
  },
  resultHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  resultInfo: {
    flex: 1,
  },
  resultName: {
    fontSize: 16,
    fontWeight: '600',
  },
  resultAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  resultFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-start',
    alignItems: 'center',
    marginTop: 10,
    gap: 8,
  },
  resultButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    gap: 6,
  },
  resultButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  openBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    gap: 4,
  },
  openDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  openText: {
    fontSize: 11,
    fontWeight: '600',
  },
  noResults: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  noResultsText: {
    fontSize: 14,
    marginTop: 8,
  },
  categoriesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 24,
  },
  categoryCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 10,
    gap: 10,
  },
  categoryIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  categoryLabel: {
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
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
  zipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  zipInput: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 8,
    borderWidth: 1,
    fontSize: 16,
  },
  zipButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
  },
  zipButtonText: {
    fontSize: 14,
    fontWeight: '600',
  },
  switchLocationBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 8,
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
  },
  switchLocationText: {
    fontSize: 13,
  },
});