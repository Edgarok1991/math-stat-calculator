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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white rounded-xl shadow-lg p-8"
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 flex items-center gap-3">
                <Database className="w-8 h-8 text-indigo-600" />
                Просмотр базы данных
              </h1>
              <p className="text-gray-600 mt-2">
                Все пользователи и вычисления
              </p>
            </div>

            <Button onClick={loadData} variant="outline">
              <RefreshCw className="w-4 h-4 mr-2" />
              Обновить
            </Button>
          </div>

          {/* Database File Info */}
          <div className="mb-8 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <h3 className="font-semibold text-blue-900 mb-2">📁 Расположение базы данных:</h3>
            <code className="text-sm text-blue-800 bg-white px-3 py-1 rounded">
              backend/prisma/dev.db
            </code>
            <p className="text-sm text-blue-700 mt-3">
              💡 Вы можете открыть этот файл в любом SQLite клиенте:
            </p>
            <ul className="text-sm text-blue-700 mt-2 ml-4 list-disc">
              <li>DB Browser for SQLite (бесплатно)</li>
              <li>TablePlus (красивый интерфейс)</li>
              <li>VS Code расширение "SQLite Viewer"</li>
            </ul>
          </div>

          {/* SQLite Commands */}
          <div className="mb-8 p-6 bg-gradient-to-r from-purple-50 to-indigo-50 border-2 border-purple-200 rounded-xl">
            <h3 className="font-semibold text-purple-900 mb-4 flex items-center gap-2">
              <Database className="w-5 h-5" />
              Команды для просмотра через терминал:
            </h3>
            
            <div className="space-y-4">
              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">1. Открыть базу данных:</p>
                <code className="block text-sm bg-purple-900 text-purple-100 px-4 py-3 rounded-lg font-mono">
                  cd backend/prisma<br/>
                  sqlite3 dev.db
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">2. Показать всех пользователей:</p>
                <code className="block text-sm bg-purple-900 text-purple-100 px-4 py-3 rounded-lg font-mono">
                  SELECT id, email, name, createdAt FROM users;
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">3. Посчитать пользователей:</p>
                <code className="block text-sm bg-purple-900 text-purple-100 px-4 py-3 rounded-lg font-mono">
                  SELECT COUNT(*) as total FROM users;
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">4. Показать последние вычисления:</p>
                <code className="block text-sm bg-purple-900 text-purple-100 px-4 py-3 rounded-lg font-mono">
                  SELECT type, userId, createdAt FROM calculations<br/>
                  ORDER BY createdAt DESC LIMIT 10;
                </code>
              </div>

              <div>
                <p className="text-sm font-semibold text-purple-800 mb-2">5. Выход:</p>
                <code className="block text-sm bg-purple-900 text-purple-100 px-4 py-3 rounded-lg font-mono">
                  .quit
                </code>
              </div>
            </div>
          </div>

          {/* Download Links */}
          <div className="p-6 bg-green-50 border-2 border-green-200 rounded-xl">
            <h3 className="font-semibold text-green-900 mb-4">💡 Рекомендуемые инструменты для просмотра:</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <a
                href="https://sqlitebrowser.org/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white border border-green-300 rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-1">DB Browser for SQLite</h4>
                <p className="text-sm text-gray-600">Бесплатно, простой интерфейс</p>
                <p className="text-xs text-indigo-600 mt-2">sqlitebrowser.org →</p>
              </a>

              <a
                href="https://tableplus.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white border border-green-300 rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-1">TablePlus</h4>
                <p className="text-sm text-gray-600">Красивый, платный</p>
                <p className="text-xs text-indigo-600 mt-2">tableplus.com →</p>
              </a>

              <a
                href="https://dbeaver.io/"
                target="_blank"
                rel="noopener noreferrer"
                className="block p-4 bg-white border border-green-300 rounded-lg hover:shadow-md transition-shadow"
              >
                <h4 className="font-semibold text-gray-900 mb-1">DBeaver</h4>
                <p className="text-sm text-gray-600">Мощный, бесплатный</p>
                <p className="text-xs text-indigo-600 mt-2">dbeaver.io →</p>
              </a>
            </div>
          </div>

          {/* Direct File Access */}
          <div className="mt-8 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-900 mb-2">🔍 Прямой доступ к файлу:</h3>
            <p className="text-sm text-yellow-800 mb-3">
              Файл базы данных можно открыть напрямую любым инструментом:
            </p>
            <div className="bg-white p-3 rounded border border-yellow-300">
              <code className="text-sm font-mono text-gray-800">
                /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend/prisma/dev.db
              </code>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
