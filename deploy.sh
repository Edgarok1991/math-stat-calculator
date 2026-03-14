#!/bin/bash
# Скрипт деплоя MathCalc
# Запустите в терминале: ./deploy.sh

set -e
cd "$(dirname "$0")"

echo "🚀 MathCalc — автоматический деплой"
echo ""

# 1. Vercel
echo "📦 Шаг 1: Деплой frontend на Vercel..."
cd calculator/frontend
if ! npx vercel --prod --yes 2>/dev/null; then
  echo ""
  echo "⚠️  Требуется вход в Vercel. Выполните:"
  echo "   npx vercel login"
  echo "   npx vercel --prod"
  echo ""
  read -p "Нажмите Enter после деплоя на Vercel..."
fi
cd ../..

# 2. Напоминание
echo ""
echo "✅ Frontend задеплоен!"
echo ""
echo "Дальше:"
echo "1. Создайте БД на neon.tech"
echo "2. Создайте Web Service на render.com (backend)"
echo "3. Добавьте NEXT_PUBLIC_API_URL в Vercel"
echo ""
echo "Подробно: DEPLOY_AUTO.md"
