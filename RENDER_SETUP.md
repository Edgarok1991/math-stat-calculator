# Подробная настройка Render.com для MathCalc

Пошаговая инструкция для деплоя backend на Render, если вы только зарегистрировались.

---

## 1. Регистрация и вход

### 1.1. Создание аккаунта

1. Откройте **[render.com](https://render.com)**
2. Нажмите **Get Started** или **Sign Up**
3. Выберите **Sign up with GitHub** — это самый удобный вариант, так как Render будет автоматически видеть ваши репозитории

### 1.2. Авторизация GitHub

1. GitHub попросит разрешить доступ Render к вашим репозиториям
2. Можно выбрать:
   - **All repositories** — доступ ко всем репозиториям
   - **Only select repositories** — выберите `math-stat-calculator` (или как называется ваш репозиторий)
3. Нажмите **Install & Authorize**
4. Вас перенаправит обратно на Render

---

## 2. Создание Web Service (backend)

### 2.1. Новый сервис

1. На главной странице Render нажмите **New +**
2. Выберите **Web Service**

### 2.2. Подключение репозитория

1. В списке репозиториев найдите **math-stat-calculator** (или ваш репозиторий)
2. Если репозитория нет — нажмите **Configure account** и добавьте нужный репозиторий в настройках GitHub
3. Нажмите **Connect** рядом с репозиторием

### 2.3. Основные настройки

Заполните форму:

| Поле | Значение |
|------|----------|
| **Name** | `math-stat-backend` (или любое имя, например `x-backend`) |
| **Region** | `Frankfurt (EU Central)` — ближе к России |
| **Branch** | `main` |
| **Root Directory** | `calculator/backend` ⚠️ **Важно!** Backend лежит в подпапке |
| **Runtime** | `Node` |
| **Build Command** | `npm install && npx prisma generate && npm run build` |
| **Start Command** | `npx prisma db push && node dist/main.js` |

### 2.4. План и ресурсы

- **Instance Type:** выберите **Free** (бесплатный план)
- На бесплатном плане сервис «засыпает» после 15 минут неактивности; первый запрос после пробуждения может занять 30–60 секунд

---

## 3. Переменные окружения (Environment Variables)

Нажмите **Advanced** и откройте секцию **Environment Variables**. Добавьте переменные по одной:

### 3.1. Обязательные переменные

| Key | Value | Описание |
|-----|-------|----------|
| `DATABASE_URL` | `postgresql://...` | Строка подключения к PostgreSQL (из Supabase или Neon) |
| `DIRECT_URL` | `postgresql://...` | Прямое подключение (для Supabase — из настроек Connection string) |
| `JWT_SECRET` | случайная строка 32+ символов | Секрет для JWT-токенов. Сгенерировать: `openssl rand -hex 32` |
| `NODE_ENV` | `production` | Режим production |
| `PORT` | `3001` | Порт (Render сам задаёт PORT, но можно указать явно) |

### 3.2. Опциональные (для регистрации и email)

| Key | Value |
|-----|-------|
| `FRONTEND_URL` | `https://math-stat-calculator.vercel.app` |
| `APP_URL` | `https://math-stat-calculator.vercel.app` |
| `SMTP_HOST` | `smtp.yandex.ru` |
| `SMTP_PORT` | `587` |
| `SMTP_USER` | ваш email |
| `SMTP_PASS` | пароль приложения Yandex |

> **Где взять DATABASE_URL и DIRECT_URL?**  
> См. [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) — раздел «Получение строк подключения».

### 3.3. Добавление переменных

1. Нажмите **Add Environment Variable**
2. Введите **Key** (например, `DATABASE_URL`)
3. Введите **Value** (вставьте строку подключения)
4. Повторите для каждой переменной
5. Нажмите **Save Changes** внизу формы

---

## 4. Создание сервиса

1. Прокрутите вниз
2. Нажмите **Create Web Service**
3. Render начнёт первый деплой (обычно 3–5 минут)

---

## 5. Ожидание деплоя

1. На странице сервиса отображается лог сборки
2. Этапы:
   - **Cloning** — клонирование репозитория
   - **Building** — `npm install`, `prisma generate`, `npm run build`
   - **Starting** — запуск `prisma db push` и `node dist/main.js`
3. При успехе статус станет **Live** (зелёный)
4. URL сервиса будет вида: `https://math-stat-backend-xxxx.onrender.com` (или как вы назвали сервис)

---

## 6. Проверка работы

1. Откройте URL сервиса в браузере (например, `https://math-stat-backend-xxxx.onrender.com`)
2. Должна открыться страница (может быть пустая или с JSON) — главное, чтобы не было ошибки 502/503
3. Проверьте endpoint: `https://ваш-url.onrender.com/calculus/integral` — при GET может вернуться 404 или метод не разрешён, это нормально (POST нужен для вычислений)

---

## 7. Настройка Vercel (frontend)

1. Зайдите в [vercel.com](https://vercel.com) → ваш проект
2. **Settings** → **Environment Variables**
3. Добавьте или обновите:
   - **Name:** `NEXT_PUBLIC_API_URL`
   - **Value:** `https://ваш-backend.onrender.com` (URL из Render без слэша в конце)
4. **Save**
5. **Deployments** → три точки у последнего деплоя → **Redeploy**

---

## 8. Автодеплой при push

По умолчанию Render настроен на автодеплой:

- При каждом `git push` в ветку `main` Render автоматически пересобирает и перезапускает сервис
- В **Settings** → **Build & Deploy** можно отключить **Auto-Deploy**, если не нужен

---

## 9. Частые проблемы

### Ошибка CORS

- Убедитесь, что backend задеплоен с последним кодом (с `origin: true` в CORS)
- Нажмите **Manual Deploy** → **Deploy latest commit**

### Ошибка Prisma P1003 (Database server not found)

- **Причина:** база данных недоступна — неверный URL или Supabase приостановлен.
- **Что проверить:**
  1. **Supabase:** зайдите в [supabase.com](https://supabase.com) → Dashboard. Если проект «Paused» — нажмите **Restore**.
  2. **DATABASE_URL:** используйте **Session mode** (порт 5432):  
     `postgresql://postgres.[REF]:[PASSWORD]@aws-0-eu-central-1.pooler.supabase.com:5432/postgres`
  3. **DIRECT_URL:** используйте **Direct connection** (порт 5432) из Supabase → Project Settings → Database.
  4. **Пароль:** спецсимволы `@`, `#`, `:` — закодируйте в URL (`%40`, `%23`, `%3A`).

### Start Command — важно

В Render в **Settings** → **Build & Deploy** → **Start Command** должно быть:

```
npx prisma db push && node dist/main.js
```

Если поле пустое, Render использует `npm start` — в `package.json` он уже настроен на production.

### Ошибка «Exited with status 127» при сборке

- **Причина:** команда `nest` (NestJS CLI) не найдена — она была только в devDependencies
- **Решение:** `@nestjs/cli` перенесён в dependencies. Сделайте `git pull` и **Manual Deploy** на Render

### Ошибка «Application failed to start»

- Проверьте логи в Render (вкладка **Logs**)
- Часто причина — неверный `DATABASE_URL` или `DIRECT_URL`
- Убедитесь, что в конце URL нет лишних пробелов

### Сервис «засыпает» (Free plan)

- На бесплатном плане сервис неактивен 15 минут и выключается
- Первый запрос после пробуждения может занимать 30–60 секунд
- Это нормальное поведение Free-плана

### Prisma migrate / db push

- В Start Command используется `prisma db push` — создаёт таблицы по схеме
- Если нужны миграции, добавьте **Release Command:** `npx prisma migrate deploy`

---

## 10. Итоговая схема

```
GitHub (math-stat-calculator)
    │
    ├── Push → Render (backend: calculator/backend)
    │              └── DATABASE_URL → Supabase/Neon
    │
    └── Push → Vercel (frontend: корень или calculator/frontend)
                   └── NEXT_PUBLIC_API_URL → https://xxx.onrender.com
```

---

## Краткий чеклист

- [ ] Зарегистрироваться на Render через GitHub
- [ ] New → Web Service → подключить репозиторий
- [ ] Root Directory: `calculator/backend`
- [ ] Build: `npm install && npx prisma generate && npm run build`
- [ ] Start: `npx prisma db push && node dist/main.js`
- [ ] Добавить DATABASE_URL, DIRECT_URL, JWT_SECRET, NODE_ENV
- [ ] Create Web Service
- [ ] Дождаться Live
- [ ] Скопировать URL backend
- [ ] Добавить NEXT_PUBLIC_API_URL в Vercel
- [ ] Redeploy на Vercel
