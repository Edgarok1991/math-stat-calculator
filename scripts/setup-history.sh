#!/bin/bash
# Автоматическая настройка истории вычислений: PostgreSQL + Prisma + Backend
set -e
ROOT="$(cd "$(dirname "$0")/.." && pwd)"
cd "$ROOT"

echo "🚀 Настройка истории вычислений..."

# 1. Запуск PostgreSQL
echo ""
echo "📦 Запуск PostgreSQL..."
cd calculator
if docker info >/dev/null 2>&1; then
  docker-compose up -d
  # 2. Ожидание готовности Postgres
  echo "⏳ Ожидание PostgreSQL..."
  for i in $(seq 1 30); do
    if docker exec mathcalc-postgres pg_isready -U postgres 2>/dev/null; then
      echo "   PostgreSQL готов"
      break
    fi
    sleep 1
    if [ $i -eq 30 ]; then
      echo "⚠️  PostgreSQL не ответил за 30 сек. Продолжаем — возможно он ещё стартует."
    fi
  done
else
  echo "⚠️  Docker не запущен. Создаём .env — запустите 'cd calculator && docker-compose up -d' вручную."
fi

# 3. Создание .env для бэкенда (мы в calculator/)
BACKEND_ENV="backend/.env"
if [ ! -f "$BACKEND_ENV" ]; then
  echo ""
  echo "📝 Создание backend/.env..."
  cat > "$BACKEND_ENV" << 'ENVFILE'
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/mathcalc?schema=public"
DIRECT_URL="postgresql://postgres:postgres@localhost:5434/mathcalc"
JWT_SECRET="mathcalc-dev-secret-change-in-production"
PORT=3001

# Photo Math: Mathpix OCR для лучшего распознавания формул (опционально)
# Получить ключи: https://mathpix.com → Sign up → API
# MATHPIX_APP_ID=your_app_id
# MATHPIX_APP_KEY=your_app_key
ENVFILE
  echo "   Создан $BACKEND_ENV"
else
  echo "   $BACKEND_ENV уже существует"
fi

# 4. Prisma + миграции
echo ""
echo "🗄️  Prisma generate..."
cd backend
npm install 2>/dev/null || true
npx prisma generate

echo "   Применение схемы к БД (db push)..."
if npx prisma db push 2>/dev/null; then
  echo "   База данных готова"
else
  echo "   ⚠️  db push не удался (PostgreSQL не доступен?). Запустите: cd calculator && docker-compose up -d"
  echo "   Затем: cd calculator/backend && npx prisma db push"
fi

# 5. .env.local для фронтенда (если нет)
cd "$ROOT"
FRONTEND_ENV=".env.local"
if [ ! -f "$FRONTEND_ENV" ]; then
  echo ""
  echo "📝 Создание .env.local для фронтенда..."
  echo 'NEXT_PUBLIC_API_URL="http://localhost:3001"' > "$FRONTEND_ENV"
  echo "   Создан $FRONTEND_ENV"
fi

echo ""
echo "✅ Готово! История вычислений настроена."
echo ""
echo "   Для запуска:"
echo "   1. Backend:  cd calculator/backend && npm run start:dev"
echo "   2. Frontend: npm run dev"
echo ""
echo "   Или используйте: npm run dev:all (запустит оба в фоне)"
echo ""
