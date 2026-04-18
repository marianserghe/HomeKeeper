import { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, TextInput, Alert, Switch, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { useApp } from '../../contexts/AppContext';

export default function SettingsScreen() {
  const { colors, theme, setTheme } = useTheme();
  const { homeInfo, updateHomeInfo, settings, updateSettings, tasks, pros, inventory, healthScore, clearAllData, properties, activePropertyId, reorderProperties, setActiveProperty, deleteProperty } = useApp();
  
  const [editingHome, setEditingHome] = useState(false);
  const [tempHomeInfo, setTempHomeInfo] = useState(homeInfo);

  const handleSaveHomeInfo = () => {
    updateHomeInfo(tempHomeInfo);
    setEditingHome(false);
  };

  const handleExportData = () => {
    const exportData = {
      tasks,
      pros,
      inventory,
      homeInfo,
      settings,
      exportDate: new Date().toISOString(),
    };
    console.log('Export data:', JSON.stringify(exportData, null, 2));
    Alert.alert('Exported', 'Data has been logged to console. File export coming soon!');
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
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scrollView} contentContainerStyle={styles.content}>
        {/* Header */}
        <Text style={[styles.title, { color: colors.textPrimary }]}>Settings</Text>

        {/* Home Info Card */}
        <View style={[styles.card, { backgroundColor: colors.surface }]}>
          <View style={styles.cardHeader}>
            <Ionicons name="home" size={24} color={colors.primary} />
            <Text style={[styles.cardTitle, { color: colors.textPrimary }]}>{homeInfo.name || 'Your Home'}</Text>
          </View>
          
          {editingHome ? (
            <View style={styles.editForm}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Property Name (Optional)</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={tempHomeInfo.name || ''}
                onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, name: text })}
                placeholder="e.g., Main Home, Beach House"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Street Address</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={tempHomeInfo.address || ''}
                onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, address: text })}
                placeholder="123 Main St"
                placeholderTextColor={colors.textTertiary}
              />
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>City</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={tempHomeInfo.city || ''}
                onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, city: text })}
                placeholder="Waldwick"
                placeholderTextColor={colors.textTertiary}
              />
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>State</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    value={tempHomeInfo.state || ''}
                    onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, state: text.toUpperCase() })}
                    placeholder="NJ"
                    placeholderTextColor={colors.textTertiary}
                    maxLength={2}
                    autoCapitalize="characters"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>ZIP</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    value={tempHomeInfo.zip || ''}
                    onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, zip: text })}
                    placeholder="07463"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                    maxLength={5}
                  />
                </View>
              </View>
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Sq Ft</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    value={tempHomeInfo.squareFeet?.toString() || ''}
                    onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, squareFeet: text ? parseInt(text) : undefined })}
                    placeholder="2000"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Year Built</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    value={tempHomeInfo.yearBuilt?.toString() || ''}
                    onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, yearBuilt: text ? parseInt(text) : undefined })}
                    placeholder="1990"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Purchase Price</Text>
              <TextInput
                style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                value={tempHomeInfo.purchasePrice?.toString() || ''}
                onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, purchasePrice: text ? parseInt(text) : undefined })}
                placeholder="500000"
                placeholderTextColor={colors.textTertiary}
                keyboardType="number-pad"
              />
              <View style={styles.rowInputs}>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bedrooms</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    value={tempHomeInfo.bedrooms?.toString() || ''}
                    onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, bedrooms: text ? parseInt(text) : undefined })}
                    placeholder="4"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
                <View style={styles.halfInput}>
                  <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Bathrooms</Text>
                  <TextInput
                    style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
                    value={tempHomeInfo.bathrooms?.toString() || ''}
                    onChangeText={(text) => setTempHomeInfo({ ...tempHomeInfo, bathrooms: text ? parseInt(text) : undefined })}
                    placeholder="2"
                    placeholderTextColor={colors.textTertiary}
                    keyboardType="number-pad"
                  />
                </View>
              </View>
              <View style={styles.editButtons}>
                <Pressable
                  style={[styles.cancelButton, { borderColor: colors.border }]}
                  onPress={() => {
                    setTempHomeInfo(homeInfo);
                    setEditingHome(false);
                  }}
                >
                  <Text style={[styles.cancelButtonText, { color: colors.textSecondary }]}>Cancel</Text>
                </Pressable>
                <Pressable
                  style={[styles.saveButton, { backgroundColor: colors.primary }]}
                  onPress={handleSaveHomeInfo}
                >
                  <Text style={[styles.saveButtonText, { color: colors.white }]}>Save</Text>
                </Pressable>
              </View>
            </View>
          ) : (
            <Pressable style={styles.homeInfoDisplay} onPress={() => {
              setTempHomeInfo(homeInfo);
              setEditingHome(true);
            }}>
              {/* Address Section */}
              <View style={styles.addressSection}>
                <View style={styles.addressRow}>
                  <Ionicons name="location" size={18} color={colors.primary} />
                  <View style={styles.addressText}>
                    <Text style={[styles.addressLine1, { color: colors.textPrimary }]}>
                      {homeInfo.address || 'Add address'}
                    </Text>
                    <Text style={[styles.addressLine2, { color: colors.textSecondary }]}>
                      {[homeInfo.city, homeInfo.state, homeInfo.zip].filter(Boolean).join(', ') || 'Add location'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Stats Grid */}
              <View style={styles.statsGrid}>
                {homeInfo.squareFeet && (
                  <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="resize" size={20} color={colors.textSecondary} />
                    <Text style={[styles.cardStatValue, { color: colors.textPrimary }]}>
                      {homeInfo.squareFeet.toLocaleString()}
                    </Text>
                    <Text style={[styles.cardStatLabel, { color: colors.textTertiary }]}>sq ft</Text>
                  </View>
                )}
                {homeInfo.yearBuilt && (
                  <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="calendar" size={20} color={colors.textSecondary} />
                    <Text style={[styles.cardStatValue, { color: colors.textPrimary }]}>
                      {homeInfo.yearBuilt}
                    </Text>
                    <Text style={[styles.cardStatLabel, { color: colors.textTertiary }]}>year built</Text>
                  </View>
                )}
                {homeInfo.purchasePrice && (
                  <View style={[styles.statCard, { backgroundColor: colors.background }]}>
                    <Ionicons name="wallet" size={20} color={colors.textSecondary} />
                    <Text style={[styles.cardStatValue, { color: colors.textPrimary }]}>
                      ${(homeInfo.purchasePrice / 1000).toFixed(0)}K
                    </Text>
                    <Text style={[styles.cardStatLabel, { color: colors.textTertiary }]}>purchase</Text>
                  </View>
                )}
                {(homeInfo.bedrooms || homeInfo.bathrooms) && (
                  <View style={[styles.statCard, styles.bedsBathsCard, { backgroundColor: colors.background }]}>
                    {homeInfo.bedrooms && (
                      <View style={styles.bedsBathsItem}>
                        <Ionicons name="bed" size={20} color={colors.textSecondary} />
                        <Text style={[styles.cardStatValue, { color: colors.textPrimary }]}>{homeInfo.bedrooms}</Text>
                        <Text style={[styles.cardStatLabel, { color: colors.textTertiary }]}>beds</Text>
                      </View>
                    )}
                    {homeInfo.bedrooms && homeInfo.bathrooms && (
                      <View style={[styles.bedsBathsDivider, { backgroundColor: colors.border }]} />
                    )}
                    {homeInfo.bathrooms && (
                      <View style={styles.bedsBathsItem}>
                        <Ionicons name="water" size={20} color={colors.textSecondary} />
                        <Text style={[styles.cardStatValue, { color: colors.textPrimary }]}>{homeInfo.bathrooms}</Text>
                        <Text style={[styles.cardStatLabel, { color: colors.textTertiary }]}>baths</Text>
                      </View>
                    )}
                  </View>
                )}
              </View>

              <View style={styles.tapToEditWrap}>
                <Text style={[styles.tapToEdit, { color: colors.primary }]}>Tap to edit</Text>
              </View>
            </Pressable>
          )}
        </View>

        {/* Properties */}
        {properties.length > 1 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>Properties</Text>
            <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
              {properties.map((property, index) => (
                <View
                  key={property.id}
                  style={[
                    styles.settingRow,
                    { borderBottomColor: colors.border },
                    index === properties.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  {/* Reorder controls */}
                  <View style={styles.reorderControls}>
                    <Pressable
                      onPress={() => index > 0 && reorderProperties(index, index - 1)}
                      disabled={index === 0}
                      style={[styles.reorderBtn, index === 0 && styles.reorderBtnDisabled]}
                    >
                      <Ionicons name="chevron-up" size={16} color={index === 0 ? colors.textTertiary : colors.textSecondary} />
                    </Pressable>
                    <Pressable
                      onPress={() => index < properties.length - 1 && reorderProperties(index, index + 1)}
                      disabled={index === properties.length - 1}
                      style={[styles.reorderBtn, index === properties.length - 1 && styles.reorderBtnDisabled]}
                    >
                      <Ionicons name="chevron-down" size={16} color={index === properties.length - 1 ? colors.textTertiary : colors.textSecondary} />
                    </Pressable>
                  </View>

                  <View style={styles.propertyInfo}>
                    <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>
                      {property.name || 'Property'}
                    </Text>
                    {property.address && (
                      <Text style={[styles.propertyAddress, { color: colors.textTertiary }]}>
                        {property.address}
                      </Text>
                    )}
                  </View>

                  {property.id === activePropertyId ? (
                    <View style={[styles.activeBadge, { backgroundColor: colors.primary + '20' }]}>
                      <Text style={[styles.activeBadgeText, { color: colors.primary }]}>Active</Text>
                    </View>
                  ) : (
                    <Pressable 
                      style={[styles.setActiveBtn, { borderColor: colors.border }]}
                      onPress={() => property.id && setActiveProperty(property.id)}
                    >
                      <Text style={[styles.setActiveText, { color: colors.textSecondary }]}>Set Active</Text>
                    </Pressable>
                  )}
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Quick Stats */}
        <View style={[styles.statsCard, { backgroundColor: colors.surface }]}>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.primary }]}>{healthScore}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Health</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.warning }]}>{tasks.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Tasks</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.success }]}>{pros.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Pros</Text>
          </View>
          <View style={styles.statItem}>
            <Text style={[styles.statValue, { color: colors.info }]}>{inventory.length}</Text>
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
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="notifications" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Notifications</Text>
              <Switch
                value={settings.notifications}
                onValueChange={(value) => updateSettings({ notifications: value })}
                trackColor={{ false: colors.gray300, true: colors.primary }}
                thumbColor={colors.white}
              />
            </View>
            <View style={[styles.settingRow, { borderBottomWidth: 0 }]}>
              <Ionicons name="alarm" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Task Reminders</Text>
              <Switch
                value={settings.reminders}
                onValueChange={(value) => updateSettings({ reminders: value })}
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

        {/* About */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.textSecondary }]}>About</Text>
          <View style={[styles.sectionContent, { backgroundColor: colors.surface }]}>
            <View style={[styles.settingRow, { borderBottomColor: colors.border }]}>
              <Ionicons name="information-circle-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Version</Text>
              <Text style={[styles.settingValue, { color: colors.textTertiary }]}>1.0.0</Text>
            </View>
            <Pressable 
              style={[styles.settingRow, { borderBottomColor: colors.border }]}
              onPress={() => Alert.alert('Rate HomeKeeper', 'Thanks for using HomeKeeper!')}
            >
              <Ionicons name="star-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Rate the App</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
            <Pressable 
              style={[styles.settingRow, { borderBottomWidth: 0 }]}
              onPress={() => Alert.alert('Privacy', 'Your data stays on your device. We don\'t track or sell your information.')}
            >
              <Ionicons name="shield-checkmark-outline" size={20} color={colors.primary} style={styles.settingIcon} />
              <Text style={[styles.settingLabel, { color: colors.textPrimary }]}>Privacy Policy</Text>
              <Ionicons name="chevron-forward" size={18} color={colors.textTertiary} />
            </Pressable>
          </View>
        </View>

        {/* Footer */}
        <Text style={[styles.footerText, { color: colors.textTertiary }]}>
          HomeKeeper v1.0.0{'\n'}
          Made with ❤️ for homeowners
        </Text>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  footerText: {
    textAlign: 'center',
    fontSize: 12,
    marginTop: 32,
    lineHeight: 18,
  },
});