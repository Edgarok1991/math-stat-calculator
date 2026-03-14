'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';

type Theme = 'light' | 'dark';

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
  const [theme, setThemeState] = useState<Theme>('light');
  const [mounted, setMounted] = useState(false);

  // Загружаем тему из localStorage при монтировании
  useEffect(() => {
    const savedTheme = localStorage.getItem('theme') as Theme;
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setThemeState(savedTheme);
    } else if (prefersDark) {
      setThemeState('dark');
    }
    
    setMounted(true);
  }, []);

  // Применяем тему к документу
  useEffect(() => {
    if (mounted) {
      const root = document.documentElement;
      root.setAttribute('data-theme', theme);
      
      // Обновляем CSS переменные в зависимости от темы
      if (theme === 'dark') {
        root.style.setProperty('--background', '#0f172a');
        root.style.setProperty('--background-secondary', '#1e293b');
        root.style.setProperty('--background-tertiary', '#334155');
        root.style.setProperty('--foreground', '#f1f5f9');
        root.style.setProperty('--foreground-secondary', '#cbd5e1');
        root.style.setProperty('--foreground-muted', '#94a3b8');
        root.style.setProperty('--border', '#334155');
        root.style.setProperty('--border-light', '#475569');
      } else {
        root.style.setProperty('--background', '#f8fafc');
        root.style.setProperty('--background-secondary', '#ffffff');
        root.style.setProperty('--background-tertiary', '#f1f5f9');
        root.style.setProperty('--foreground', '#1e293b');
        root.style.setProperty('--foreground-secondary', '#64748b');
        root.style.setProperty('--foreground-muted', '#94a3b8');
        root.style.setProperty('--border', '#e2e8f0');
        root.style.setProperty('--border-light', '#f1f5f9');
      }
    }
  }, [theme, mounted]);

  const toggleTheme = () => {
    const newTheme = theme === 'light' ? 'dark' : 'light';
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  const setTheme = (newTheme: Theme) => {
    setThemeState(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  // Не рендерим до монтирования, чтобы избежать гидратации
  if (!mounted) {
    return <div style={{ visibility: 'hidden' }}>{children}</div>;
  }

  return (
    <ThemeContext.Provider value={{ theme, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};
