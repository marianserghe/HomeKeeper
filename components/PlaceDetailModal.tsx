import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Linking, Alert, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';
import { HerePlace, formatDistance, formatPhone } from '../lib/hereSearch';
import { getBusinessById, YelpBusiness } from '../lib/yelpApi';

interface PlaceDetailModalProps {
  visible: boolean;
  place: HerePlace | null;
  onClose: () => void;
  onAdd: (place: HerePlace) => void;
}

export function PlaceDetailModal({ visible, place, onClose, onAdd }: PlaceDetailModalProps) {
  const { colors } = useTheme();
  const [yelpData, setYelpData] = useState<YelpBusiness | null>(null);
  const [loadingYelp, setLoadingYelp] = useState(false);

  // Fetch Yelp data when modal opens
  useEffect(() => {
    if (visible && place) {
      const yelpRef = place.references?.find(r => r.supplier?.id === 'yelp');
      if (yelpRef?.id) {
        setLoadingYelp(true);
        getBusinessById(yelpRef.id)
          .then(data => setYelpData(data))
          .catch(() => setYelpData(null))
          .finally(() => setLoadingYelp(false));
      } else {
        setYelpData(null);
      }
    }
  }, [visible, place]);

  if (!place) return null;

  const phone = place.contacts?.[0]?.phone?.[0]?.value;
  const email = place.contacts?.[0]?.email?.[0]?.value;
  const website = place.contacts?.[0]?.www?.[0]?.value;
  const isOpen = place.openingHours?.[0]?.isOpen;
  const hours = place.openingHours?.[0]?.text || [];
  const yelpRef = place.references?.find(r => r.supplier?.id === 'yelp');
  const yelpUrl = yelpRef ? `https://www.yelp.com/biz/${yelpRef.id}` : null;

  const handleAdd = () => {
    onAdd(place);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textPrimary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Details</Text>
          <View style={styles.headerSpacer} />
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Title & Distance */}
          <View style={styles.titleRow}>
            <Text style={[styles.title, { color: colors.textPrimary }]} numberOfLines={2}>
              {place.title}
            </Text>
            {place.distance && (
              <View style={[styles.distanceBadge, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="location" size={14} color={colors.primary} />
                <Text style={[styles.distanceText, { color: colors.primary }]}>
                  {formatDistance(place.distance)}
                </Text>
              </View>
            )}
          </View>

          {/* Categories */}
          <View style={styles.categoriesRow}>
            {place.categories?.slice(0, 3).map(cat => (
              <View key={cat.id} style={[styles.categoryBadge, { backgroundColor: colors.surface }]}>
                <Text style={[styles.categoryText, { color: colors.textSecondary }]}>
                  {cat.name}
                </Text>
              </View>
            ))}
          </View>

          {/* Yelp Rating */}
          {loadingYelp ? (
            <View style={styles.ratingRow}>
              <ActivityIndicator size="small" color={colors.primary} />
            </View>
          ) : yelpData && yelpUrl ? (
            <Pressable 
              style={[styles.ratingCard, { backgroundColor: colors.surface }]}
              onPress={() => yelpUrl && Linking.openURL(yelpUrl)}
            >
              <View style={styles.ratingStars}>
                <Text style={styles.stars}>
                  {'⭐'.repeat(Math.floor(yelpData.rating))}{yelpData.rating % 1 >= 0.5 ? '½' : ''}
                </Text>
                <Text style={[styles.ratingNumber, { color: colors.textPrimary }]}>
                  {yelpData.rating}
                </Text>
              </View>
              <Text style={[styles.reviewCount, { color: colors.textSecondary }]}>
                {yelpData.review_count} reviews on Yelp →
              </Text>
            </Pressable>
          ) : null}

          {/* Address */}
          <Pressable 
            style={[styles.section, { backgroundColor: colors.surface, borderRadius: 12 }]}
            onPress={() => {
              const addr = encodeURIComponent(place.address.label);
              Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${addr}`);
            }}
          >
            <View style={styles.sectionRow}>
              <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                <Ionicons name="location" size={20} color={colors.primary} />
              </View>
              <View style={styles.sectionContent}>
                <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Address</Text>
                <Text style={[styles.sectionValue, { color: colors.textPrimary }]}>
                  {place.address.label}
                </Text>
              </View>
              <Ionicons name="map" size={20} color={colors.primary} />
            </View>
          </Pressable>

          {/* Status Badge */}
          {isOpen !== undefined && (
            <View style={styles.statusRow}>
              <View style={[styles.statusBadge, { backgroundColor: isOpen ? colors.success + '20' : colors.error + '20' }]}>
                <View style={[styles.statusDot, { backgroundColor: isOpen ? colors.success : colors.error }]} />
                <Text style={[styles.statusText, { color: isOpen ? colors.success : colors.error }]}>
                  {isOpen ? 'Open Now' : 'Closed'}
                </Text>
              </View>
            </View>
          )}

          {/* Hours */}
          {hours.length > 0 && (
            <View style={[styles.section, { backgroundColor: colors.surface, borderRadius: 12 }]}>
              <View style={styles.sectionRow}>
                <View style={[styles.iconBox, { backgroundColor: colors.primary + '20' }]}>
                  <Ionicons name="time" size={20} color={colors.primary} />
                </View>
                <View style={styles.sectionContent}>
                  <Text style={[styles.sectionLabel, { color: colors.textSecondary }]}>Hours</Text>
                  {hours.map((h, i) => (
                    <Text key={i} style={[styles.hoursText, { color: colors.textPrimary }]}>
                      {h}
                    </Text>
                  ))}
                </View>
              </View>
            </View>
          )}

          {/* Contact Options */}
          <View style={styles.contactSection}>
            {phone && (
              <Pressable 
                style={[styles.contactButton, { backgroundColor: colors.success + '20' }]}
                onPress={() => Linking.openURL(`tel:${phone}`)}
              >
                <Ionicons name="call" size={20} color={colors.success} />
                <Text style={[styles.contactButtonText, { color: colors.success }]}>Call {formatPhone(phone)}</Text>
              </Pressable>
            )}
            {(email || website) && (
              <View style={styles.contactRow}>
                {email && (
                  <Pressable 
                    style={[styles.contactButtonHalf, { backgroundColor: colors.info + '20' }]}
                    onPress={() => Linking.openURL(`mailto:${email}`)}
                  >
                    <Ionicons name="mail" size={18} color={colors.info} />
                    <Text style={[styles.contactButtonTextSmall, { color: colors.info }]}>Email</Text>
                  </Pressable>
                )}
                {website && (
                  <Pressable 
                    style={[styles.contactButtonHalf, { backgroundColor: colors.gray200 }]}
                    onPress={() => Linking.openURL(website)}
                  >
                    <Ionicons name="globe" size={18} color={colors.textSecondary} />
                    <Text style={[styles.contactButtonTextSmall, { color: colors.textSecondary }]}>Website</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Add to Contacts Button */}
          <Pressable 
            style={[styles.addButton, { backgroundColor: colors.primary }]}
            onPress={handleAdd}
          >
            <Ionicons name="person-add" size={20} color={colors.white} />
            <Text style={styles.addButtonText}>Add to My Contacts</Text>
          </Pressable>
        </ScrollView>
      </View>
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
    padding: 16,
    borderBottomWidth: 1,
  },
  closeButton: {
    padding: 4,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
  },
  headerSpacer: {
    width: 32,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  title: {
    flex: 1,
    fontSize: 22,
    fontWeight: 'bold',
    marginRight: 12,
  },
  distanceBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 4,
  },
  distanceText: {
    fontSize: 14,
    fontWeight: '600',
  },
  categoriesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  categoryBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  categoryText: {
    fontSize: 12,
  },
  ratingRow: {
    alignItems: 'center',
    paddingVertical: 12,
    marginBottom: 12,
  },
  ratingCard: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    alignItems: 'center',
  },
  ratingStars: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stars: {
    fontSize: 18,
  },
  ratingNumber: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  reviewCount: {
    fontSize: 13,
    marginTop: 4,
  },
  section: {
    padding: 12,
    marginBottom: 12,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  sectionContent: {
    flex: 1,
  },
  sectionLabel: {
    fontSize: 12,
    marginBottom: 2,
  },
  sectionValue: {
    fontSize: 15,
  },
  hoursText: {
    fontSize: 14,
    marginTop: 2,
  },
  statusRow: {
    marginBottom: 12,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '600',
  },
  contactSection: {
    gap: 10,
    marginBottom: 20,
  },
  contactRow: {
    flexDirection: 'row',
    gap: 10,
  },
  contactButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    gap: 8,
  },
  contactButtonHalf: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    gap: 6,
  },
  contactButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  contactButtonTextSmall: {
    fontSize: 14,
    fontWeight: '600',
  },
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  addButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: 'white',
  },
});