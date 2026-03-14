'use client';

import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export const ThemeToggle = () => {
  const [mounted, setMounted] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    setMounted(true);
    
    // Загружаем тему из localStorage
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark';
    const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    
    if (savedTheme) {
      setTheme(savedTheme);
    } else if (prefersDark) {
      setTheme('dark');
    }
  }, []);

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
    setTheme(newTheme);
    localStorage.setItem('theme', newTheme);
  };

  if (!mounted) {
    return null;
  }

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-indigo-500"
      style={{
        background: theme === 'dark' ? 'var(--primary)' : 'var(--border)',
        boxShadow: 'var(--shadow)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Переключить на ${theme === 'light' ? 'темную' : 'светлую'} тему`}
    >
      <motion.div
        className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: 'var(--background-secondary)',
          boxShadow: 'var(--shadow)'
        }}
        animate={{
          x: theme === 'dark' ? 24 : 0,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      >
        {theme === 'light' ? (
          <Sun className="w-4 h-4 text-amber-500" />
        ) : (
          <Moon className="w-4 h-4 text-indigo-600" />
        )}
      </motion.div>
    </motion.button>
  );
};