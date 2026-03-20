#!/bin/bash
# Автоматический push в Git → триггерит деплой на Render и Vercel
# Использование: ./deploy-git.sh "сообщение коммита"

set -e
cd "$(dirname "$0")"

# npm run deploy -- "fix: описание"  или  ./deploy-git.sh "fix: описание"
MSG="${1:-deploy: обновление}"
echo "🚀 Push в Git → автодеплой Render + Vercel"
echo "   Коммит: $MSG"
echo ""

git add .
if git diff --staged --quiet; then
  echo "⚠️  Нет изменений для коммита"
  exit 0
fi

git commit -m "$MSG"
git push origin main

echo ""
echo "✅ Готово! Render и Vercel задеплоят автоматически."
