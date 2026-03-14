#!/bin/bash

echo "🚀 Запуск математического и статистического калькулятора..."

# Проверяем, установлены ли зависимости
if [ ! -d "frontend/node_modules" ]; then
    echo "📦 Устанавливаем зависимости frontend..."
    cd frontend && npm install && cd ..
fi

if [ ! -d "backend/node_modules" ]; then
    echo "📦 Устанавливаем зависимости backend..."
    cd backend && npm install && cd ..
fi

echo "🔧 Запускаем backend сервер..."
cd backend && npm run start:dev &
BACKEND_PID=$!

echo "⏳ Ждем запуска backend сервера..."
sleep 5

echo "🎨 Запускаем frontend приложение..."
cd ../frontend && npm run dev &
FRONTEND_PID=$!

echo "✅ Приложение запущено!"
echo "🌐 Frontend: http://localhost:3000"
echo "🔧 Backend API: http://localhost:3001"
echo ""
echo "Для остановки нажмите Ctrl+C"

# Обработка сигнала завершения
trap "echo '🛑 Останавливаем серверы...'; kill $BACKEND_PID $FRONTEND_PID; exit" INT

# Ждем завершения
wait

