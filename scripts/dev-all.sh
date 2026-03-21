#!/bin/bash
# Запуск фронтенда и бэкенда одновременно
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

# Запуск бэкенда в фоне
echo "🚀 Запуск бэкенда на http://localhost:3001..."
(cd calculator/backend && npm run start:dev) &
BACKEND_PID=$!

# Небольшая задержка перед фронтом
sleep 3

# Запуск фронтенда
echo "🚀 Запуск фронтенда на http://localhost:3000..."
npm run dev

# При Ctrl+C убить бэкенд
trap "kill $BACKEND_PID 2>/dev/null || true" EXIT
