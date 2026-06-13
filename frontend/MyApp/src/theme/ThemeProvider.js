// src/theme/ThemeProvider.js
// App-wide theme context. Follows the system color scheme by default, with a
// manual override persisted under the `theme_pref` AsyncStorage key.
import React, {
  createContext, useContext, useEffect, useMemo, useState, useCallback,
} from 'react';
import { Appearance } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  lightColors, darkColors, spacing, radius, typography, makeElevation,
  fontFamily, BRAND, ROLE_ACCENTS, roleAccent,
} from './tokens';

const THEME_PREF_KEY = 'theme_pref'; // 'light' | 'dark' | 'system'
const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [pref, setPref] = useState('system');
  const [systemScheme, setSystemScheme] = useState(Appearance.getColorScheme() || 'light');
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    let mounted = true;
    AsyncStorage.getItem(THEME_PREF_KEY)
      .then((v) => {
        if (mounted && (v === 'light' || v === 'dark' || v === 'system')) setPref(v);
      })
      .catch(() => {})
      .finally(() => { if (mounted) setHydrated(true); });

    const sub = Appearance.addChangeListener(({ colorScheme }) =>
      setSystemScheme(colorScheme || 'light'));
    return () => { mounted = false; sub.remove(); };
  }, []);

  const isDark = pref === 'system' ? systemScheme === 'dark' : pref === 'dark';
  const colors = isDark ? darkColors : lightColors;

  const setMode = useCallback((next) => {
    setPref(next);
    AsyncStorage.setItem(THEME_PREF_KEY, next).catch(() => {});
  }, []);

  const toggleTheme = useCallback(() => {
    setPref((p) => {
      const resolved = p === 'system' ? (systemScheme === 'dark' ? 'dark' : 'light') : p;
      const next = resolved === 'dark' ? 'light' : 'dark';
      AsyncStorage.setItem(THEME_PREF_KEY, next).catch(() => {});
      return next;
    });
  }, [systemScheme]);

  const value = useMemo(() => ({
    colors,
    spacing,
    radius,
    typography,
    fontFamily,
    elevation: makeElevation(isDark ? 'dark' : 'light'),
    isDark,
    mode: pref,
    setMode,
    toggleTheme,
    hydrated,
    brand: BRAND,
    roleAccents: ROLE_ACCENTS,
    getRoleAccent: (role) => roleAccent(role, isDark),
  }), [colors, isDark, pref, setMode, toggleTheme, hydrated]);

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
