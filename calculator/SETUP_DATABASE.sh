#!/bin/bash

echo "🚀 Настройка базы данных для MathCalc"
echo ""

# Переход в корневую директорию
cd "$(dirname "$0")"

# Шаг 1: Запуск PostgreSQL
echo "📦 Шаг 1: Запуск PostgreSQL через Docker..."
docker-compose up -d

if [ $? -ne 0 ]; then
    echo "❌ Ошибка запуска Docker. Убедитесь, что Docker установлен и запущен."
    exit 1
fi

echo "✅ PostgreSQL запущен!"
echo ""

# Ожидание готовности БД
echo "⏳ Ожидание готовности базы данных..."
sleep 5

# Шаг 2: Генерация Prisma клиента
echo "📦 Шаг 2: Генерация Prisma клиента..."
cd backend
npx prisma generate

if [ $? -ne 0 ]; then
    echo "❌ Ошибка генерации Prisma клиента"
    exit 1
fi

echo "✅ Prisma клиент сгенерирован!"
echo ""

# Шаг 3: Создание таблиц
echo "📦 Шаг 3: Создание таблиц в базе данных..."
npx prisma db push

if [ $? -ne 0 ]; then
    echo "❌ Ошибка создания таблиц"
    exit 1
fi

echo "✅ Таблицы созданы!"
echo ""

# Шаг 4: Сборка backend
echo "📦 Шаг 4: Сборка backend..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Ошибка сборки backend"
    exit 1
fi

echo "✅ Backend собран!"
echo ""

echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "🎉 Настройка завершена!"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "📋 Следующие шаги:"
echo ""
echo "1. Запустите Backend:"
echo "   cd backend"
echo "   npm run start:dev"
echo ""
echo "2. Запустите Frontend:"
echo "   cd frontend"
echo "   npm run dev"
echo ""
echo "3. Откройте приложение:"
echo "   http://localhost:3000/auth"
echo ""
echo "🎯 Готово к использованию!"
