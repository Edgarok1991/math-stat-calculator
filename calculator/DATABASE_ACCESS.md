# 📊 Доступ к базе данных - Инструкция

## ✅ Prisma Studio запущен!

**Теперь откройте в браузере:**

```
http://localhost:5555
```

---

## 🎯 Что вы увидите

### Интерфейс Prisma Studio

```
┌─────────────────────────────────────────┐
│ Prisma Studio                           │
├─────────────────────────────────────────┤
│ Модели:                                 │
│  📋 User         (пользователи)         │
│  📋 Calculation  (вычисления)           │
└─────────────────────────────────────────┘
```

### Таблица User

**Столбцы:**
- `id` - UUID пользователя
- `email` - Email адрес
- `name` - Имя (если указано)
- `password` - Хешированный пароль
- `createdAt` - Дата регистрации
- `updatedAt` - Дата обновления

### Таблица Calculation

**Столбцы:**
- `id` - UUID записи
- `userId` - ID пользователя
- `type` - Тип вычисления (clustering, integral, etc.)
- `input` - Входные данные (JSON строка)
- `result` - Результаты (JSON строка)
- `createdAt` - Дата вычисления

---

## 🔍 Как пользоваться

### 1. Просмотр пользователей

1. Кликните на **User** в левом меню
2. Увидите всех зарегистрированных пользователей
3. Можно кликнуть на запись для деталей

### 2. Просмотр вычислений

1. Кликните на **Calculation**
2. Увидите всю историю
3. Можно фильтровать по `userId` или `type`

### 3. Редактирование

1. Кликните на запись
2. Измените поля
3. Нажмите **Save**

### 4. Удаление

1. Выберите записи (checkbox)
2. Нажмите **Delete**

---

## 🔧 Альтернативный способ - SQLite команды

```bash
cd backend/prisma
sqlite3 dev.db
```

**В SQLite консоли:**

```sql
-- Показать всех пользователей
SELECT id, email, name, createdAt FROM users;

-- Посчитать пользователей
SELECT COUNT(*) FROM users;

-- Показать последние вычисления
SELECT type, userId, createdAt FROM calculations 
ORDER BY createdAt DESC 
LIMIT 10;

-- Выход
.quit
```

---

## 📁 Прямой доступ к файлу

**Файл базы данных:**
```
/Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend/prisma/dev.db
```

**Можно открыть в:**
- DB Browser for SQLite
- TablePlus
- VS Code (расширение SQLite Viewer)

---

## ✅ Сейчас Prisma Studio запущен

**Откройте:**
```
http://localhost:5555
```

**Увидите всех пользователей и их вычисления!** 👀
