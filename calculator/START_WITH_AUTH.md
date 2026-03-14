# 🚀 Запуск приложения с авторизацией

## ⚡ Быстрый запуск (3 шага)

### Шаг 1: Запустить PostgreSQL

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator
docker-compose up -d
```

**Проверка:**
```bash
docker ps
# Должен быть запущен: mathcalc-postgres
```

### Шаг 2: Настроить базу данных

```bash
cd backend
npx prisma db push
```

**Что произойдёт:**
- Создадутся таблицы `users` и `calculations`
- База данных будет готова к работе

### Шаг 3: Перезапустить Backend

**Остановите текущий backend** (Ctrl+C в терминале)

Затем запустите:
```bash
cd backend
npm run start:dev
```

**Или из корня calculator:**
```bash
cd backend && npm run start:dev
```

---

## ✅ Проверка работы

### 1. Backend должен показать

```
[Nest] Nest application successfully started
Backend сервер запущен на порту 3001

Маршруты должны включать:
✓ /auth/register (POST)
✓ /auth/login (POST)
✓ /auth/profile (GET)
✓ /history (GET)
```

### 2. Откройте приложение

```
http://localhost:3000/auth
```

### 3. Зарегистрируйтесь

- Email: `test@example.com`
- Пароль: `password123`
- Имя: `Тест`

### 4. Выполните вычисление

Перейдите в любой калькулятор и выполните расчёт

### 5. Проверьте историю

Header → Ваше имя → История

---

## 🐳 Docker команды

### Запуск PostgreSQL
```bash
docker-compose up -d
```

### Проверка состояния
```bash
docker ps
docker logs mathcalc-postgres
```

### Остановка
```bash
docker-compose down
```

### Полная очистка (включая данные)
```bash
docker-compose down -v
```

---

## 🔧 Если что-то пошло не так

### PostgreSQL не запускается

**Проверьте порт:**
```bash
lsof -i :5432
```

**Если порт занят:**
```bash
# Измените порт в docker-compose.yml
ports:
  - '5433:5432'  # используйте 5433 вместо 5432

# И в .env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mathcalc?schema=public"
```

### Backend не видит таблицы

**Пересоздайте базу:**
```bash
cd backend
npx prisma db push --force-reset
npx prisma generate
```

### Ошибка "Cannot POST /auth/register"

**Убедитесь:**
1. Backend перезапущен после сборки
2. В логах есть маршрут `/auth/register`
3. PostgreSQL работает

---

## 📊 Текущее состояние

### Backend
- ✅ Собран успешно
- ⏳ Нужно перезапустить

### PostgreSQL
- ⏳ Нужно запустить
- ⏳ Нужно применить миграции

### Frontend
- ✅ Работает
- ✅ Компоненты готовы

---

## 🎯 Следующие действия

1. **Запустите Docker:**
   ```bash
   docker-compose up -d
   ```

2. **Настройте БД:**
   ```bash
   cd backend
   npx prisma db push
   ```

3. **Перезапустите Backend:**
   ```bash
   cd backend
   npm run start:dev
   ```

4. **Откройте:**
   ```
   http://localhost:3000/auth
   ```

---

**Готово! 🎉**
