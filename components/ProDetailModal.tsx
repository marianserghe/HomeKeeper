import { View, Text, StyleSheet, Modal, Pressable, ScrollView, Linking, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../contexts/ThemeContext';

export interface SavedPro {
  id: string;
  name: string;
  category: string;
  phone?: string;
  email?: string;
  company?: string;
  rating?: number;
  notes?: string;
  createdAt: string;
}

interface ProDetailModalProps {
  visible: boolean;
  pro: SavedPro | null;
  onClose: () => void;
  onDelete: (id: string, name: string) => void;
  onEdit: (pro: SavedPro) => void;
}

// Capitalize first letter
const capitalize = (str: string) => str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();

export function ProDetailModal({ visible, pro, onClose, onDelete, onEdit }: ProDetailModalProps) {
  const { colors } = useTheme();

  if (!pro) return null;

  const handleDelete = () => {
    Alert.alert(
      'Delete Contact',
      `Remove ${pro.name} from your contacts?`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => {
            onDelete(pro.id, pro.name);
            onClose();
          }
        },
      ]
    );
  };

  const handleEdit = () => {
    onEdit(pro);
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={[styles.header, { borderBottomColor: colors.border }]}>
          <Pressable onPress={onClose} style={styles.closeButton}>
            <Ionicons name="close" size={24} color={colors.textSecondary} />
          </Pressable>
          <Text style={[styles.headerTitle, { color: colors.textPrimary }]}>Contact Details</Text>
          <Pressable onPress={handleEdit} style={styles.editButton}>
            <Ionicons name="create" size={22} color={colors.primary} />
          </Pressable>
          <Pressable onPress={handleDelete} style={styles.deleteButton}>
            <Ionicons name="trash" size={22} color={colors.error} />
          </Pressable>
        </View>

        <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
          {/* Title & Category */}
          <View style={styles.titleRow}>
            <View style={styles.titleSection}>
              <Text style={[styles.title, { color: colors.textPrimary }]}>
                {pro.name}
              </Text>
              {pro.company && (
                <Text style={[styles.company, { color: colors.textSecondary }]}>
                  {pro.company}
                </Text>
              )}
            </View>
          </View>

          {/* Category Badge */}
          <View style={styles.categoryRow}>
            <View style={[styles.categoryBadge, { backgroundColor: colors.primary + '20' }]}>
              <Ionicons name="briefcase" size={14} color={colors.primary} />
              <Text style={[styles.categoryText, { color: colors.primary }]}>
                {capitalize(pro.category)}
              </Text>
            </View>
            {pro.rating && (
              <View style={[styles.ratingBadge, { backgroundColor: '#FFD700' + '20' }]}>
                <Ionicons name="star" size={14} color="#FFD700" />
                <Text style={[styles.ratingText, { color: '#FFD700' }]}>
                  {pro.rating.toFixed(1)}
                </Text>
              </View>
            )}
          </View>

          {/* Contact Options */}
          <View style={styles.contactSection}>
            {pro.phone && (
              <Pressable 
                style={[styles.contactButton, { backgroundColor: colors.success + '20' }]}
                onPress={() => Linking.openURL(`tel:${pro.phone}`)}
              >
                <Ionicons name="call" size={20} color={colors.success} />
                <Text style={[styles.contactButtonText, { color: colors.success }]}>Call {pro.phone}</Text>
              </Pressable>
            )}
            {(pro.email || pro.notes?.includes('Website')) && (
              <View style={styles.contactRow}>
                {pro.email && (
                  <Pressable 
                    style={[styles.contactButtonHalf, { backgroundColor: colors.info + '20' }]}
                    onPress={() => Linking.openURL(`mailto:${pro.email}`)}
                  >
                    <Ionicons name="mail" size={18} color={colors.info} />
                    <Text style={[styles.contactButtonTextSmall, { color: colors.info }]}>Email</Text>
                  </Pressable>
                )}
                {pro.notes?.includes('Website:') && (
                  <Pressable 
                    style={[styles.contactButtonHalf, { backgroundColor: colors.gray200 }]}
                    onPress={() => {
                      const match = pro.notes?.match(/Website: (https?:\/\/[^\s]+)/);
                      if (match) Linking.openURL(match[1]);
                    }}
                  >
                    <Ionicons name="globe" size={18} color={colors.textSecondary} />
                    <Text style={[styles.contactButtonTextSmall, { color: colors.textSecondary }]}>Website</Text>
                  </Pressable>
                )}
              </View>
            )}
          </View>

          {/* Notes / Address */}
          {pro.notes && (
            <View style={[styles.notesSection, { backgroundColor: colors.surface }]}>
              <Text style={[styles.notesLabel, { color: colors.textSecondary }]}>Notes</Text>
              <Text style={[styles.notesText, { color: colors.textPrimary }]}>
                {pro.notes.replace(/Website: https?:\/\/[^\s]+/, '').trim()}
              </Text>
              {pro.notes.includes('Website:') && (() => {
                const match = pro.notes.match(/Website: (https?:\/\/[^\s]+)/);
                return match ? (
                  <Pressable 
                    style={styles.websiteLink}
                    onPress={() => Linking.openURL(match[1])}
                  >
                    <Ionicons name="link" size={14} color={colors.primary} />
                    <Text style={[styles.websiteText, { color: colors.primary }]}>{match[1]}</Text>
                  </Pressable>
                ) : null;
              })()}
            </View>
          )}

          {/* Added Date */}
          <Text style={[styles.addedDate, { color: colors.textTertiary }]}>
            Added {(() => {
              const [y, m, d] = pro.createdAt.split('T')[0].split('-');
              return new Date(parseInt(y), parseInt(m) - 1, parseInt(d)).toLocaleDateString();
            })()}
          </Text>
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
  editButton: {
    padding: 4,
    marginRight: 12,
  },
  deleteButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
    paddingBottom: 40,
  },
  titleRow: {
    marginBottom: 8,
  },
  titleSection: {
    flex: 1,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  company: {
    fontSize: 16,
    marginTop: 4,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 20,
  },
  categoryBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    gap: 6,
  },
  categoryText: {
    fontSize: 14,
    fontWeight: '600',
  },
  ratingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
    marginLeft: 8,
  },
  ratingText: {
    fontSize: 13,
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
  notesSection: {
    padding: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  notesLabel: {
    fontSize: 12,
    marginBottom: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  notesText: {
    fontSize: 15,
    lineHeight: 22,
  },
  websiteLink: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 6,
  },
  websiteText: {
    fontSize: 14,
  },
  addedDate: {
    fontSize: 12,
    textAlign: 'center',
    marginTop: 20,
  },
});