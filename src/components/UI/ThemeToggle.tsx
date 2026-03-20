'use client';

import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#050b14]"
      style={{
        background: theme === 'midnight' ? 'rgba(212, 175, 55, 0.2)' : 'var(--border)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: 'var(--shadow)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Переключить на ${theme === 'midnight' ? 'светлую' : 'тёмную'} тему`}
    >
      <motion.div
        className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: theme === 'midnight' ? 'var(--gradient-primary)' : 'white',
          color: theme === 'midnight' ? '#0a1628' : '#D4AF37',
          boxShadow: 'var(--shadow)'
        }}
        animate={{
          x: theme === 'midnight' ? 0 : 24,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      >
        {theme === 'midnight' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </motion.div>
    </motion.button>
  );
};
