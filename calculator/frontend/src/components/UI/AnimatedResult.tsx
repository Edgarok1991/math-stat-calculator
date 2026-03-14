'use client';

import { motion } from 'framer-motion';
import { CheckCircle, AlertCircle, Info, Zap } from 'lucide-react';

interface AnimatedResultProps {
  type: 'success' | 'error' | 'info' | 'calculation';
  title: string;
  children: React.ReactNode;
  delay?: number;
}

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
  calculation: Zap,
};

const colorMap = {
  success: 'text-green-600 bg-green-50 border-green-200',
  error: 'text-red-600 bg-red-50 border-red-200',
  info: 'text-blue-600 bg-blue-50 border-blue-200',
  calculation: 'text-purple-600 bg-purple-50 border-purple-200',
};

export const AnimatedResult = ({ 
  type, 
  title, 
  children, 
  delay = 0 
}: AnimatedResultProps) => {
  const Icon = iconMap[type];
  const colors = colorMap[type];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ 
        duration: 0.6, 
        delay,
        type: "spring",
        stiffness: 100,
        damping: 15
      }}
      className="p-6 rounded-2xl shadow-xl card-hover"
      style={{ 
        background: 'var(--background-secondary)',
        border: '1px solid var(--border)',
        boxShadow: 'var(--shadow-lg)'
      }}
    >
      <motion.div
        initial={{ opacity: 0, x: -20 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.2 }}
        className="flex items-center gap-3 mb-4"
      >
        <div className={`p-2 rounded-full ${colors}`}>
          <Icon className="w-6 h-6" />
        </div>
        <h3 className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
          {title}
        </h3>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: delay + 0.4 }}
        className="space-y-4"
      >
        {children}
      </motion.div>
    </motion.div>
  );
};