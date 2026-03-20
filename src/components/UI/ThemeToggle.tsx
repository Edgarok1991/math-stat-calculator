'use client';

import { Sun, Moon } from 'lucide-react';
import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';

export const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-[#D4AF37] focus:ring-offset-2 focus:ring-offset-[#1c1917]"
      style={{
        background: theme === 'luxury' ? 'rgba(212, 175, 55, 0.2)' : 'var(--border)',
        border: '1px solid rgba(212, 175, 55, 0.4)',
        boxShadow: 'var(--shadow)'
      }}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      aria-label={`Переключить на ${theme === 'luxury' ? 'светлую' : 'тёмную люкс'} тему`}
    >
      <motion.div
        className="absolute top-1 left-1 w-6 h-6 rounded-full flex items-center justify-center"
        style={{
          background: theme === 'luxury' ? 'var(--gradient-primary)' : 'white',
          color: theme === 'luxury' ? '#1c1917' : '#b8962e',
          boxShadow: 'var(--shadow)'
        }}
        animate={{
          x: theme === 'luxury' ? 0 : 24,
        }}
        transition={{
          type: 'spring',
          stiffness: 500,
          damping: 30
        }}
      >
        {theme === 'luxury' ? (
          <Moon className="w-4 h-4" />
        ) : (
          <Sun className="w-4 h-4" />
        )}
      </motion.div>
    </motion.button>
  );
};
