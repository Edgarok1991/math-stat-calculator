# Деплой MathCalc

Инструкция по развёртыванию приложения для доступа по ссылке.

## Архитектура

- **Frontend** (Next.js) → Vercel
- **Backend** (NestJS) → Render
- **База данных** (PostgreSQL) → Neon (бесплатный) или Render PostgreSQL

---

## Шаг 1: Репозиторий на GitHub

1. Создайте репозиторий на [github.com](https://github.com/new)
2. Загрузите код:
   ```bash
   cd /Users/edgar/Desktop/Project/math-stat-calculator
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/ВАШ_ЛОГИН/math-stat-calculator.git
   git push -u origin main
   ```

---

## Шаг 2: База данных (Neon)

1. Зарегистрируйтесь на [neon.tech](https://neon.tech)
2. Создайте проект → скопируйте **Connection string**
3. Формат: `postgresql://user:password@host/dbname?sslmode=require`

---

## Шаг 3: Backend на Render

1. Зайдите на [render.com](https://render.com) и войдите через GitHub
2. **New** → **Web Service**
3. Подключите репозиторий `math-stat-calculator`
4. Настройки:
   - **Root Directory:** `calculator/backend`
   - **Runtime:** Docker
   - **Dockerfile Path:** `Dockerfile` (в корне backend)
   - Или без Docker: **Build Command:** `npm install && npx prisma generate && npm run build`
   - **Start Command (без Docker):** `npx prisma db push && node dist/main.js`
5. **Environment Variables:**
   | Переменная | Значение |
   |------------|----------|
   | `DATABASE_URL` | Connection string из Neon |
   | `JWT_SECRET` | Случайная строка (например, `openssl rand -hex 32`) |
   | `FRONTEND_URL` | `https://ваш-проект.vercel.app` (укажите после деплоя frontend) |
   | `APP_URL` | То же, что FRONTEND_URL |
   | `SMTP_HOST` | `smtp.yandex.ru` |
   | `SMTP_PORT` | `587` |
   | `SMTP_USER` | `eaelf@yandex.ru` |
   | `SMTP_PASS` | Пароль приложения Yandex |
   | `NODE_ENV` | `production` |
6. Сохраните и дождитесь деплоя. URL backend: `https://ваш-сервис.onrender.com`

---

## Шаг 4: Миграции Prisma

Перед первым деплоем создайте миграцию локально:

```bash
cd calculator/backend
export DATABASE_URL="postgresql://..."  # из Neon
npx prisma migrate dev --name init
git add prisma/migrations
git commit -m "Add Prisma migrations"
git push
```

На Render добавьте **Release Command:** `npx prisma migrate deploy` (выполнится перед каждым деплоем).

---

## Шаг 5: Frontend на Vercel

1. Зайдите на [vercel.com](https://vercel.com) и войдите через GitHub
2. **Add New** → **Project** → выберите репозиторий
3. Настройки:
   - **Root Directory:** `calculator/frontend`
   - **Framework Preset:** Next.js
   - **Build Command:** `npm run build` (по умолчанию)
4. **Environment Variables:**
   | Переменная | Значение |
   |------------|----------|
   | `NEXT_PUBLIC_API_URL` | `https://ваш-сервис.onrender.com` (URL backend из шага 3) |
5. **Deploy**. URL frontend: `https://ваш-проект.vercel.app`

---

## Шаг 6: Обновить FRONTEND_URL в Render

После деплоя frontend вернитесь в Render → ваш Web Service → **Environment** и обновите:
- `FRONTEND_URL` = `https://ваш-проект.vercel.app`
- `APP_URL` = `https://ваш-проект.vercel.app`

Нажмите **Save Changes** — сервис перезапустится.

---

## Итог

- **Ссылка для пользователей:** `https://ваш-проект.vercel.app`
- Регистрация → письмо на email → подтверждение → вход
- Все вычисления сохраняются в Neon

---

## Альтернатива: Render PostgreSQL

Вместо Neon можно использовать PostgreSQL на Render:

1. Render → **New** → **PostgreSQL**
2. Создайте базу → скопируйте **Internal Database URL**
3. Используйте его как `DATABASE_URL` в backend

---

## Локальная проверка перед деплоем

```bash
# Backend
cd calculator/backend
DATABASE_URL="postgresql://..." FRONTEND_URL="http://localhost:3000" npm run start:prod

# Frontend (в другом терминале)
cd calculator/frontend
NEXT_PUBLIC_API_URL="http://localhost:3001" npm run build && npm start
```
