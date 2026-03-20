# Подробная настройка Supabase для MathCalc

Пошаговая инструкция по настройке PostgreSQL-базы данных в Supabase для проекта MathCalc.

---

## Содержание

1. [Регистрация в Supabase](#1-регистрация-в-supabase)
2. [Создание проекта](#2-создание-проекта)
3. [Создание пользователя Prisma (рекомендуется)](#3-создание-пользователя-prisma-рекомендуется)
4. [Получение строк подключения](#4-получение-строк-подключения)
5. [Настройка Prisma и .env](#5-настройка-prisma-и-env)
6. [Применение схемы к базе](#6-применение-схемы-к-базе)
7. [Проверка подключения](#7-проверка-подключения)
8. [Частые ошибки и решения](#8-частые-ошибки-и-решения)

---

## 1. Регистрация в Supabase

### Шаг 1.1. Откройте сайт

1. Перейдите на **[supabase.com](https://supabase.com)**.
2. В правом верхнем углу нажмите **Start your project**.

### Шаг 1.2. Вход через провайдера

Supabase поддерживает вход через:

- **GitHub** — удобно, если проект уже на GitHub
- **Google** — быстрый вход
- **Email** — регистрация по почте

Выберите один из вариантов и авторизуйтесь.

### Шаг 1.3. Создание организации (если потребуется)

При первом входе может появиться предложение создать **Organization**:

- **Name**: например, `My Projects` или ваше имя
- **Organization URL**: сгенерируется автоматически (например, `your-org`)
- Нажмите **Create organization**

---

## 2. Создание проекта

### Шаг 2.1. Новый проект

1. На главной странице Dashboard нажмите **New Project**.
2. Если есть несколько организаций — выберите нужную.

### Шаг 2.2. Заполнение формы

| Поле | Значение | Описание |
|------|----------|----------|
| **Name** | `mathcalc` | Имя проекта (латиница, без пробелов). Отображается в Dashboard. |
| **Database Password** | *сгенерируйте* | Пароль пользователя `postgres`. **Обязательно сохраните** — он понадобится для подключения. Рекомендуется 20+ символов. |
| **Region** | `Frankfurt (eu-central-1)` или ближайший | Регион сервера. Для России часто выбирают EU (Frankfurt, Ireland). |
| **Pricing Plan** | Free | Бесплатный тариф: 500 MB БД, 2 проекта. |

### Шаг 2.3. Создание

1. Нажмите **Create new project**.
2. Подождите 1–2 минуты, пока Supabase разворачивает проект.
3. Статус сменится на зелёный — проект готов.

### Шаг 2.4. Project Reference

После создания в URL появится идентификатор проекта, например:

```
https://supabase.com/dashboard/project/abcdefghijklmnopqrst
```

`abcdefghijklmnopqrst` — это **Project Reference** (или `PROJECT-REF`). Он входит в строку подключения.

---

## 3. Создание пользователя Prisma (рекомендуется)

Использование отдельного пользователя `prisma` даёт:

- Лучший контроль доступа
- Удобный мониторинг в Supabase (Query Performance, Log Explorer)
- Более безопасную схему (не используем суперпользователя `postgres`)

### Шаг 3.1. Открыть SQL Editor

1. В левом меню выберите **SQL Editor**.
2. Нажмите **New query**.

### Шаг 3.2. Выполнить SQL

Скопируйте и выполните следующий скрипт. **Замените** `YOUR_STRONG_PASSWORD` на свой пароль (рекомендуется 20+ символов):

```sql
-- Создание пользователя prisma
create user "prisma" with password 'YOUR_STRONG_PASSWORD' bypassrls createdb;

-- Расширение прав для отображения в Dashboard
grant "prisma" to "postgres";

-- Права на схему public
grant usage on schema public to prisma;
grant create on schema public to prisma;
grant all on all tables in schema public to prisma;
grant all on all routines in schema public to prisma;
grant all on all sequences in schema public to prisma;
alter default privileges for role postgres in schema public grant all on tables to prisma;
alter default privileges for role postgres in schema public grant all on routines to prisma;
alter default privileges for role postgres in schema public grant all on sequences to prisma;
```

### Шаг 3.3. Запуск

1. Нажмите **Run** (или Ctrl+Enter).
2. Внизу должно появиться сообщение об успешном выполнении.

### Шаг 3.4. Сохранение пароля

Сохраните пароль пользователя `prisma` — он понадобится для `DATABASE_URL` и `DIRECT_URL`.

> **Совет**: можно использовать [Bitwarden Password Generator](https://bitwarden.com/password-generator/) или `openssl rand -base64 24`.

---

## 4. Получение строк подключения

### Шаг 4.1. Открыть настройки подключения

1. В левом меню выберите **Project Settings** (иконка шестерёнки).
2. Перейдите в раздел **Database**.

### Шаг 4.2. Connection string

В блоке **Connection string** выберите вкладку **URI**.

Там будут несколько вариантов:

| Режим | Порт | Когда использовать |
|-------|------|--------------------|
| **Session** | 5432 | Обычный сервер (ВМ, Docker). Рекомендуется для MathCalc. |
| **Transaction** | 6543 | Serverless, edge functions. Нужен `?pgbouncer=true`. |
| **Direct** | 5432 | Прямое подключение (требует IPv6 или IPv4 Add-on). |

### Шаг 4.3. Формат строки

**Session mode** (для нашего backend на Яндекс ВМ):

```
postgres://postgres.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres
```

Пример:

```
postgres://postgres.apbkobhfnmcqqzqeeqss:MyStr0ngP@ss@aws-0-eu-central-1.pooler.supabase.com:5432/postgres
```

### Шаг 4.4. Подстановка пользователя prisma

Если создали пользователя `prisma`, замените `postgres` на `prisma` в начале:

**Было:**
```
postgres://postgres.apbkobhfnmcqqzqeeqss:...
```

**Стало:**
```
postgres://prisma.apbkobhfnmcqqzqeeqss:...
```

### Шаг 4.5. Специальные символы в пароле

Если пароль содержит `@`, `#`, `:`, `/` — закодируйте их в URL (URL-encode):

| Символ | Кодировка |
|--------|-----------|
| `@` | `%40` |
| `#` | `%23` |
| `:` | `%3A` |
| `/` | `%2F` |

Или используйте пароль без спецсимволов.

---

## 5. Настройка Prisma и .env

### Шаг 5.1. Prisma schema

В `calculator/backend/prisma/schema.prisma` уже настроено:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

`directUrl` нужен для миграций и `db push` при использовании Supabase pooler.

### Шаг 5.2. Файл .env

Откройте `calculator/backend/.env` и добавьте/измените:

```env
# Supabase — Session Pooler (порт 5432)
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Для Session mode `DATABASE_URL` и `DIRECT_URL` совпадают.

**Пример с реальными данными:**

```env
DATABASE_URL="postgres://prisma.apbkobhfnmcqqzqeeqss:xK9mP2vL4nQ8wR1t@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://prisma.apbkobhfnmcqqzqeeqss:xK9mP2vL4nQ8wR1t@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

### Шаг 5.3. Если используете пользователя postgres

Можно не создавать `prisma` и использовать стандартного `postgres`. Тогда в строке остаётся `postgres.[PROJECT-REF]`:

```env
DATABASE_URL="postgres://postgres.apbkobhfnmcqqzqeeqss:ВАШ_ПАРОЛЬ_ПОСТГРЕС@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://postgres.apbkobhfnmcqqzqeeqss:ВАШ_ПАРОЛЬ_ПОСТГРЕС@aws-0-eu-central-1.pooler.supabase.com:5432/postgres"
```

Пароль `postgres` — тот, что вы задали при создании проекта (шаг 2.2).

---

## 6. Применение схемы к базе

### Шаг 6.1. Перейти в backend

```bash
cd calculator/backend
```

### Шаг 6.2. Сгенерировать Prisma Client

```bash
npx prisma generate
```

### Шаг 6.3. Создать таблицы в Supabase

**Вариант A — db push** (простой, без миграций):

```bash
npx prisma db push
```

Создаст таблицы `users` и `calculations` по текущей схеме.

**Вариант B — migrate** (с историей миграций):

```bash
npx prisma migrate dev --name init_supabase
```

Создаст папку `prisma/migrations` и применит миграцию.

### Шаг 6.4. Ожидаемый вывод

При успехе:

```
✔ Generated Prisma Client
✔ The database is now in sync with your schema.
```

или

```
✔ Generated Prisma Client
✔ Applied migration 20240314_init_supabase
```

---

## 7. Проверка подключения

### Шаг 7.1. Table Editor в Supabase

1. В Supabase Dashboard откройте **Table Editor**.
2. Должны появиться таблицы `users` и `calculations`.
3. Пока они пустые — это нормально.

### Шаг 7.2. Запуск backend локально

```bash
cd calculator/backend
npm run start:dev
```

Если backend стартует без ошибок и в логах нет сообщений о подключении к БД — Supabase настроен корректно.

### Шаг 7.3. Регистрация пользователя

Откройте frontend, зарегистрируйтесь — пользователь должен появиться в таблице `users` в Supabase.

---

## 8. Частые ошибки и решения

### Ошибка: "Connection refused"

**Причина**: БД недоступна или неверный хост/порт.

**Решение**:
- Проверьте, что проект Supabase в статусе Active (Dashboard).
- Убедитесь, что используете pooler: `aws-0-[REGION].pooler.supabase.com`, а не `db.xxx.supabase.co` (direct требует IPv6).
- Проверьте регион в строке — он должен совпадать с регионом проекта.

---

### Ошибка: "FATAL: password authentication failed"

**Причина**: Неверный пароль или имя пользователя.

**Решение**:
- Проверьте пароль в `.env` — без лишних пробелов и кавычек.
- Если используете `prisma` — убедитесь, что пароль от пользователя `prisma`, а не от `postgres`.
- Сбросить пароль `postgres`: Project Settings → Database → Reset database password.
- Сбросить пароль `prisma`: выполните в SQL Editor:
  ```sql
  alter user "prisma" with password 'новый_пароль';
  ```

---

### Ошибка: "Can't reach database server"

**Причина**: Сетевые ограничения или блокировка.

**Решение**:
- Проверьте интернет-соединение.
- Убедитесь, что не используете VPN, блокирующую Supabase.
- Direct connection по умолчанию только IPv6 — используйте Session pooler (порт 5432).

---

### Ошибка Prisma: "directUrl is required"

**Причина**: В schema указан `directUrl`, но в `.env` нет `DIRECT_URL`.

**Решение**: Добавьте в `.env`:
```env
DIRECT_URL="такое же значение как DATABASE_URL"
```

---

### Ошибка: "prepared statement already exists" (при Transaction mode)

**Причина**: Transaction pooler (порт 6543) не поддерживает prepared statements.

**Решение**: Добавьте `?pgbouncer=true` в конец `DATABASE_URL`:
```env
DATABASE_URL="postgres://...@...pooler.supabase.com:6543/postgres?pgbouncer=true"
```

Для Session mode (5432) это не требуется.

---

### Таблицы не создаются

**Причина**: Недостаточно прав у пользователя.

**Решение**: Перепроверьте SQL из шага 3.2. Убедитесь, что все `grant` выполнены. Можно временно использовать пользователя `postgres` для проверки.

---

## Сводка: что должно быть в .env

```env
# Supabase (Session Pooler)
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
```

Остальные переменные (JWT, SMTP и т.д.) — как в `calculator/backend/.env.example`.

---

## Полезные ссылки

- [Supabase Dashboard](https://supabase.com/dashboard)
- [Connect to your database](https://supabase.com/docs/guides/database/connecting-to-postgres)
- [Supabase + Prisma](https://supabase.com/docs/guides/database/prisma)
- [Prisma Troubleshooting (Supabase)](https://supabase.com/docs/guides/database/prisma/prisma-troubleshooting)
