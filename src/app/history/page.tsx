'use client';

import { useState, useEffect } from 'react';
import { API_URL } from '@/config';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';
import { History, Trash2, Calculator, Brain, BarChart2, Grid3X3 } from 'lucide-react';
import { Button } from '@/components/UI/Button';

const typeIcons: { [key: string]: any } = {
  clustering: Brain,
  anova: BarChart2,
  matrix: Grid3X3,
  derivative: Calculator,
  integral: Calculator,
  statistics: BarChart2,
};

const typeNames: { [key: string]: string } = {
  clustering: 'Кластеризация',
  anova: 'ANOVA',
  matrix: 'Матрицы',
  derivative: 'Производная',
  integral: 'Интеграл',
  statistics: 'Статистика',
};

export default function HistoryPage() {
  const { user, token, isAuthenticated } = useAuth();
  const router = useRouter();
  const [calculations, setCalculations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/auth');
      return;
    }

    loadHistory();
  }, [isAuthenticated, filter]);

  const loadHistory = async () => {
    if (!token) return;

    setIsLoading(true);
    try {
      const url = filter === 'all' 
        ? `${API_URL}/history`
        : `${API_URL}/history?type=${filter}`;

      const response = await fetch(url, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setCalculations(data);
      }
    } catch (error) {
      console.error('Ошибка загрузки истории:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const deleteCalculation = async (id: string) => {
    if (!token) return;

    try {
      const response = await fetch(`${API_URL}/history/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCalculations(calculations.filter(calc => calc.id !== id));
      }
    } catch (error) {
      console.error('Ошибка удаления:', error);
    }
  };

  const clearHistory = async () => {
    if (!token || !confirm('Удалить всю историю?')) return;

    try {
      const response = await fetch(`${API_URL}/history`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (response.ok) {
        setCalculations([]);
      }
    } catch (error) {
      console.error('Ошибка очистки:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="min-h-screen py-8" style={{ background: 'var(--background)' }}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="rounded-xl shadow-lg p-8 card-midnight"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold flex items-center gap-3" style={{ color: 'var(--foreground)' }}>
                <History className="w-8 h-8" style={{ color: 'var(--gold)' }} />
                История вычислений
              </h1>
              <p className="mt-2" style={{ color: 'var(--foreground-secondary)' }}>
                Все ваши расчёты сохранены
              </p>
            </div>

            {calculations.length > 0 && (
              <Button
                onClick={clearHistory}
                variant="outline"
                className="text-red-400 border-red-500/50 hover:bg-red-900/20"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Очистить всё
              </Button>
            )}
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 mb-6">
            {['all', 'clustering', 'anova', 'integral', 'derivative', 'matrix'].map((type) => (
              <button
                key={type}
                onClick={() => setFilter(type)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  filter === type
                    ? 'gradient-primary text-[#0a1628] font-bold shadow-md'
                    : ''
                }`} style={filter !== type ? { background: 'var(--background-tertiary)', color: 'var(--foreground-secondary)' } : {}}
              >
                {type === 'all' ? 'Все' : typeNames[type] || type}
              </button>
            ))}
          </div>

          {/* History List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="animate-spin w-8 h-8 border-4 border-t-transparent rounded-full mx-auto" style={{ borderColor: 'var(--gold)' }}></div>
              <p className="mt-4" style={{ color: 'var(--foreground-secondary)' }}>Загрузка...</p>
            </div>
          ) : calculations.length === 0 ? (
            <div className="text-center py-12">
              <History className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--foreground-muted)' }} />
              <p style={{ color: 'var(--foreground-secondary)' }}>История пуста</p>
              <p className="text-sm mt-2" style={{ color: 'var(--foreground-muted)' }}>
                Выполните первое вычисление, и оно появится здесь
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {calculations.map((calc, index) => {
                const Icon = typeIcons[calc.type] || Calculator;
                
                return (
                  <motion.div
                    key={calc.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 border rounded-lg hover:shadow-md transition-shadow" style={{ borderColor: 'var(--border)' }}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-start gap-3 flex-1">
                        <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(212,175,55,0.2)' }}>
                          <Icon className="w-5 h-5" style={{ color: 'var(--gold)' }} />
                        </div>
                        
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-2">
                            <h3 className="font-semibold" style={{ color: 'var(--foreground)' }}>
                              {typeNames[calc.type] || calc.type}
                            </h3>
                            <span className="text-xs" style={{ color: 'var(--foreground-muted)' }}>
                              {new Date(calc.createdAt).toLocaleString('ru-RU')}
                            </span>
                          </div>
                          
                          <div className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>
                            <pre className="p-2 rounded text-xs overflow-x-auto" style={{ background: 'var(--background-tertiary)' }}>
                              {JSON.stringify(calc.input, null, 2)}
                            </pre>
                          </div>
                        </div>
                      </div>

                      <button
                        onClick={() => deleteCalculation(calc.id)}
                        className="ml-4 p-2 text-red-400 hover:bg-red-900/20 rounded-lg transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
