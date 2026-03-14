# 👥 Просмотр данных пользователей

## ✅ Текущие данные

**В базе данных уже есть:**
- 👤 **1 пользователь** зарегистрирован
- 📧 Email: `test@example.com`
- 👨 Имя: `Test User`
- 📅 Дата: `2026-03-14 08:38:49`

---

## 🔍 3 способа просмотра

### 1️⃣ Prisma Studio (УЖЕ ЗАПУЩЕН!)

**Откройте:**
```
http://localhost:5555
```

**Что увидите:**

```
┌─────────────────────────────────────────┐
│ Prisma Studio                           │
├─────────────────────────────────────────┤
│ Models:                                 │
│                                         │
│ 📋 User (1)          ← клик сюда       │
│ 📋 Calculation (0)                      │
└─────────────────────────────────────────┘
```

**После клика на User:**
- Увидите таблицу со всеми пользователями
- Столбцы: id, email, name, password (хеш), createdAt, updatedAt
- Можно сортировать, фильтровать, редактировать

---

### 2️⃣ Через Terminal

**Все пользователи:**
```bash
docker exec mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT email, name, \"createdAt\" FROM users;"
```

**Количество:**
```bash
docker exec mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT COUNT(*) FROM users;"
```

**Последние 5:**
```bash
docker exec mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT email, name, \"createdAt\" FROM users ORDER BY \"createdAt\" DESC LIMIT 5;"
```

---

### 3️⃣ Страница /admin

**Откройте:**
```
http://localhost:3000/admin
```

Там есть готовые SQL команды для копирования!

---

## 📊 Структура данных

### Таблица users

```sql
CREATE TABLE users (
  id          TEXT PRIMARY KEY,
  email       TEXT UNIQUE NOT NULL,
  password    TEXT NOT NULL,        -- bcrypt хеш
  name        TEXT,
  "createdAt" TIMESTAMP DEFAULT NOW(),
  "updatedAt" TIMESTAMP DEFAULT NOW()
);
```

**Пример записи:**
```json
{
  "id": "d64dc417-ec1c-44e4-9ceb-12eec3f6a835",
  "email": "test@example.com",
  "name": "Test User",
  "password": "$2b$10$xIzJ9h5YqN...",  // хеш, не пароль
  "createdAt": "2026-03-14T08:38:49.224Z",
  "updatedAt": "2026-03-14T08:38:49.224Z"
}
```

### Таблица calculations

```sql
CREATE TABLE calculations (
  id          TEXT PRIMARY KEY,
  "userId"    TEXT REFERENCES users(id),
  type        TEXT,                 -- тип вычисления
  input       JSONB,                -- входные данные
  result      JSONB,                -- результаты
  "createdAt" TIMESTAMP DEFAULT NOW()
);
```

---

## 🎯 Полезные запросы

### Статистика по пользователям

```bash
# Пользователи с количеством вычислений
docker exec mathcalc-postgres psql -U postgres -d mathcalc -c "
  SELECT u.email, u.name, COUNT(c.id) as calculations_count
  FROM users u
  LEFT JOIN calculations c ON u.id = c.\"userId\"
  GROUP BY u.id
  ORDER BY calculations_count DESC;
"
```

### Топ активных пользователей

```bash
docker exec mathcalc-postgres psql -U postgres -d mathcalc -c "
  SELECT u.email, COUNT(c.id) as total_calculations
  FROM users u
  LEFT JOIN calculations c ON u.id = c.\"userId\"
  GROUP BY u.id
  ORDER BY total_calculations DESC
  LIMIT 10;
"
```

### Типы вычислений по пользователю

```bash
docker exec mathcalc-postgres psql -U postgres -d mathcalc -c "
  SELECT type, COUNT(*) as count
  FROM calculations
  WHERE \"userId\" = 'USER_ID_HERE'
  GROUP BY type;
"
```

---

## 🎨 Prisma Studio - Возможности

### Просмотр
- ✅ Табличное отображение
- ✅ Пагинация
- ✅ Сортировка по столбцам
- ✅ Фильтрация

### Редактирование
- ✅ Изменение полей
- ✅ Добавление записей
- ✅ Удаление записей
- ✅ Bulk операции

### Связи
- ✅ Показывает связи между таблицами
- ✅ User → Calculations
- ✅ Можно переходить между связанными записями

---

## 🔒 Безопасность

**Пароли НЕ видны в открытом виде:**

```
password: "$2b$10$xIzJ9h5YqN8X..."  ← это bcrypt хеш
```

**Невозможно:**
- ❌ Узнать оригинальный пароль
- ❌ Восстановить пароль из хеша
- ❌ Подобрать пароль (10 раундов bcrypt)

**Безопасно хранится!** 🔒

---

## ✅ Итого

**СЕЙЧАС ОТКРЫТО:**
```
http://localhost:5555
```

**Там видно:**
- 1 пользователь (test@example.com)
- 0 вычислений (пока не делали)

**После регистрации новых пользователей:**
- Они появятся в Prisma Studio
- Можно будет посмотреть их данные
- Увидите всю историю вычислений

**Попробуйте прямо сейчас!** 🎨
