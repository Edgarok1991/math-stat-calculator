'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, Database, RefreshCw } from 'lucide-react';
import { Button } from '@/components/UI/Button';

export default function AdminPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [calculations, setCalculations] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Простой запрос к БД через SQLite
      const response = await fetch('/api/admin/users');
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setCalculations(data.calculations || []);
      }
    } catch (error) {
      console.error('Ошибка загрузки:', error);
    } finally {
      setIsLoading(false);
    }
  };

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
                <Database className="w-8 h-8" style={{ color: 'var(--gold)' }} />
                Просмотр базы данных
              </h1>
              <p className="mt-2" style={{ color: 'var(--foreground-secondary)' }}>
                Все пользователи и вычисления
              </p>
            </div>

            <Button onClick={loadData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          </div>

          {/* Database File Info */}
          <div className="mb-8 p-4 rounded-lg" style={{ background: 'rgba(212,175,55,0.1)', border: '1px solid var(--border)' }}>
            <h3 className="font-semibold mb-2" style={{ color: 'var(--foreground)' }}>Расположение базы данных:</h3>
            <code className="text-sm px-3 py-1 rounded" style={{ color: 'var(--foreground)', background: 'var(--background-tertiary)' }}>
              backend/prisma/dev.db
            </code>
            <p className="text-sm text-[#9a8b75] mt-3">
              Вы можете открыть этот файл в любом SQLite клиенте:
            </p>
            <ul className="text-sm mt-2 ml-4 list-disc" style={{ color: 'var(--foreground-secondary)' }}>
              <li>DB Browser for SQLite (бесплатно)</li>
              <li>TablePlus (красивый интерфейс)</li>
              <li>VS Code расширение "SQLite Viewer"</li>
            </ul>
          </div>

          {/* SQLite Commands */}
          <div className="mb-8 p-6 border-2 rounded-xl" style={{ background: 'rgba(212,175,55,0.1)', borderColor: 'var(--border)' }}>
            <h3 className="font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--foreground)' }}>
              <Database className="w-5 h-5" />
              Команды для просмотра через терминал:
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground-secondary)' }}>1. Открыть базу данных:</p>
                <code className="block text-sm px-4 py-3 rounded-lg font-mono" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)' }}>
                  cd backend/prisma<br/>
                  sqlite3 dev.db
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground-secondary)' }}>2. Показать всех пользователей:</p>
                <code className="block text-sm px-4 py-3 rounded-lg font-mono" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)' }}>
                  SELECT id, email, name, createdAt FROM users;
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground-secondary)' }}>3. Посчитать пользователей:</p>
                <code className="block text-sm px-4 py-3 rounded-lg font-mono" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)' }}>
                  SELECT COUNT(*) as total FROM users;
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground-secondary)' }}>4. Показать последние вычисления:</p>
                <code className="block text-sm px-4 py-3 rounded-lg font-mono" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)' }}>
                  SELECT type, userId, createdAt FROM calculations<br/>
                  ORDER BY createdAt DESC LIMIT 10;
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold mb-2" style={{ color: 'var(--foreground-secondary)' }}>5. Выход:</p>
                <code className="block text-sm px-4 py-3 rounded-lg font-mono" style={{ background: 'var(--background-tertiary)', color: 'var(--foreground)' }}>
                  .quit
                </code>
              </div>
            </div>
          </div>

          {/* Download Links */}
          <div className="p-6 border-2 border-[#D4AF37]/45 rounded-xl bg-[rgba(212,175,55,0.08)]">
            <h3 className="font-semibold text-[#d4c4a0] mb-4">Рекомендуемые инструменты для просмотра:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://sqlitebrowser.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-[#D4AF37]/45 rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>DB Browser for SQLite</h4>
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Бесплатно, простой интерфейс</p>
                <p className="text-xs mt-2" style={{ color: 'var(--gold)' }}>sqlitebrowser.org →</p>
              </a>

              <a
                href="https://tableplus.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-[#D4AF37]/45 rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>TablePlus</h4>
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Красивый, платный</p>
                <p className="text-xs mt-2" style={{ color: 'var(--gold)' }}>tableplus.com →</p>
              </a>

              <a
                href="https://dbeaver.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 border border-[#D4AF37]/45 rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold mb-1" style={{ color: 'var(--foreground)' }}>DBeaver</h4>
                <p className="text-sm" style={{ color: 'var(--foreground-secondary)' }}>Мощный, бесплатный</p>
                <p className="text-xs mt-2" style={{ color: 'var(--gold)' }}>dbeaver.io →</p>
              </a>
            </div>
          </div>

          {/* Direct File Access */}
          <div className="mt-8 p-4 rounded-lg border border-amber-500/50 bg-amber-900/20">
            <h3 className="font-semibold text-amber-300 mb-2">Прямой доступ к файлу:</h3>
            <p className="text-sm text-amber-200/90 mb-3">
              Файл базы данных можно открыть напрямую любым инструментом:
            </p>
            <div className="p-3 rounded border" style={{ background: 'var(--background-tertiary)', borderColor: 'var(--border)' }}>
              <code className="text-sm font-mono" style={{ color: 'var(--foreground)' }}>
                /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend/prisma/dev.db
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
