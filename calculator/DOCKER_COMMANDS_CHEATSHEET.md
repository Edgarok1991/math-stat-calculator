# 🐳 Docker + PostgreSQL - Шпаргалка

## ⚡ Быстрые команды

### Установка Docker

```bash
# Скачать с сайта
https://www.docker.com/products/docker-desktop

# Или через Homebrew
brew install --cask docker
```

---

## 🚀 Основные команды

### Запуск PostgreSQL

```bash
cd calculator
docker compose up -d
```

### Остановка

```bash
docker compose down
```

### Перезапуск

```bash
docker compose restart
```

### Проверка статуса

```bash
docker ps
```

### Логи

```bash
docker logs mathcalc-postgres
docker logs -f mathcalc-postgres  # следить в реальном времени
```

---

## 🗄️ Prisma команды

### Генерация клиента

```bash
cd backend
npx prisma generate
```

### Создание таблиц

```bash
npx prisma db push
```

### Просмотр БД (GUI)

```bash
npx prisma studio
# Откроется http://localhost:5555
```

### Миграции

```bash
npx prisma migrate dev --name init
```

---

## 🔍 Просмотр данных

### Через psql

```bash
# Войти в PostgreSQL
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc

# Команды внутри psql:
\dt                          # показать таблицы
\d users                     # структура таблицы
SELECT * FROM users;         # все пользователи
SELECT COUNT(*) FROM users;  # количество
\q                          # выход
```

### Одной командой (без входа в psql)

```bash
# Показать всех пользователей
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT email, name FROM users;"

# Посчитать пользователей
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT COUNT(*) FROM users;"
```

---

## 🔧 Управление данными

### Очистка

```bash
# Удалить контейнер
docker rm -f mathcalc-postgres

# Удалить контейнер + данные
docker compose down -v

# Удалить всё и начать заново
docker compose down -v
docker compose up -d
cd backend && npx prisma db push
```

### Бэкап и восстановление

```bash
# Создать бэкап
docker exec mathcalc-postgres pg_dump -U postgres mathcalc > backup.sql

# Восстановить из бэкапа
cat backup.sql | docker exec -i mathcalc-postgres psql -U postgres -d mathcalc
```

---

## 📊 Мониторинг

### Статус контейнера

```bash
docker ps --format "table {{.Names}}\t{{.Status}}\t{{.Ports}}"
```

### Использование ресурсов

```bash
docker stats mathcalc-postgres
```

### Проверка здоровья

```bash
docker inspect mathcalc-postgres | grep -A 10 Health
```

---

## 🔄 Полная перезагрузка

### Если что-то пошло не так

```bash
# 1. Остановить всё
docker compose down -v

# 2. Очистить Prisma
cd backend
rm -rf node_modules/.prisma
rm -rf prisma/migrations

# 3. Запустить PostgreSQL
cd ..
docker compose up -d

# 4. Подождать готовности
sleep 10

# 5. Настроить Prisma
cd backend
npx prisma generate
npx prisma db push

# 6. Перезапустить backend
npm run build
npm run start:dev
```

---

## 📁 Важные пути

```
calculator/
├── docker-compose.yml          ← конфигурация Docker
├── backend/
│   ├── .env                   ← DATABASE_URL
│   ├── prisma/
│   │   └── schema.prisma      ← схема БД
│   └── src/
│       ├── prisma/            ← Prisma сервис
│       ├── auth/              ← авторизация
│       └── history/           ← история
```

---

## ✅ Минимальная последовательность

**Для быстрого старта:**

```bash
# 1. Установить Docker Desktop (один раз)
# 2. Запустить Docker Desktop (один раз)

# 3. Каждый раз при разработке:
cd calculator
docker compose up -d
cd backend
npm run start:dev
```

---

## 🎯 Проверка что всё работает

```bash
# Docker работает?
docker ps | grep postgres
# Должно показать: mathcalc-postgres ... Up

# PostgreSQL отвечает?
docker exec mathcalc-postgres pg_isready
# Должно показать: accepting connections

# Backend видит БД?
curl http://localhost:3001
# Должно вернуть: {"message":"Server is running"}

# Регистрация работает?
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456"}'
# Должно вернуть: {"user":{...},"token":"..."}
```

---

## 🚀 Готово!

Сохраните эту шпаргалку - все команды под рукой!
