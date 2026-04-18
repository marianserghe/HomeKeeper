// ============================================
// HOMEKEEPER - Dark Theme Colors
// ============================================

export const DarkColors = {
  // Primary brand colors - Amber accent (warm, home feeling)
  primary: '#F59E0B',
  primaryDark: '#D97706',
  primaryLight: '#FBBF24',
  
  // Accent colors
  accent: {
    amber: '#F59E0B',
    amberBg: '#2A1F0D',
    teal: '#14B8A6',
    tealBg: '#0D2A26',
    purple: '#8B5CF6',
    purpleBg: '#1E1633',
    blue: '#3B82F6',
    blueBg: '#0D1F3D',
    green: '#22C55E',
    greenBg: '#0D2818',
  },
  
  // Semantic colors
  success: '#22C55E',
  successLight: '#4ADE80',
  successBg: '#0D2818',
  warning: '#F59E0B',
  warningLight: '#FBBF24',
  warningBg: '#2A1F0D',
  error: '#EF4444',
  errorLight: '#F87171',
  errorBg: '#2A1215',
  info: '#3B82F6',
  infoLight: '#60A5FA',
  infoBg: '#0D1F3D',
  
  // Task status colors
  overdue: '#EF4444',
  upcoming: '#F59E0B',
  completed: '#22C55E',
  
  // Health score gradient
  healthHigh: '#22C55E',
  healthMedium: '#F59E0B',
  healthLow: '#EF4444',
  
  // Neutral palette - Dark theme
  white: '#FFFFFF',
  black: '#000000',
  gray50: '#18181B',
  gray100: '#1F1F23',
  gray200: '#27272A',
  gray300: '#3F3F46',
  gray400: '#52525B',
  gray500: '#71717A',
  gray600: '#A1A1AA',
  gray700: '#D4D4D8',
  gray800: '#E4E4E7',
  gray900: '#F4F4F5',
  
  // Background colors - Dark theme
  background: '#000000',
  surface: '#121212',
  surfaceSecondary: '#1A1A1A',
  surfaceTertiary: '#222222',
  
  // Text colors - Light text on dark
  textPrimary: '#FFFFFF',
  textSecondary: '#9CA3AF',
  textTertiary: '#6B7280',
  textInverse: '#000000',
  
  // Border colors - Dark borders
  border: '#1F1F23',
  borderDark: '#2A2A2A',
  borderLight: '#3A3A3A',
  
  // Tab bar
  tabActive: '#FFFFFF',
  tabInactive: '#52525B',
  tabBackground: '#0A0A0A',
  
  // Card gradients
  cardGradientStart: '#1A1A1A',
  cardGradientEnd: '#121212',
  
  // Overlay
  overlay: 'rgba(0, 0, 0, 0.7)',
  overlayLight: 'rgba(0, 0, 0, 0.4)',
};

export type ThemeColors = typeof DarkColors;