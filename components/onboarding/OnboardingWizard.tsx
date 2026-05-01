import { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, Dimensions, ScrollView, TextInput, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../contexts/ThemeContext';
import { autocompleteAddress, AddressSuggestion } from '../../lib/zestimate';
import { geocodeAddress } from '../../lib/hereSearch';
import { getZoneFromCoordinates, ClimateZone } from '../../lib/climateZone';
import { getSeasonalTips } from '../../lib/seasonalTips';
import AsyncStorage from '@react-native-async-storage/async-storage';

const { width } = Dimensions.get('window');

interface OnboardingWizardProps {
  onComplete: (property: {
    address: string;
    city: string;
    state: string;
    zip: string;
    lat?: number;
    lng?: number;
    purchasePrice?: number;
    squareFeet?: number;
    yearBuilt?: number;
  }, tasks: any[]) => void;
}

export function OnboardingWizard({ onComplete }: OnboardingWizardProps) {
  const { colors, isDark } = useTheme();
  const [step, setStep] = useState(0);
  
  // Property state
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [squareFeet, setSquareFeet] = useState('');
  const [yearBuilt, setYearBuilt] = useState('');
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  
  // Task suggestions state
  const [suggestedTasks, setSuggestedTasks] = useState<any[]>([]);
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set());
  const [loadingTasks, setLoadingTasks] = useState(false);
  
  // Geocoding result
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  // Address autocomplete
  useEffect(() => {
    if (!address || address.length < 3) {
      setSuggestions([]);
      setShowSuggestions(false);
      return;
    }

    const timeout = setTimeout(async () => {
      try {
        console.log('Onboarding: Fetching autocomplete for:', address);
        const results = await autocompleteAddress(address);
        console.log('Onboarding: Got', results.length, 'suggestions');
        setSuggestions(results);
        setShowSuggestions(results.length > 0);
      } catch (e) {
        console.error('Onboarding: Autocomplete error:', e);
        setSuggestions([]);
      }
    }, 300);

    return () => clearTimeout(timeout);
  }, [address]);

  const handleSelectSuggestion = (suggestion: AddressSuggestion) => {
    setShowSuggestions(false);
    setSuggestions([]);
    setAddress(suggestion.street || suggestion.label.split(',')[0] || '');
    if (suggestion.city) setCity(suggestion.city);
    if (suggestion.state) setState(suggestion.state);
    if (suggestion.postalCode) setZip(suggestion.postalCode);
  };

  const handleNextFromProperty = async () => {
    setLoadingTasks(true);
    
    // Geocode the address
    let geoCoords = null;
    if (zip.trim()) {
      geoCoords = await geocodeAddress(zip.trim());
      if (!geoCoords && address.trim() && city.trim()) {
        const fullAddress = `${address.trim()}, ${city.trim()}, ${state.trim() || 'NJ'} ${zip.trim()}`;
        geoCoords = await geocodeAddress(fullAddress);
      }
    }
    
    setCoords(geoCoords);
    
    // Generate tasks based on climate zone
    const climateZone: ClimateZone = geoCoords 
      ? getZoneFromCoordinates(geoCoords.lat, geoCoords.lng)
      : getZoneFromCoordinates(41.0, -74.1); // Default to NJ area
    
    const currentMonth = new Date().getMonth() + 1;
    const monthTips = getSeasonalTips(climateZone, currentMonth);
    
    // Extract tasks from seasonal tips - tips are strings
    const tasks: any[] = (monthTips.tips || []).map((tip: string, index: number) => ({
      id: `onboarding-${index}`,
      title: tip,
      category: 'maintenance',
      priority: 'medium',
      dueDate: new Date(Date.now() + (index + 1) * 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Spread over weeks
    }));
    
    setSuggestedTasks(tasks);
    setSelectedTasks(new Set(tasks.map(t => t.id)));
    setLoadingTasks(false);
    setStep(2);
  };

  const toggleTask = (taskId: string) => {
    setSelectedTasks(prev => {
      const next = new Set(prev);
      if (next.has(taskId)) {
        next.delete(taskId);
      } else {
        next.add(taskId);
      }
      return next;
    });
  };

  const handleFinish = () => {
    const tasks = suggestedTasks.filter(t => selectedTasks.has(t.id));
    
    onComplete({
      address: address.trim(),
      city: city.trim(),
      state: state.trim().toUpperCase(),
      zip: zip.trim(),
      lat: coords?.lat,
      lng: coords?.lng,
      purchasePrice: purchasePrice ? parseInt(purchasePrice) : undefined,
      squareFeet: squareFeet ? parseInt(squareFeet) : undefined,
      yearBuilt: yearBuilt ? parseInt(yearBuilt) : undefined,
    }, tasks);
  };

  const screens = [
    // Step 0: Welcome
    <View key="welcome" style={styles.screen}>
      <View style={styles.welcomeContent}>
        <View style={[styles.iconContainer, { backgroundColor: colors.primary + '20' }]}>
          <Ionicons name="home" size={64} color={colors.primary} />
        </View>
        <Text style={[styles.welcomeTitle, { color: colors.textPrimary }]}>
          Welcome to HomeKeeper
        </Text>
        <Text style={[styles.welcomeSubtitle, { color: colors.textSecondary }]}>
          Your personal home maintenance assistant. Never forget a task again.
        </Text>
        
        <View style={styles.featureList}>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Track maintenance tasks
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Get seasonal reminders
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Find trusted pros nearby
            </Text>
          </View>
          <View style={styles.featureRow}>
            <Ionicons name="checkmark-circle" size={20} color={colors.success} />
            <Text style={[styles.featureText, { color: colors.textSecondary }]}>
              Track your home's value
            </Text>
          </View>
        </View>
      </View>
      
      <Pressable 
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={() => setStep(1)}
      >
        <Text style={styles.primaryButtonText}>Get Started</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
    </View>,
    
    // Step 1: Property Info
    <ScrollView key="property" style={styles.screen} contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Add Your Property</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          Let's set up your first property
        </Text>
      </View>
      
      {/* Address */}
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Street Address *</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          value={address}
          onChangeText={setAddress}
          placeholder="Start typing address..."
          placeholderTextColor={colors.textTertiary}
        />
        {showSuggestions && suggestions.length > 0 && (
          <View style={[styles.suggestionsList, { backgroundColor: colors.surface, borderColor: colors.border }]}>
            {suggestions.map((item, index) => (
              <Pressable
                key={item.label + index}
                style={styles.suggestionItem}
                onPress={() => handleSelectSuggestion(item)}
              >
                <Text style={[styles.suggestionText, { color: colors.textPrimary }]}>
                  {item.label}
                </Text>
              </Pressable>
            ))}
          </View>
        )}
      </View>
      
      {/* City, State, ZIP */}
      <View style={styles.row}>
        <View style={[styles.field, styles.cityField]}>
          <Text style={[styles.label, { color: colors.textSecondary }]}>City *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
            value={city}
            onChangeText={setCity}
            placeholder="Waldwick"
            placeholderTextColor={colors.textTertiary}
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
      
      {/* Optional fields */}
      <Text style={[styles.optionalLabel, { color: colors.textTertiary }]}>Optional</Text>
      
      <View style={styles.field}>
        <Text style={[styles.label, { color: colors.textSecondary }]}>Purchase Price</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.textPrimary, borderColor: colors.border }]}
          value={purchasePrice}
          onChangeText={setPurchasePrice}
          placeholder="500000"
          placeholderTextColor={colors.textTertiary}
          keyboardType="number-pad"
        />
      </View>
      
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
      
      <Pressable 
        style={[
          styles.primaryButton, 
          { backgroundColor: address.trim() && city.trim() ? colors.primary : colors.gray300 },
          styles.buttonSpacing
        ]}
        onPress={handleNextFromProperty}
        disabled={!address.trim() || !city.trim()}
      >
        {loadingTasks ? (
          <ActivityIndicator color="white" />
        ) : (
          <>
            <Text style={styles.primaryButtonText}>Next</Text>
            <Ionicons name="arrow-forward" size={20} color="white" />
          </>
        )}
      </Pressable>
    </ScrollView>,
    
    // Step 2: Task Suggestions
    <ScrollView key="tasks" style={styles.screen} contentContainerStyle={styles.scrollContent}>
      <View style={styles.stepHeader}>
        <Text style={[styles.stepTitle, { color: colors.textPrimary }]}>Suggested Tasks</Text>
        <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
          We'll remind you about these home maintenance tasks
        </Text>
      </View>
      
      {suggestedTasks.map(task => (
        <Pressable
          key={task.id}
          style={[
            styles.taskItem,
            { 
              backgroundColor: colors.surface,
              borderColor: selectedTasks.has(task.id) ? colors.primary : colors.border,
              borderWidth: selectedTasks.has(task.id) ? 2 : 1,
            }
          ]}
          onPress={() => toggleTask(task.id)}
        >
          <View style={styles.taskCheck}>
            <Ionicons
              name={selectedTasks.has(task.id) ? 'checkmark-circle' : 'ellipse-outline'}
              size={24}
              color={selectedTasks.has(task.id) ? colors.primary : colors.textTertiary}
            />
          </View>
          <View style={styles.taskContent}>
            <Text style={[styles.taskTitle, { color: colors.textPrimary }]}>{task.title}</Text>
            <Text style={[styles.taskCategory, { color: colors.textSecondary }]}>{task.category}</Text>
          </View>
        </Pressable>
      ))}
      
      <Pressable 
        style={[
          styles.primaryButton,
          { backgroundColor: colors.primary },
          styles.buttonSpacing
        ]}
        onPress={() => setStep(3)}
      >
        <Text style={styles.primaryButtonText}>Next</Text>
        <Ionicons name="arrow-forward" size={20} color="white" />
      </Pressable>
    </ScrollView>,
    
    // Step 3: Done
    <View key="done" style={styles.screen}>
      <View style={styles.doneContent}>
        <View style={[styles.checkContainer, { backgroundColor: colors.success + '20' }]}>
          <Ionicons name="checkmark-circle" size={80} color={colors.success} />
        </View>
        <Text style={[styles.doneTitle, { color: colors.textPrimary }]}>You're All Set!</Text>
        <Text style={[styles.doneSubtitle, { color: colors.textSecondary }]}>
          Your property and tasks have been added
        </Text>
        
        <View style={styles.tipsCard}>
          <Text style={[styles.tipsTitle, { color: colors.textPrimary }]}>Quick Tips</Text>
          <View style={styles.tipRow}>
            <Ionicons name="chevron-forward" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Swipe right on tasks to mark them done
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="notifications" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              You'll get reminders before each task
            </Text>
          </View>
          <View style={styles.tipRow}>
            <Ionicons name="construct" size={20} color={colors.primary} />
            <Text style={[styles.tipText, { color: colors.textSecondary }]}>
              Find pros in the Pros tab when you need help
            </Text>
          </View>
        </View>
      </View>
      
      <Pressable 
        style={[styles.primaryButton, { backgroundColor: colors.primary }]}
        onPress={handleFinish}
      >
        <Text style={styles.primaryButtonText}>Go to My Home</Text>
        <Ionicons name="home" size={20} color="white" />
      </Pressable>
    </View>
  ];

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {[0, 1, 2, 3].map(i => (
          <View
            key={i}
            style={[
              styles.progressDot,
              { backgroundColor: i <= step ? colors.primary : colors.gray300 }
            ]}
          />
        ))}
      </View>
      
      {screens[step]}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 60,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 20,
  },
  progressDot: {
    width: 40,
    height: 4,
    borderRadius: 2,
  },
  screen: {
    flex: 1,
    paddingHorizontal: 24,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  
  // Welcome screen
  welcomeContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  welcomeTitle: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 12,
  },
  welcomeSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 40,
    lineHeight: 24,
  },
  featureList: {
    width: '100%',
    gap: 12,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureText: {
    fontSize: 16,
  },
  
  // Step header
  stepHeader: {
    marginBottom: 24,
  },
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 16,
  },
  
  // Form fields
  field: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 14,
    fontSize: 16,
  },
  optionalLabel: {
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
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
  suggestionsList: {
    marginTop: 4,
    borderRadius: 12,
    borderWidth: 1,
    overflow: 'hidden',
  },
  suggestionItem: {
    padding: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(0,0,0,0.1)',
  },
  suggestionText: {
    fontSize: 15,
  },
  
  // Task items
  taskItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  taskCheck: {
    marginRight: 12,
  },
  taskContent: {
    flex: 1,
  },
  taskTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  taskCategory: {
    fontSize: 14,
    textTransform: 'capitalize',
  },
  
  // Done screen
  doneContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  doneTitle: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 12,
  },
  doneSubtitle: {
    fontSize: 16,
    marginBottom: 40,
  },
  tipsCard: {
    width: '100%',
    backgroundColor: 'rgba(0,0,0,0.05)',
    borderRadius: 16,
    padding: 20,
  },
  tipsTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 12,
  },
  tipText: {
    fontSize: 15,
    flex: 1,
  },
  
  // Button
  primaryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginBottom: 40,
  },
  primaryButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
  buttonSpacing: {
    marginTop: 24,
  },
});