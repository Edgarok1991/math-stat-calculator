# Деплой MathCalc: Supabase + Яндекс Облако

Подробная инструкция по развёртыванию проекта MathCalc с использованием:
- **Supabase** — PostgreSQL база данных
- **Яндекс Облако** — backend (NestJS API)
- **Vercel** — frontend (уже задеплоен)

---

## Содержание

1. [Supabase — база данных](#1-supabase--база-данных)
2. [Яндекс Облако — backend](#2-яндекс-облако--backend)
3. [Vercel — frontend](#3-vercel--frontend)
4. [Проверка и отладка](#4-проверка-и-отладка)

---

## 1. Supabase — база данных

### 1.1 Регистрация и создание проекта

1. Перейдите на [supabase. com](https://supabase.com) и войдите (GitHub/Google).
2. Нажмите **New Project**.
3. Заполните:
   - **Name**: `mathcalc` (или любое)
   - **Database Password**: сгенерируйте надёжный пароль (сохраните его).
   - **Region**: выберите ближайший регион (например, `eu-central-1`).
4. Нажмите **Create new project** и дождитесь создания (1–2 минуты).

### 1.2 Создание пользователя Prisma (рекомендуется)

Для лучшего контроля и мониторинга создайте отдельного пользователя БД:

1. В Supabase Dashboard откройте **SQL Editor**.
2. Выполните (замените `YOUR_STRONG_PASSWORD` на свой пароль):

```sql
create user "prisma" with password 'YOUR_STRONG_PASSWORD' bypassrls createdb;

grant "prisma" to "postgres";

grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

### 1.3 Получение connection string

1. В Supabase Dashboard откройте **Project Settings** → **Database**.
2. В блоке **Connection string** выберите **URI**.
3. Скопируйте строку подключения. Она выглядит так:
   ```
   postgresql://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
   ```
4. Если используете пользователя `prisma`, замените `postgres` на `prisma` в начале строки.

### 1.4 Два варианта подключения

**Вариант A — Session Pooler (порт 5432)** — проще, подходит для обычного сервера (Яндекс ВМ):

```env
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

**Вариант B — Transaction Pooler (порт 6543)** — для serverless/автоскейлинга. Добавьте `?pgbouncer=true`:

```env
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:6543/postgres?pgbouncer=true"
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Для Яндекс Compute Cloud достаточно **Варианта A**.

### 1.5 Обновление Prisma schema

В `calculator/backend/prisma/schema.prisma` уже добавлен `directUrl`:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

**Для локальной разработки** (PostgreSQL без pooler) можно задать одинаковые значения:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5434/mathcalc"
DIRECT_URL="postgresql://postgres:postgres@localhost:5434/mathcalc"
```

### 1.6 Применение схемы к Supabase

Локально (с настроенным `.env`):

```bash
cd calculator/backend
npx prisma db push
```

Или создайте миграцию:

```bash
npx prisma migrate dev --name init_supabase
```

---

## 2. Backend — выбор платформы

Доступны варианты:

- **[ALAVPS_SETUP.md](./ALAVPS_SETUP.md)** — AlaVPS (бесплатно, **без карты**, 2 vCPU, 8 ГБ RAM)
- **[CLOUD_RU_SETUP.md](./CLOUD_RU_SETUP.md)** — Cloud.ru (бесплатная ВМ, карта нужна, публичный IP платный)
- **[YANDEX_CLOUD_SETUP.md](./YANDEX_CLOUD_SETUP.md)** — Яндекс Облако (платная ВМ, ~300–500 ₽/мес)

### 2.1 Регистрация и грант

1. Перейдите на [cloud.yandex.ru](https://cloud.yandex.ru).
2. Войдите через Яндекс ID.
3. При первом входе получите **стартовый грант** (если доступен).
4. Создайте **каталог** (folder) для проекта.

### 2.2 Создание виртуальной машины

1. Откройте **Compute Cloud** → **Виртуальные машины**.
2. Нажмите **Создать ВМ**.
3. Настройки:
   - **Имя**: `mathcalc-backend`
   - **Зона доступности**: `ru-central1-a` (или ближайшая)
   - **Платформа**: Intel Ice Lake
   - **Вычислительные ресурсы**:
     - 2 vCPU, 2 ГБ RAM (минимум для NestJS)
     - Или 1 vCPU, 1 ГБ — для теста
   - **Загрузочный диск**: Ubuntu 22.04 LTS, 10 ГБ
   - **Сетевой доступ**: выберите подсеть, **Публичный IP** — Автоматически
4. В разделе **Доступ**:
   - Логин: `ubuntu` (по умолчанию для Ubuntu)
   - Добавьте свой **SSH-ключ** (публичную часть).
5. Нажмите **Создать ВМ**.

### 2.3 Подключение по SSH

```bash
ssh ubuntu@<ПУБЛИЧНЫЙ_IP_ВМ>
```

### 2.4 Установка Node.js (через nvm)

```bash
# Установка nvm
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
source ~/.bashrc  # или source ~/.zshrc

# Установка Node.js 20
nvm install 20
nvm use 20
node -v   # v20.x.x
npm -v
```

### 2.5 Установка Git и клонирование проекта

```bash
sudo apt update
sudo apt install -y git

# Генерация SSH-ключа для GitHub (если ещё нет)
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519 -N ""

# Добавьте содержимое ~/.ssh/id_ed25519.pub в GitHub → Settings → SSH keys
cat ~/.ssh/id_ed25519.pub

# Клонирование
git clone git@github.com:Edgarok1991/math-stat-calculator.git
cd math-stat-calculator
```

### 2.6 Установка зависимостей и сборка backend

```bash
cd calculator/backend

# Установка зависимостей
npm ci

# Создание .env (см. ниже)
nano .env

# Генерация Prisma Client и применение схемы
npx prisma generate
npx prisma db push

# Сборка
npm run build
```

### 2.7 Файл .env на сервере

Создайте `calculator/backend/.env`:

```env
# Supabase
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT
JWT_SECRET="сгенерируйте-длинный-случайный-ключ-минимум-32-символа"
JWT_EXPIRATION="7d"

# App
PORT=3001
NODE_ENV=production

# Frontend (Vercel URL)
FRONTEND_URL="https://ваш-проект.vercel.app"
APP_URL="https://ваш-проект.vercel.app"

# SMTP Yandex
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=ваш_email@yandex.ru
SMTP_PASS=пароль_приложения_яндекс
```

### 2.8 Запуск через PM2

```bash
# Установка PM2
sudo npm install -g pm2

# Запуск
cd ~/math-stat-calculator/calculator/backend
pm2 start dist/main.js --name mathcalc-api

# Автозапуск при перезагрузке
pm2 startup
pm2 save

# Проверка
pm2 status
pm2 logs mathcalc-api
```

### 2.9 Настройка Nginx (reverse proxy)

Чтобы API был доступен на порту 80 и по домену (опционально):

```bash
sudo apt install -y nginx
sudo nano /etc/nginx/sites-available/mathcalc
```

Содержимое:

```nginx
server {
    listen 80;
    server_name ваш-домен.ru;  # или IP для теста

    location / {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/mathcalc /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

### 2.10 Открытие порта в firewall

В консоли Яндекс Облака:

1. **VPC** → **Группы безопасности** → выберите группу ВМ.
2. Добавьте правило **Входящий трафик**:
   - Порт: 80 (HTTP) и/или 3001 (если без Nginx)
   - Источник: 0.0.0.0/0

Или через `ufw` на ВМ:

```bash
sudo ufw allow 80
sudo ufw allow 22
sudo ufw enable
```

### 2.11 URL backend

После настройки backend будет доступен по адресу:
- `http://<ПУБЛИЧНЫЙ_IP_ВМ>:3001` — если без Nginx
- `http://<ПУБЛИЧНЫЙ_IP_ВМ>` или `http://ваш-домен.ru` — если с Nginx

---

## 3. Vercel — frontend

### 3.1 Добавление переменной окружения

1. Откройте [vercel.com](https://vercel.com) → ваш проект.
2. **Settings** → **Environment Variables**.
3. Добавьте:
   - **Name**: `NEXT_PUBLIC_API_URL`
   - **Value**: `http://<ПУБЛИЧНЫЙ_IP_ВМ>:3001` или `https://ваш-домен.ru`
   - **Environment**: Production (и Preview при необходимости)
4. Сохраните.

### 3.2 Redeploy

**Deployments** → три точки у последнего деплоя → **Redeploy**.

---

## 4. Проверка и отладка

### 4.1 CORS

Backend уже настроен на `FRONTEND_URL`. Убедитесь, что в `main.ts`:

```ts
app.enableCors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
});
```

### 4.2 Проверка API

```bash
curl http://<IP>:3001
# или
curl http://<IP>:3001/test
```

### 4.3 Логи

```bash
pm2 logs mathcalc-api
pm2 monit
```

### 4.4 Обновление backend после изменений

```bash
cd ~/math-stat-calculator
git pull
cd calculator/backend
npm ci
npx prisma generate
npx prisma db push  # при изменении схемы
npm run build
pm2 restart mathcalc-api
```

---

## Сводка переменных

| Переменная | Где | Описание |
|-----------|-----|----------|
| `DATABASE_URL` | Backend (.env) | Supabase Session Pooler (порт 5432) |
| `DIRECT_URL` | Backend (.env) | То же для Prisma migrations |
| `JWT_SECRET` | Backend (.env) | Секрет для JWT |
| `FRONTEND_URL` | Backend (.env) | URL Vercel (для CORS и email) |
| `APP_URL` | Backend (.env) | URL frontend для ссылок в письмах |
| `SMTP_*` | Backend (.env) | Yandex SMTP |
| `NEXT_PUBLIC_API_URL` | Vercel | URL backend (Яндекс ВМ) |

---

## Стоимость (ориентировочно)

- **Supabase**: бесплатный тариф — 500 MB БД, 2 проекта.
- **Яндекс Облако**: ~300–500 ₽/мес за ВМ 2 vCPU, 2 ГБ (зависит от региона и тарифа).
- **Vercel**: бесплатный тариф для hobby-проектов.

---

## Полезные ссылки

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Supabase + Prisma](https://supabase.com/docs/guides/database/prisma)
- [Яндекс Cloud Console](https://console.cloud.yandex.ru)
- [Документация Compute Cloud](https://cloud.yandex.ru/docs/compute/)
