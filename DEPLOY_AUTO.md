# Автоматический деплой MathCalc

Репозиторий инициализирован. Выполните следующие команды в терминале (вне Cursor).

## 1. GitHub (один раз)

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator

# Создайте репозиторий на github.com/new, затем:
git remote add origin https://github.com/ВАШ_ЛОГИН/math-stat-calculator.git
git push -u origin main
```

## 2. Vercel (frontend)

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/frontend

# Вход (откроется браузер)
npx vercel login

# Деплой
npx vercel --prod
```

При первом деплое укажите:
- **Set up and deploy?** Yes
- **Which scope?** Ваш аккаунт
- **Link to existing project?** No
- **Project name?** math-stat-calculator (или свой)
- **Directory?** `./` (текущая папка frontend)

После деплоя скопируйте URL (например `https://math-stat-calculator-xxx.vercel.app`).

## 3. Neon (база данных)

1. Откройте [neon.tech](https://neon.tech) → Sign up
2. New Project → скопируйте **Connection string**
3. Сохраните для шага 4

## 4. Render (backend)

1. Откройте [render.com](https://render.com) → Sign up (через GitHub)
2. **New** → **Web Service**
3. Подключите репозиторий `math-stat-calculator`
4. Настройки:
   - **Root Directory:** `calculator/backend`
   - **Runtime:** Docker
   - **Instance Type:** Free

5. **Environment Variables** (добавьте все):

| Key | Value |
|-----|-------|
| DATABASE_URL | Connection string из Neon |
| JWT_SECRET | `openssl rand -hex 32` |
| FRONTEND_URL | URL из Vercel (шаг 2) |
| APP_URL | То же |
| SMTP_HOST | smtp.yandex.ru |
| SMTP_PORT | 587 |
| SMTP_USER | eaelf@yandex.ru |
| SMTP_PASS | Пароль приложения Yandex |
| NODE_ENV | production |

6. **Create Web Service**

## 5. Обновить frontend

В Vercel → Project Settings → Environment Variables:
- `NEXT_PUBLIC_API_URL` = URL backend с Render (например `https://math-stat-calculator-backend.onrender.com`)

Redeploy frontend.

## 6. Готово

Ссылка для пользователей: ваш URL на Vercel.
