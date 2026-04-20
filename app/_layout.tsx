import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { ThemeProvider, useTheme } from '../contexts/ThemeContext';
import { AppProvider } from '../contexts/AppContext';
import { useFonts } from 'expo-font';

function ThemedApp() {
  const { colors } = useTheme();
  
  const [fontsLoaded] = useFonts({
    'BebasNeue': require('../assets/fonts/BebasNeue-Regular.ttf'),
  });

  // Don't block rendering - show content even if fonts aren't loaded yet
  // Fonts will apply when ready

  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.background }}>
      <StatusBar style="light" />
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