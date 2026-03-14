# 🔍 Просмотр данных пользователей

## 🎯 Способ 1: Prisma Studio (рекомендуется)

### Запустить Prisma Studio

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend
npx prisma studio
```

### Откроется автоматически

```
http://localhost:5555
```

### Что вы увидите

**Красивый графический интерфейс:**

1. **Таблица User:**
   - Список всех пользователей
   - Email, имя, дата создания
   - Можно редактировать, удалять

2. **Таблица Calculation:**
   - История всех вычислений
   - Входные данные и результаты
   - Связь с пользователем

**Можно:**
- ✅ Просматривать данные
- ✅ Редактировать записи
- ✅ Удалять записи
- ✅ Фильтровать
- ✅ Искать

---

## 📁 Способ 2: Прямой доступ к файлу

### Расположение базы данных

```
/Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend/prisma/dev.db
```

### Открыть с помощью SQLite клиента

**Через командную строку:**
```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend/prisma
sqlite3 dev.db
```

**Команды SQLite:**
```sql
-- Показать таблицы
.tables

-- Показать всех пользователей
SELECT * FROM users;

-- Показать структуру таблицы
.schema users

-- Посчитать пользователей
SELECT COUNT(*) FROM users;

-- Показать последних пользователей
SELECT email, name, createdAt FROM users ORDER BY createdAt DESC;

-- Выход
.quit
```

### Через GUI клиенты

**Рекомендуемые приложения:**

1. **DB Browser for SQLite** (бесплатно)
   - https://sqlitebrowser.org/
   - Графический интерфейс
   - Удобный просмотр и редактирование

2. **TablePlus** (платно, но красиво)
   - https://tableplus.com/
   - Современный UI
   - Поддержка многих БД

3. **DBeaver** (бесплатно)
   - https://dbeaver.io/
   - Мощный инструмент
   - Поддержка всех БД

---

## 🔧 Способ 3: Через API

### Создать admin endpoint

Добавьте в `auth.controller.ts`:

```typescript
@Get('users')
@UseGuards(JwtAuthGuard)
async getAllUsers() {
  return this.prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      _count: {
        select: { calculations: true }
      }
    }
  });
}
```

Затем:
```bash
curl http://localhost:3001/auth/users \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📊 Примеры данных

### Таблица users

| id | email | name | createdAt |
|----|-------|------|-----------|
| uuid-1 | test@example.com | Тест | 2026-03-14 |
| uuid-2 | user@example.com | Пользователь | 2026-03-14 |

### Таблица calculations

| id | userId | type | input | result | createdAt |
|----|--------|------|-------|--------|-----------|
| uuid-1 | uuid-1 | clustering | {...} | {...} | 2026-03-14 |
| uuid-2 | uuid-1 | integral | {...} | {...} | 2026-03-14 |

---

## 🎯 Быстрый доступ

### Самый простой способ:

```bash
cd backend
npx prisma studio
```

Откроется на http://localhost:5555

**Там всё видно!** 👀

---

## 🔒 Безопасность

**Пароли в базе:**
- ✅ Хешированы (bcrypt)
- ❌ Не видны в открытом виде
- ✅ Невозможно восстановить

**Пример:**
```
password: $2b$10$xIzJ9h5YqN... (хеш, не пароль)
```

---

## 📁 Расположение файлов

```
backend/
├── prisma/
│   ├── dev.db          ← БАЗА ДАННЫХ ЗДЕСЬ
│   ├── dev.db-journal  ← Временный файл
│   └── schema.prisma   ← Схема
```

---

## ✅ Рекомендация

**Используйте Prisma Studio:**

```bash
cd backend
npx prisma studio
```

**Откроется:** http://localhost:5555

**Самый удобный способ! 🎨**
