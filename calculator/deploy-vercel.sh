#!/bin/bash
# Деплой frontend на Vercel
set -e
cd "$(dirname "$0")"

echo "📦 Деплой MathCalc на Vercel..."
echo ""

# Проверка Vercel CLI
if ! command -v vercel &>/dev/null; then
  echo "Установка Vercel CLI..."
  npm i -g vercel
fi

# Деплой из папки calculator с root = frontend
cd frontend
vercel --prod --yes
echo ""
echo "✅ Деплой завершён! Ссылка выше."
