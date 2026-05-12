import React, { createContext, useContext, useLayoutEffect, useState } from 'react';

/** Probability (0–1) that a full page load uses TRON accent + Tron Legacy playlist only. */
export const TRON_THEME_ROLL_CHANCE = 0.22;

interface TronThemeContextValue {
  isTronTheme: boolean;
}

const TronThemeContext = createContext<TronThemeContextValue | undefined>(undefined);

export function useTronTheme() {
  const ctx = useContext(TronThemeContext);
  if (!ctx) {
    throw new Error('useTronTheme must be used within TronThemeProvider');
  }
  return ctx;
}

export const TronThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isTronTheme] = useState(() => Math.random() < TRON_THEME_ROLL_CHANCE);

  useLayoutEffect(() => {
    const root = document.documentElement;
    if (isTronTheme) {
      root.classList.add('tron-theme');
    } else {
      root.classList.remove('tron-theme');
    }
    return () => root.classList.remove('tron-theme');
  }, [isTronTheme]);

  return (
    <TronThemeContext.Provider value={{ isTronTheme }}>
      {children}
    </TronThemeContext.Provider>
  );
};
