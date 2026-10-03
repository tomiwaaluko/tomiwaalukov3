import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

/** Each full page load picks one accent. The three outcomes are equally likely. */
export type AccentTheme = 'cream' | 'tron' | 'nigerian';

export function rollAccentTheme(): AccentTheme {
  const roll = Math.random();
  if (roll < 1 / 3) return 'tron';
  if (roll < 2 / 3) return 'nigerian';
  return 'cream';
}

interface AccentThemeContextValue {
  accentTheme: AccentTheme;
}

const AccentThemeContext = createContext<AccentThemeContextValue | undefined>(undefined);

export function useAccentTheme() {
  const ctx = useContext(AccentThemeContext);
  if (!ctx) {
    throw new Error('useAccentTheme must be used within TronThemeProvider');
  }
  return ctx;
}

const THEME_CLASS: Record<AccentTheme, string | null> = {
  cream: null,
  tron: 'tron-theme',
  nigerian: 'nigerian-theme',
};

export const TronThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [accentTheme] = useState(rollAccentTheme);

  useLayoutEffect(() => {
    const root = document.documentElement;
    root.classList.remove('tron-theme', 'nigerian-theme');
    const themeClass = THEME_CLASS[accentTheme];
    if (themeClass) root.classList.add(themeClass);
    return () => root.classList.remove('tron-theme', 'nigerian-theme');
  }, [accentTheme]);

  return (
    <AccentThemeContext.Provider value={{ accentTheme }}>
      {children}
    </AccentThemeContext.Provider>
  );
};
