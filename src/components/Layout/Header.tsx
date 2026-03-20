'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Calculator, Grid3X3, FunctionSquare, Brain, Menu, X, PieChart, LineChart, User, LogOut, History } from 'lucide-react';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { ThemeToggle } from '@/components/UI/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';

const navigation = [
  { name: 'Главная', href: '/', icon: Calculator },
  { name: 'Графики', href: '/graphs', icon: LineChart },
  { name: 'Статистика', href: '/statistics', icon: PieChart },
  { name: 'Математика', href: '/calculus', icon: FunctionSquare },
  { name: 'Анализ данных', href: '/data-analysis', icon: Brain },
  { name: 'Матрицы', href: '/matrices', icon: Grid3X3 },
];

export default function Header() {
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { user, isAuthenticated, logout } = useAuth();
  const [showUserMenu, setShowUserMenu] = useState(false);

  return (
    <header 
      className="sticky top-0 z-50 backdrop-blur-md glass"
      style={{ 
        borderBottom: '1px solid var(--border)',
        boxShadow: 'var(--shadow)'
      }}
    >
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          <Link href="/" className="flex items-center space-x-3 group">
            <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300 shadow-lg">
              <Calculator className="w-6 h-6 text-white" />
            </div>
            <div>
              <span className="text-2xl font-bold block" style={{ color: 'var(--foreground)' }}>
                MathCalc
              </span>
              <span className="text-xs font-medium opacity-80" style={{ color: 'var(--foreground-secondary)' }}>
                Midnight Blue Edition
              </span>
            </div>
          </Link>

          <div className="flex items-center space-x-4 ml-8">
            <nav className="hidden md:flex space-x-2">
              {navigation.map((item) => {
                // Проверяем активность раздела "Анализ данных" для подстраниц
                const isDataAnalysisSection = item.href === '/data-analysis' && 
                  (pathname === '/clustering' || pathname === '/anova' || pathname === '/data-analysis');
                const isActive = pathname === item.href || isDataAnalysisSection;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'gradient-primary text-[#0a1628] font-bold shadow-lg'
                        : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                    }`}
                  >
                    <item.icon className="w-4 h-4" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
            </nav>
            
            <ThemeToggle />

            {/* User Menu */}
            {isAuthenticated ? (
              <div className="relative hidden md:block">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center gap-2 px-4 py-2 rounded-xl border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10 transition-colors"
                >
                  <User className="w-4 h-4" />
                  <span className="text-sm font-medium">
                    {user?.name || user?.email}
                  </span>
                </button>

                {showUserMenu && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="absolute right-0 mt-2 w-48 glass rounded-xl shadow-lg border border-[#D4AF37]/40 py-2"
                  >
                    <Link
                      href="/history"
                      className="flex items-center gap-2 px-4 py-2 hover:bg-[#D4AF37]/10 transition-colors text-[#D4AF37]"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <History className="w-4 h-4" />
                      <span className="text-sm">История</span>
                    </Link>
                    <button
                      onClick={() => {
                        logout();
                        setShowUserMenu(false);
                      }}
                      className="w-full flex items-center gap-2 px-4 py-2 hover:bg-[#D4AF37]/10 transition-colors text-[#D4AF37]"
                    >
                      <LogOut className="w-4 h-4 text-red-400" />
                      <span className="text-sm text-red-400">Выйти</span>
                    </button>
                  </motion.div>
                )}
              </div>
            ) : (
              <Link
                href="/auth"
                className="hidden md:flex items-center gap-2 px-4 py-2 rounded-xl gradient-primary text-[#0a1628] font-bold hover:opacity-90 transition-opacity"
              >
                <User className="w-4 h-4" />
                <span className="text-sm font-medium">Войти</span>
              </Link>
            )}
          </div>

          <div className="md:hidden">
            <button 
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 rounded-lg hover:bg-[#D4AF37]/10 transition-colors"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" style={{ color: 'var(--foreground)' }} />
              ) : (
                <Menu className="w-6 h-6" style={{ color: 'var(--foreground)' }} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden py-4 border-t"
            style={{ borderColor: 'var(--border)' }}
          >
            <nav className="space-y-2">
              {navigation.map((item) => {
                // Проверяем активность раздела "Анализ данных" для подстраниц
                const isDataAnalysisSection = item.href === '/data-analysis' && 
                  (pathname === '/clustering' || pathname === '/anova' || pathname === '/data-analysis');
                const isActive = pathname === item.href || isDataAnalysisSection;
                
                return (
                  <Link
                    key={item.name}
                    href={item.href}
                    onClick={() => setIsMobileMenuOpen(false)}
                    className={`flex items-center space-x-3 px-4 py-3 rounded-xl text-sm font-medium transition-all duration-300 ${
                      isActive
                        ? 'gradient-primary text-[#0a1628] font-bold shadow-lg'
                        : 'border border-[#D4AF37]/40 text-[#D4AF37] hover:bg-[#D4AF37]/10'
                    }`}
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.name}</span>
                  </Link>
                );
              })}
              
              <div className="flex items-center justify-between px-4 py-3">
                <span className="text-sm font-medium" style={{ color: 'var(--foreground-secondary)' }}>
                  Тема:
                </span>
                <ThemeToggle />
              </div>
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}