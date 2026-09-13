'use client';

import { createContext, useContext, useEffect, useState } from 'react';
type Theme = 'light' | 'dark';
const ThemeContext = createContext<{ theme: Theme; setTheme(theme: Theme): void } | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setTheme] = useState<Theme>('light');
  useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  return <ThemeContext.Provider value={{ theme, setTheme }}>{children}</ThemeContext.Provider>;
}
export function useTheme() { const value = useContext(ThemeContext); if (!value) throw new Error('useTheme must be used inside ThemeProvider'); return value; }
