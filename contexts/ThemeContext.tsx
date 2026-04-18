// ============================================
// HOMEKEEPER - Theme Context
// ============================================

import React, { createContext, useContext, useState, ReactNode } from 'react';
import { DarkColors, LightColors, ThemeColors } from '../constants/colors';

type Theme = 'dark' | 'light';

interface ThemeContextType {
  theme: Theme;
  colors: ThemeColors;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
  isDark: boolean;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

interface ThemeProviderProps {
  children: ReactNode;
}

export function ThemeProvider({ children }: ThemeProviderProps) {
  const [theme, setThemeState] = useState<Theme>('dark'); // Default to dark, no persistence for now

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
  };

  const toggleTheme = () => {
    setThemeState(theme === 'dark' ? 'light' : 'dark');
  };

  const colors = theme === 'dark' ? DarkColors : LightColors;

  return (
    <ThemeContext.Provider
      value={{
        theme,
        colors,
        toggleTheme,
        setTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme(): ThemeContextType {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}

// Convenience hook for just colors (most common use case)
export function useColors(): ThemeColors {
  const { colors } = useTheme();
  return colors;
}