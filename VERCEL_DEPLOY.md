# Деплой на Vercel

Пошаговая инструкция по развёртыванию frontend на Vercel.

---

## Способ 1: Через веб-интерфейс (рекомендуется)

### Шаг 1. Регистрация

1. Перейдите на **[vercel.com](https://vercel.com)**
2. Нажмите **Sign Up** и войдите через **GitHub**
3. Разрешите Vercel доступ к вашим репозиториям

### Шаг 2. Импорт проекта

1. Нажмите **Add New** → **Project**
2. Выберите репозиторий **math-stat-calculator** (или `Edgarok1991/math-stat-calculator`)
3. Если репозитория нет в списке — нажмите **Import Git Repository** и подключите GitHub

### Шаг 3. Настройка сборки

Vercel автоматически определит Next.js. Проверьте:

| Поле | Значение |
|------|----------|
| **Framework Preset** | Next.js |
| **Root Directory** | `./` (корень) |
| **Build Command** | `npm run build` |
| **Output Directory** | `.next` (по умолчанию) |

### Шаг 4. Переменные окружения (опционально)

Если backend уже задеплоен, добавьте:

- **Name**: `NEXT_PUBLIC_API_URL`
- **Value**: `http://ваш-backend-ip:3001` или `https://ваш-backend-домен`
- **Environment**: Production, Preview

Пока backend не задеплоен — можно оставить пустым (будет использоваться `http://localhost:3001` для локальной разработки).

### Шаг 5. Деплой

1. Нажмите **Deploy**
2. Дождитесь сборки (1–3 минуты)
3. Получите URL вида `math-stat-calculator.vercel.app`

---

## Способ 2: Через Vercel CLI

### Установка CLI

```bash
npm i -g vercel
```

### Деплой

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator
vercel
```

При первом запуске:
- Войдите в аккаунт (откроется браузер)
- Ответьте на вопросы: Link to existing project? **N** (создать новый)
- Which scope? выберите ваш аккаунт
- Link to existing project? **N**
- Project name? `math-stat-calculator` (или Enter)
- Directory? `./` (Enter)

### Продакшен-деплой

```bash
vercel --prod
```

---

## После деплоя

1. **URL**: проект будет доступен по `https://ваш-проект.vercel.app`
2. **Обновления**: при каждом `git push` в main — автоматический redeploy
3. **Backend**: когда задеплоите backend — добавьте `NEXT_PUBLIC_API_URL` в Vercel и сделайте Redeploy

---

## Важно

- **calculator/** — папка с backend не участвует в сборке Next.js (исключена в tsconfig)
- Frontend — только `src/`, `public/`, корневые конфиги
- Backend деплоится отдельно (AlaVPS, Cloud.ru, Яндекс Облако)
