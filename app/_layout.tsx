import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AppProvider, useApp } from '../contexts/AppContext';
import { useFonts } from 'expo-font';
import { OnboardingWizard } from '../components/onboarding/OnboardingWizard';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { HomeInfo } from '../contexts/AppContext';
import { Task } from '../lib/tasks';

function ThemedApp() {
  const { colors, isDark } = useTheme();
  const { loading, onboardingComplete, addProperty, setActiveProperty, addTask, completeOnboarding, properties } = useApp();
  
  const [fontsLoaded] = useFonts({
    'BebasNeue': require('../assets/fonts/BebasNeue-Regular.ttf'),
  });

  // Handle onboarding completion
  const handleOnboardingComplete = (
    propertyData: {
      address: string;
      city: string;
      state: string;
      zip: string;
      lat?: number;
      lng?: number;
      purchasePrice?: number;
      squareFeet?: number;
      yearBuilt?: number;
    },
    tasks: any[]
  ) => {
    // Add the property
    const propertyId = addProperty(propertyData);
    setActiveProperty(propertyId);
    
    // Add the selected tasks
    tasks.forEach(task => {
      addTask({
        title: task.title,
        category: task.category,
        dueDate: task.dueDate,
        status: 'scheduled',
        priority: task.priority || 'medium',
        propertyId: propertyId,
      });
    });
    
    // Mark onboarding complete
    completeOnboarding();
  };

  // Show loading spinner while checking AsyncStorage
  if (loading) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator size="large" color="#F59E0B" />
      </View>
    );
  }

  // Don't block on fonts - show content even if fonts aren't loaded yet
  // Fonts will apply when ready

  // Show onboarding wizard if not complete
  if (!onboardingComplete || properties.length === 0) {
    return (
      <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
        <StatusBar style={isDark ? "light" : "dark"} />
        <OnboardingWizard onComplete={handleOnboardingComplete} />
      </GestureHandlerRootView>
    );
  }

  // Show main app
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style={isDark ? "light" : "dark"} />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </GestureHandlerRootView>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppProvider>
        <ThemedApp />
      </AppProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000000', // Always black
  },
});