// Design tokens for WISECP Admin. Light + Dark, from design_guidelines.json.
//
// Build StyleSheets with makeStyles((colors) => ({...})) and read runtime color
// props from useTheme().colors. Never write color literals in components.

import { useMemo } from "react";
import { Appearance, StyleSheet, useColorScheme } from "react-native";

export type ColorScheme = "light" | "dark";

const light = {
  surface: "#FFFFFF",
  onSurface: "#0F172A",
  surfaceSecondary: "#F8FAFC",
  onSurfaceSecondary: "#334155",
  surfaceTertiary: "#F1F5F9",
  onSurfaceTertiary: "#475569",
  surfaceInverse: "#0F172A",
  onSurfaceInverse: "#FFFFFF",
  muted: "#64748B",

  brand: "#1B6FE3",
  onBrand: "#FFFFFF",
  brandPrimary: "#1B6FE3",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#DBEAFE",
  onBrandSecondary: "#1E3A8A",
  brandTertiary: "#EFF6FF",
  onBrandTertiary: "#1D4ED8",

  success: "#10B981",
  onSuccess: "#FFFFFF",
  warning: "#F59E0B",
  onWarning: "#FFFFFF",
  error: "#EF4444",
  onError: "#FFFFFF",
  info: "#3B82F6",
  onInfo: "#FFFFFF",

  border: "#E2E8F0",
  borderStrong: "#CBD5E1",
  divider: "#F1F5F9",
};

const dark: typeof light = {
  surface: "#0F172A",
  onSurface: "#F8FAFC",
  surfaceSecondary: "#1E293B",
  onSurfaceSecondary: "#CBD5E1",
  surfaceTertiary: "#334155",
  onSurfaceTertiary: "#94A3B8",
  surfaceInverse: "#FFFFFF",
  onSurfaceInverse: "#0F172A",
  muted: "#94A3B8",

  brand: "#3B82F6",
  onBrand: "#FFFFFF",
  brandPrimary: "#3B82F6",
  onBrandPrimary: "#FFFFFF",
  brandSecondary: "#1E3A8A",
  onBrandSecondary: "#BFDBFE",
  brandTertiary: "#172554",
  onBrandTertiary: "#93C5FD",

  success: "#34D399",
  onSuccess: "#052E1C",
  warning: "#FBBF24",
  onWarning: "#3B2706",
  error: "#F87171",
  onError: "#3B0A0A",
  info: "#60A5FA",
  onInfo: "#05203F",

  border: "#334155",
  borderStrong: "#475569",
  divider: "#1E293B",
};

export type ThemeColors = typeof light;

export const defaultScheme = "light" satisfies ColorScheme;
export const themes: { light: ThemeColors; dark?: ThemeColors } = { light, dark };

// Spacing / radius / type tokens (from design_guidelines.json).
export const spacing = { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, "2xl": 32, "3xl": 48 } as const;
export const radius = { sm: 6, md: 12, lg: 20, pill: 999 } as const;
export const fontSize = { sm: 12, base: 14, lg: 16, xl: 20, "2xl": 24, "3xl": 30 } as const;

export function setColorScheme(scheme: ColorScheme | null) {
  Appearance.setColorScheme?.(scheme ?? "unspecified");
}

// Both schemes ship: let the device decide.
setColorScheme?.(themes.dark ? null : defaultScheme);

export function useTheme(): { scheme: ColorScheme; colors: ThemeColors } {
  const system = useColorScheme();
  const scheme: ColorScheme = system && themes[system] ? system : defaultScheme;
  return { scheme, colors: themes[scheme] ?? themes.light };
}

export function makeStyles<T extends StyleSheet.NamedStyles<T> | StyleSheet.NamedStyles<any>>(
  factory: (colors: ThemeColors) => T & StyleSheet.NamedStyles<any>,
): () => T {
  return function useStyles(): T {
    const { colors } = useTheme();
    return useMemo(() => StyleSheet.create(factory(colors)), [colors]);
  };
}
