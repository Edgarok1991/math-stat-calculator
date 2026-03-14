# 🐳 Установка Docker и PostgreSQL

## ✅ Настройки возвращены к PostgreSQL!

---

## 📦 Шаг 1: Установить Docker Desktop

### Для macOS

**Скачать:**
```
https://www.docker.com/products/docker-desktop
```

**Или через Homebrew:**
```bash
brew install --cask docker
```

### Установка

1. Скачайте Docker Desktop для Mac
2. Откройте .dmg файл
3. Перетащите Docker в Applications
4. Запустите Docker Desktop
5. Дождитесь запуска (иконка в menu bar)

**Проверка:**
```bash
docker --version
docker compose version
```

Должно показать версии!

---

## 🚀 Шаг 2: Запустить PostgreSQL

### После установки Docker

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator
docker compose up -d
```

**Что произойдёт:**
- Скачается образ PostgreSQL
- Создастся контейнер `mathcalc-postgres`
- Запустится на порту 5432
- Создастся база данных `mathcalc`

**Проверка:**
```bash
docker ps
```

Вывод:
```
CONTAINER ID   IMAGE              STATUS    PORTS
xxx            postgres:15-alpine Up        0.0.0.0:5432->5432/tcp
```

---

## 🗄️ Шаг 3: Настроить базу данных

```bash
cd backend
npx prisma generate
npx prisma db push
```

**Что произойдёт:**
- Сгенерируется Prisma Client
- Создадутся таблицы `users` и `calculations`
- База данных готова к работе!

---

## 🔄 Шаг 4: Перезапустить Backend

```bash
cd backend
npm run build
npm run start:dev
```

**В логах должно быть:**
```
[Nest] LOG [RouterExplorer] Mapped {/auth/register, POST}
[Nest] LOG [RouterExplorer] Mapped {/auth/login, POST}
[Nest] LOG [NestApplication] Nest application successfully started
```

---

## ✅ Проверка работы

### Откройте

```
http://localhost:3000/auth
```

### Зарегистрируйтесь

Должно работать без ошибок!

---

## 🛠 Docker команды

### Полезные команды

```bash
# Запустить PostgreSQL
docker compose up -d

# Остановить
docker compose down

# Посмотреть логи
docker compose logs -f postgres

# Перезапустить
docker compose restart

# Удалить с данными
docker compose down -v

# Статус контейнеров
docker ps

# Войти в контейнер
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc
```

### PostgreSQL команды (внутри контейнера)

```bash
# Войти в базу
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc

# В psql консоли:
\dt                    -- показать таблицы
\d users              -- структура таблицы users
SELECT * FROM users;  -- все пользователи
\q                    -- выход
```

---

## 📊 Prisma Studio

После запуска PostgreSQL:

```bash
cd backend
npx prisma studio
```

Откроется на `http://localhost:5555`

---

## 🎯 Преимущества PostgreSQL

### Почему PostgreSQL лучше SQLite:

1. **Production-ready**
   - Рассчитан на большие нагрузки
   - Concurrent connections
   - ACID транзакции

2. **Расширенные возможности**
   - JSON поддержка (нативная)
   - Полнотекстовый поиск
   - Сложные запросы

3. **Масштабируемость**
   - Репликация
   - Шардинг
   - Cloud deployment

4. **Индустриальный стандарт**
   - Используется в production
   - Огромное комьюнити
   - Множество инструментов

---

## 🔧 Конфигурация

### docker-compose.yml

```yaml
version: '3.8'

services:
  postgres:
    image: postgres:15-alpine
    container_name: mathcalc-postgres
    restart: unless-stopped
    environment:
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
      POSTGRES_DB: mathcalc
    ports:
      - '5432:5432'
    volumes:
      - postgres_data:/var/lib/postgresql/data

volumes:
  postgres_data:
```

### .env

```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mathcalc?schema=public"
```

---

## 📝 Checklist установки

- [ ] Docker Desktop установлен
- [ ] Docker Desktop запущен
- [ ] `docker compose up -d` выполнено
- [ ] PostgreSQL контейнер работает
- [ ] `npx prisma generate` выполнено
- [ ] `npx prisma db push` выполнено
- [ ] Backend перезапущен
- [ ] Регистрация работает

---

## 🚀 Быстрая установка Docker

### macOS (через Homebrew)

```bash
# Установить Homebrew (если нет)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Установить Docker
brew install --cask docker

# Запустить Docker Desktop
open /Applications/Docker.app
```

Подождите ~30 секунд, пока Docker запустится.

**Затем:**
```bash
cd calculator
docker compose up -d
cd backend
npx prisma generate
npx prisma db push
```

---

## ✅ Готово!

После этого база данных PostgreSQL будет работать профессионально! 🚀
