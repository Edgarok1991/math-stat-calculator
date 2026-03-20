'use client';

import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info, Lightbulb, AlertTriangle, HelpCircle } from 'lucide-react';

interface InteractiveHintProps {
  title: string;
  content: string;
  type?: 'info' | 'tip' | 'warning' | 'help';
  position?: 'top' | 'bottom' | 'left' | 'right';
  children: React.ReactNode;
}

const iconMap = {
  info: Info,
  tip: Lightbulb,
  warning: AlertTriangle,
  help: HelpCircle,
};

const colorMap = {
  info: 'text-[#D4AF37] bg-[rgba(212,175,55,0.15)] border-[rgba(212,175,55,0.4)]',
  tip: 'text-[#E8C547] bg-[rgba(232,197,71,0.15)] border-[rgba(232,197,71,0.4)]',
  warning: 'text-red-400 bg-red-900/30 border-red-500/50',
  help: 'text-[#D4AF37] bg-[rgba(212,175,55,0.15)] border-[rgba(212,175,55,0.4)]',
};

export const InteractiveHint = ({ 
  title, 
  content, 
  type = 'info', 
  position = 'top',
  children 
}: InteractiveHintProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ x: 0, y: 0 });
  const triggerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const Icon = iconMap[type];
  const colors = colorMap[type];

  useEffect(() => {
    if (isVisible && triggerRef.current && tooltipRef.current) {
      const triggerRect = triggerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      
      let x = triggerRect.left + triggerRect.width / 2 - tooltipRect.width / 2;
      let y = triggerRect.top - tooltipRect.height - 8;

      // Adjust position based on viewport bounds
      if (x < 8) x = 8;
      if (x + tooltipRect.width > window.innerWidth - 8) {
        x = window.innerWidth - tooltipRect.width - 8;
      }
      if (y < 8) {
        y = triggerRect.bottom + 8;
      }

      setTooltipPosition({ x, y });
    }
  }, [isVisible, position]);

  const getTooltipClasses = () => {
    const baseClasses = 'absolute z-50 max-w-xs p-3 rounded-lg border shadow-lg';
    const positionClasses = {
      top: 'bottom-full left-1/2 transform -translate-x-1/2 mb-2',
      bottom: 'top-full left-1/2 transform -translate-x-1/2 mt-2',
      left: 'right-full top-1/2 transform -translate-y-1/2 mr-2',
      right: 'left-full top-1/2 transform -translate-y-1/2 ml-2',
    };
    
    return `${baseClasses} ${positionClasses[position]} ${colors}`;
  };

  return (
    <div className="relative inline-block">
      <div
        ref={triggerRef}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children}
      </div>

      <AnimatePresence>
        {isVisible && (
          <motion.div
            ref={tooltipRef}
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className={getTooltipClasses()}
            style={{
              left: position === 'left' || position === 'right' ? 'auto' : `${tooltipPosition.x}px`,
              top: position === 'top' || position === 'bottom' ? 'auto' : `${tooltipPosition.y}px`,
            }}
          >
            <div className="flex items-start gap-2">
              <Icon className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-semibold text-sm mb-1">{title}</h4>
                <p className="text-xs leading-relaxed">{content}</p>
              </div>
            </div>
            
            {/* Arrow */}
            <div
              className={`absolute w-2 h-2 transform rotate-45 ${
                position === 'top' ? 'top-full left-1/2 -translate-x-1/2 -mt-1' :
                position === 'bottom' ? 'bottom-full left-1/2 -translate-x-1/2 -mb-1' :
                position === 'left' ? 'left-full top-1/2 -translate-y-1/2 -ml-1' :
                'right-full top-1/2 -translate-y-1/2 -mr-1'
              }`}
              style={{
                backgroundColor: 'inherit',
                borderColor: 'inherit',
                borderWidth: '1px',
                borderStyle: 'solid',
              }}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};