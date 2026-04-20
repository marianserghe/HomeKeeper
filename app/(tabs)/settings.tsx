import { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Switch, KeyboardAvoidingView, Platform, FlatList, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';
import { autocompleteAddress, AddressSuggestion } from '../../lib/zestimate';
import { AddPropertyModal } from '../../components/AddPropertyModal';
import { HelpModal } from '../../components/HelpModal';
import { PrivacyPolicyModal } from '../../components/PrivacyPolicyModal';
import { TermsOfServiceModal } from '../../components/TermsOfServiceModal';
import { ContactSupportModal } from '../../components/ContactSupportModal';
import { ExportDataModal } from '../../components/ExportDataModal';
import { requestNotificationPermissions, cancelAllNotifications, scheduleAllTaskReminders } from '../../lib/notifications';

// App version from app.json
const APP_VERSION = '1.0.0';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { homeInfo, updateHomeInfo, settings, updateSettings, activePropertyTasks, activePropertyPros, activePropertyInventory, healthScore, clearAllData, properties, activePropertyId, reorderProperties, setActiveProperty, deleteProperty, addProperty, updateProperty, loadData } = useApp();
  
  const [editingProperty, setEditingProperty] = useState<typeof properties[0] | null>(null);
  const [addPropertyModalVisible, setAddPropertyModalVisible] = useState(false);
  const [helpModalVisible, setHelpModalVisible] = useState(false);
  const [privacyModalVisible, setPrivacyModalVisible] = useState(false);
  const [termsModalVisible, setTermsModalVisible] = useState(false);
  const [contactModalVisible, setContactModalVisible] = useState(false);
  const [exportModalVisible, setExportModalVisible] = useState(false);
  
  const [editingHome, setEditingHome] = useState(false);
  const [tempHomeInfo, setTempHomeInfo] = useState(homeInfo);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [showAddressSuggestions, setShowAddressSuggestions] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  // Reset scroll position when screen comes into focus
  useFocusEffect(
    useCallback(() => {
      scrollViewRef.current?.scrollTo({ y: 0, animated: false });
    }, [])
  );

  // Address autocomplete effect
  useEffect(() => {
    if (!tempHomeInfo.address || tempHomeInfo.address.length < 3) {
      setAddressSuggestions([]);
      return;
    }

    const timeout = setTimeout(async () => {
      if (tempHomeInfo.address) {
        const suggestions = await autocompleteAddress(tempHomeInfo.address);
        setAddressSuggestions(suggestions);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [tempHomeInfo.address]);

  const handleSelectAddress = (suggestion: AddressSuggestion) => {
    // Parse the address into components
    setTempHomeInfo({
      ...tempHomeInfo,
      address: suggestion.street || suggestion.label,
      city: suggestion.city || '',
      state: suggestion.state || '',
      zip: suggestion.postalCode || '',
    });
    setAddressSuggestions([]);
    setShowAddressSuggestions(false);
  };

  const handleSaveHomeInfo = () => {
    updateHomeInfo(tempHomeInfo);
    setEditingHome(false);
  };

  const handleExportData = () => {
    setExportModalVisible(true);
  };

  const handleClearData = () => {
    Alert.alert(
      'Clear All Data',
      'This will reset the app to default state with sample tasks for your properties.',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Reset', 
          style: 'destructive',
          onPress: () => {
            clearAllData();
            Alert.alert('Reset Complete', 'App has been reset with sample data.');
          }
        },
      ]
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['top']}>
      <KeyboardAvoidingView
        style={[styles.keyboardView, { backgroundColor: colors.background }]}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 100 : 0}
      >
        <ScrollView ref={scrollViewRef} style={styles.scrollView} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* App Logo */}
        <View style={styles.logoContainer}>
          <Image 
            source={require('../../assets/logo.jpg')} 
            style={styles.logo}
            resizeMode="contain"
          />
          <Text style={[styles.appName, { color: colors.textPrimary }]}>HomeKeeper</Text>
          <Text style={[styles.appVersion, { color: colors.textTertiary }]}>Version {APP_VERSION}</Text>
        </View>

        {/* Properties */}
        {properties.length >= 1 && (
          <View style={styles.propertiesSection}>
            <View style={styles.propertiesHeader}>
              <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Properties</Text>
              <Pressable
                onPress={() => {
                  setEditingProperty(null);
                  setAddPropertyModalVisible(true);
                }}
                style={styles.addPropertyBtn}
              >
                <Ionicons name="add-circle" size={24} color={colors.primary} />
              </Pressable>
            </View>
            
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.propertiesChips}
            >
              {properties.map((property, index) => {
                const isActive = property.id === activePropertyId;
                return (
                  <Pressable
                    key={property.id || index}
                    onLongPress={() => {
                      // TODO: Enable drag mode
                      Alert.alert(
                        'Reorder Properties',
                        'Long press and drag to reorder. For now, use the arrows below.',
                        [{ text: 'OK' }]
                      );
                    }}
                    onPress={() => property.id && setActiveProperty(property.id)}
                    style={[
                      styles.propertyChip,
                      { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: isActive ? colors.primary : colors.border },
                    ]}
                  >
                    <Text
                      style={[
                        styles.propertyChipText,
                        { color: isActive ? colors.white : colors.textPrimary },
                      ]}
                      numberOfLines={1}
                    >
                      {property.name || 'Property'}
                    </Text>
                    {isActive && (
                      <View style={[styles.activeDot, { backgroundColor: colors.white }]} />
                    )}
                  </Pressable>
                );
              })}
            </ScrollView>
            
            {/* Reorder controls (shown below chips) */}
            {properties.length > 1 && (
              <View style={styles.reorderSection}>
                {properties.map((property, index) => (
                  <View key={property.id || index} style={styles.reorderRow}>
                    <Text style={[styles.reorderLabel, { color: colors.textSecondary }]} numberOfLines={1}>
                      {property.name || 'Property'}
                    </Text>
                    <View style={styles.reorderArrows}>
                      <Pressable
                        onPress={() => index > 0 && reorderProperties(index, index - 1)}
                        disabled={index === 0}
                        style={[styles.arrowBtn, index === 0 && styles.arrowBtnDisabled]}
                      >
                        <Ionicons name="chevron-up" size={18} color={index === 0 ? colors.textTertiary : colors.textSecondary} />
                      </Pressable>
                      <Pressable
                        onPress={() => index < properties.length - 1 && reorderProperties(index, index + 1)}
                        disabled={index === properties.length - 1}
                        style={[styles.arrowBtn, index === properties.length - 1 && styles.arrowBtnDisabled]}
                      >
                        <Ionicons name="chevron-down" size={18} color={index === properties.length - 1 ? colors.textTertiary : colors.textSecondary} />
                      </Pressable>
                    </View>
                    <Pressable
                      onPress={() => {
                        setEditingProperty(property);
                        setAddPropertyModalVisible(true);
                      }}
                      style={styles.editPropertyBtn}
                    >
                      <Ionicons name="pencil" size={16} color={colors.textTertiary} />
                    </Pressable>
                  </View>
                ))}
              </View>
            )}
          </View>
        )}

        {/* Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{healthScore}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Health</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{activePropertyTasks.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{activePropertyPros.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pros</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>{activePropertyInventory.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Items</Text>
          </View>
        </View>

        {/* Preferences */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Preferences</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="moon" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Dark Mode</Text>
              <Switch
                value={theme === 'dark'}
                onValueChange={(value) => setTheme(value ? 'dark' : 'light')}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="alarm" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Task Reminders</Text>
              <Switch
                value={settings.reminders}
                onValueChange={async (value) => {
                  if (value) {
                    const granted = await requestNotificationPermissions();
                    if (granted) {
                      updateSettings({ reminders: value });
                      await scheduleAllTaskReminders(activePropertyTasks, true);
                    }
                  } else {
                    await cancelAllNotifications();
                    updateSettings({ reminders: value });
                  }
                }}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
          </View>
        </View>

        {/* Data */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Data</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <Pressable 
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
              onPress={handleExportData}
            >
              <Ionicons name="download-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Export Data</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            <Pressable 
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={handleClearData}
            >
              <Ionicons name="trash-outline" size={20} color={colors.error} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.error }]}>Clear All Data</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Support */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Support</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <Pressable 
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
              onPress={() => setHelpModalVisible(true)}
            >
              <Ionicons name="help-circle-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Help & Tips</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            <Pressable 
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
              onPress={() => setContactModalVisible(true)}
            >
              <Ionicons name="chatbubble-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Contact Support</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            <Pressable 
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('Rate HomeKeeper', 'Thanks for using HomeKeeper!')}
            >
              <Ionicons name="star-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Rate the App</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Legal */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Legal</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <Pressable 
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
              onPress={() => setTermsModalVisible(true)}
            >
              <Ionicons name="document-text-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Terms of Service</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            <Pressable 
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => setPrivacyModalVisible(true)}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          Made with ❤️ for homeowners
        </Text>
        </ScrollView>

        {/* Add/Edit Property Modal */}
        <AddPropertyModal
          visible={addPropertyModalVisible}
          onClose={() => {
            setAddPropertyModalVisible(false);
            setEditingProperty(null);
          }}
          onSave={(propertyData) => {
            if (editingProperty?.id) {
              updateProperty(editingProperty.id, propertyData);
            } else {
              addProperty(propertyData);
            }
            setAddPropertyModalVisible(false);
            setEditingProperty(null);
          }}
          initialProperty={editingProperty}
        />

        {/* Help Modal */}
        <HelpModal
          visible={helpModalVisible}
          onClose={() => setHelpModalVisible(false)}
        />

        {/* Privacy Policy Modal */}
        <PrivacyPolicyModal
          visible={privacyModalVisible}
          onClose={() => setPrivacyModalVisible(false)}
        />

        {/* Terms of Service Modal */}
        <TermsOfServiceModal
          visible={termsModalVisible}
          onClose={() => setTermsModalVisible(false)}
        />

        {/* Contact Support Modal */}
        <ContactSupportModal
          visible={contactModalVisible}
          onClose={() => setContactModalVisible(false)}
        />

        {/* Export Data Modal */}
        <ExportDataModal
          visible={exportModalVisible}
          onClose={() => setExportModalVisible(false)}
          onImportComplete={() => {
            // Reload app data after import
            loadData();
          }}
        />
      </KeyboardAvoidingView>
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
  addressInputContainer: {
    position: 'relative',
  },
  suggestionsContainer: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    borderWidth: 1,
    borderRadius: 8,
    maxHeight: 200,
    zIndex: 1000,
    elevation: 5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    padding: 12,
    borderBottomWidth: 1,
  },
  suggestionText: {
    flex: 1,
    fontSize: 14,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 100,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 24,
  },
  card: {
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  homeInfoDisplay: {
    paddingLeft: 32,
  },
  homeInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  homeInfoText: {
    fontSize: 15,
  },
  homeInfoFooter: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 8,
  },
  homeInfoBadge: {
    backgroundColor: 'rgba(0,0,0,0.05)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  badgeText: {
    fontSize: 12,
  },
  tapToEdit: {
    fontSize: 13,
    marginTop: 12,
  },
  tapToEditWrap: {
    alignItems: 'center',
    marginTop: 12,
  },
  homeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  homeIconCircle: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  homeHeaderText: {
    flex: 1,
  },
  homeName: {
    fontSize: 20,
    fontWeight: '700',
  },
  homeValue: {
    fontSize: 14,
    fontWeight: '600',
    marginTop: 2,
  },
  addressSection: {
    marginBottom: 16,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  addressText: {
    flex: 1,
  },
  addressLine1: {
    fontSize: 16,
    fontWeight: '500',
  },
  addressLine2: {
    fontSize: 14,
    marginTop: 2,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  statCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 12,
    padding: 12,
    alignItems: 'center',
  },
  bedsBathsCard: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  bedsBathsItem: {
    alignItems: 'center',
  },
  bedsBathsDivider: {
    width: 1,
    height: 30,
    marginHorizontal: 4,
  },
  cardStatValue: {
    fontSize: 18,
    fontWeight: '600',
    marginTop: 6,
  },
  cardStatLabel: {
    fontSize: 12,
    marginTop: 2,
  },
  propertyInfo: {
    flex: 1,
    marginLeft: 8,
  },
  propertyAddress: {
    fontSize: 12,
    marginTop: 2,
  },
  // Properties chips section
  propertiesSection: {
    marginBottom: 16,
  },
  propertiesHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  addPropertyBtn: {
    padding: 4,
  },
  propertiesChips: {
    paddingHorizontal: 12,
    gap: 8,
    flexDirection: 'row',
  },
  propertyChip: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  propertyChipText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  // Reorder section (below chips)
  reorderSection: {
    marginTop: 12,
    paddingHorizontal: 16,
  },
  reorderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    borderBottomWidth: 1,
  },
  reorderLabel: {
    flex: 1,
    fontSize: 14,
  },
  reorderArrows: {
    flexDirection: 'row',
    gap: 8,
  },
  arrowBtn: {
    padding: 4,
  },
  arrowBtnDisabled: {
    opacity: 0.3,
  },
  editPropertyBtn: {
    padding: 8,
    marginLeft: 8,
  },
  // Old styles kept for backward compatibility
  reorderControls: {
    flexDirection: 'column',
    justifyContent: 'center',
    marginRight: 4,
  },
  reorderBtn: {
    padding: 2,
  },
  reorderBtnDisabled: {
    opacity: 0.3,
  },
  activeBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  activeBadgeText: {
    fontSize: 12,
    fontWeight: '600',
  },
  setActiveBtn: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
  },
  setActiveText: {
    fontSize: 12,
    fontWeight: '500',
  },
  editForm: {
    gap: 12,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '500',
    marginBottom: 4,
  },
  input: {
    borderRadius: 8,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 15,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 12,
  },
  halfInput: {
    flex: 1,
  },
  editButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    fontWeight: '600',
  },
  statsCard: {
    flexDirection: 'row',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
    justifyContent: 'space-around',
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    marginLeft: 4,
  },
  sectionContent: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    borderBottomWidth: 1,
  },
  settingIcon: {
    marginRight: 12,
  },
  settingLabel: {
    flex: 1,
    fontSize: 15,
  },
  settingValue: {
    fontSize: 14,
  },
  logoContainer: {
    alignItems: 'center',
    paddingVertical: 24,
    marginBottom: 16,
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
  },
  appName: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: 12,
  },
  appVersion: {
    fontSize: 14,
    marginTop: 4,
  },
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
    lineHeight: 18,
  },
});