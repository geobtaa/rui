import React, { createContext, useContext, useLayoutEffect, useMemo } from 'react';
import { useSyncExternalStore } from 'react';
import {
  applyThemeToDom,
  getActiveThemeId,
  getAvailableThemes,
  getThemeConfig,
  setActiveThemeId,
  subscribeToThemeChanges,
  type ThemeConfig,
  type ThemeId,
} from '../config/institution';

export interface ThemeContextValue {
  themeId: ThemeId;
  theme: ThemeConfig;
  themes: Array<{ id: ThemeId; label: string }>;
  setThemeId: (id: ThemeId) => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

const AVAILABLE_THEMES = getAvailableThemes();

function getSnapshot(): ThemeId {
  return getActiveThemeId();
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const themeId = useSyncExternalStore(
    subscribeToThemeChanges,
    getSnapshot,
    getSnapshot
  );

  // Ensure the DOM reflects the current theme even on first load.
  // Use layout effect to avoid visible flashes between themes.
  useLayoutEffect(() => {
    applyThemeToDom(themeId);
  }, [themeId]);

  const theme = useMemo<ThemeConfig>(() => getThemeConfig(themeId), [themeId]);

  const value = useMemo<ThemeContextValue>(
    () => ({
      themeId,
      theme,
      themes: AVAILABLE_THEMES,
      setThemeId: (id: ThemeId) => setActiveThemeId(id),
    }),
    [themeId, theme]
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useThemeContext(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('useThemeContext must be used within a ThemeProvider');
  }
  return ctx;
}

