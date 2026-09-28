import React, { createContext, useContext, useState, useEffect } from "react";
import { useColorScheme } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

export type ThemeMode = "light" | "dark" | "system";

export const lightColors = {
  primary: "#FBCC33",
  secondary: "#120E01",
  background: "#FAFAFA",
  surface: "#FFFFFF",
  text: "#120E01",
  textSecondary: "#666666",
  textMuted: "#999999",
  border: "#f3f3f3",
  borderInput: "rgba(18, 14, 1, 0.15)",
  success: "#1a9c4b",
  error: "#E53E3E",
  warning: "#e6a700",
  overlay: "rgba(0,0,0,0.5)",
  card: "#FFFFFF",
  cardBorder: "rgba(18, 14, 1, 0.08)",
};

export const darkColors = {
  primary: "#FBCC33",
  secondary: "#FBCC33",
  background: "#0A0A0A",
  surface: "#1A1A1A",
  text: "#FFFFFF",
  textSecondary: "#B0B0B0",
  textMuted: "#707070",
  border: "#2A2A2A",
  borderInput: "rgba(255, 255, 255, 0.15)",
  success: "#22C55E",
  error: "#EF4444",
  warning: "#F59E0B",
  overlay: "rgba(0,0,0,0.7)",
  card: "#1A1A1A",
  cardBorder: "rgba(255, 255, 255, 0.08)",
};

export type Colors = typeof lightColors;

interface ThemeContextType {
  colors: Colors;
  isDark: boolean;
  themeMode: ThemeMode;
  setThemeMode: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const THEME_STORAGE_KEY = "@dai_theme_mode";

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const systemColorScheme = useColorScheme();
  const [themeMode, setThemeModeState] = useState<ThemeMode>("system");
  const [isReady, setIsReady] = useState(false);

  // Load saved theme preference
  useEffect(() => {
    async function loadTheme() {
      try {
        const saved = await AsyncStorage.getItem(THEME_STORAGE_KEY);
        if (saved && (saved === "light" || saved === "dark" || saved === "system")) {
          setThemeModeState(saved as ThemeMode);
        }
      } catch (error) {
        console.error("Failed to load theme preference:", error);
      } finally {
        setIsReady(true);
      }
    }
    loadTheme();
  }, []);

  // Save theme preference
  const setThemeMode = async (mode: ThemeMode) => {
    setThemeModeState(mode);
    try {
      await AsyncStorage.setItem(THEME_STORAGE_KEY, mode);
    } catch (error) {
      console.error("Failed to save theme preference:", error);
    }
  };

  // Determine actual theme based on mode
  const isDark =
    themeMode === "dark" ||
    (themeMode === "system" && systemColorScheme === "dark");

  const colors = isDark ? darkColors : lightColors;

  if (!isReady) {
    return null; // Or a loading screen
  }

  return (
    <ThemeContext.Provider value={{ colors, isDark, themeMode, setThemeMode }}>
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error("useTheme must be used within a ThemeProvider");
  }
  return context;
}
