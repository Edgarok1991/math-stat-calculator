'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'luxury' | 'light';

interface ThemeContextType {
  theme: Theme;
  toggleTheme: () => void;
  setTheme: (theme: Theme) => void;
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (context === undefined) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: React.ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<Theme>('luxury');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
      setThemeState('light');
    } else if (savedTheme === 'luxury' || savedTheme === 'midnight') {
      setThemeState('luxury');
    }
    setMounted(true);
  }, []);

  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme === 'luxury' ? 'luxury' : 'light');
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'luxury' ? 'light' : 'luxury';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {!mounted ? <div style={{ visibility: 'hidden' }}>{children}</div> : children}
    </ThemeContext.Provider>
  );
};
