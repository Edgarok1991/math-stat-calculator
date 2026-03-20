'use client';

import Link from 'next/link';
import { Calculator, Github, Twitter, Mail, Heart, ArrowUp } from 'lucide-react';

export default function Footer() {
  return (
    <footer 
      className="relative overflow-hidden glass"
      style={{ 
        borderTop: '1px solid var(--border)'
      }}
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 opacity-5">
        <div className="absolute inset-0" style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23D4AF37' fill-opacity='0.2'%3E%3Ccircle cx='30' cy='30' r='2'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
          backgroundRepeat: 'repeat'
        }}></div>
      </div>
      
      <div className="relative container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center space-x-3 mb-6">
              <div className="w-10 h-10 gradient-primary rounded-xl flex items-center justify-center shadow-lg">
                <Calculator className="w-6 h-6 text-[#1c1917]" />
              </div>
              <span className="text-2xl font-bold" style={{ color: 'var(--foreground)' }}>
                MathCalc
              </span>
            </div>
            <p className="text-lg mb-6 max-w-md" style={{ color: 'var(--foreground-secondary)' }}>
              Современный математический и статистический калькулятор для решения 
              сложных задач с интуитивным интерфейсом и подробными объяснениями.
            </p>
            <div className="flex space-x-4">
              <a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ 
                  background: 'var(--background-tertiary)',
                  color: 'var(--foreground-secondary)'
                }}
              >
                <Github className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ 
                  background: 'var(--background-tertiary)',
                  color: 'var(--foreground-secondary)'
                }}
              >
                <Twitter className="h-5 w-5" />
              </a>
              <a 
                href="#" 
                className="w-10 h-10 rounded-full flex items-center justify-center transition-all duration-300 hover:scale-110"
                style={{ 
                  background: 'var(--background-tertiary)',
                  color: 'var(--foreground-secondary)'
                }}
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Калькуляторы
            </h3>
            <ul className="space-y-3">
              <li>
                <Link 
                  href="/regression" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Регрессия
                </Link>
              </li>
              <li>
                <Link 
                  href="/clustering" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Кластеризация
                </Link>
              </li>
              <li>
                <Link 
                  href="/anova" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  ANOVA
                </Link>
              </li>
              <li>
                <Link 
                  href="/matrices" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Матрицы
                </Link>
              </li>
              <li>
                <Link 
                  href="/calculus" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Математика
                </Link>
              </li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-xl font-bold mb-6" style={{ color: 'var(--foreground)' }}>
              Поддержка
            </h3>
            <ul className="space-y-3">
              <li>
                <a 
                  href="#" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Документация
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  FAQ
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Контакты
                </a>
              </li>
              <li>
                <a 
                  href="#" 
                  className="text-lg transition-colors duration-300 hover:text-[#E8C547]"
                  style={{ color: 'var(--foreground-secondary)' }}
                >
                  Обратная связь
                </a>
              </li>
            </ul>
          </div>
        </div>
        
        <div 
          className="flex flex-col md:flex-row justify-between items-center mt-12 pt-8"
          style={{ borderTop: '1px solid var(--border)' }}
        >
          <p className="text-lg mb-4 md:mb-0" style={{ color: 'var(--foreground-secondary)' }}>
            &copy; 2025 MathCalc. Сделано с <Heart className="inline w-4 h-4 text-[#D4AF37]" /> для факультета журналистики.
          </p>
          
          <button 
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
            className="flex items-center gap-2 px-4 py-2 rounded-full transition-all duration-300 hover:scale-105"
            style={{ 
              background: 'var(--background-tertiary)',
              color: 'var(--foreground-secondary)'
            }}
          >
            <ArrowUp className="w-4 h-4" />
            Наверх
          </button>
        </div>
      </div>
    </footer>
  );
}