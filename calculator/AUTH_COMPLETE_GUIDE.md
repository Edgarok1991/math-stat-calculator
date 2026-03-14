# 🔐 Полное руководство по авторизации

## 🎉 Система авторизации готова!

Добавлена **полнофункциональная система авторизации** с использованием современных технологий.

---

## 🚀 Быстрый старт

### 1. Запустить PostgreSQL

```bash
cd calculator
docker-compose up -d
```

### 2. Настроить базу данных

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Запустить приложение

**Backend:**
```bash
cd backend
npm run start:dev
```

**Frontend:**
```bash
cd frontend
npm run dev
```

### 4. Открыть приложение

```
http://localhost:3000
```

---

## 🎯 Возможности

### ✅ Авторизация
- 🔑 Регистрация пользователей
- 🔐 Вход с email и паролем
- 🔒 JWT токены для безопасности
- 👤 Личный кабинет пользователя

### ✅ История вычислений
- 📊 Автоматическое сохранение всех расчётов
- 📋 Просмотр истории с фильтрами
- 🗑️ Удаление отдельных записей
- 🧹 Очистка всей истории

### ✅ Защита данных
- 🔐 Bcrypt хеширование паролей
- 🛡️ JWT токены с истечением срока
- 🔒 Защищённые API endpoints
- 👥 Изоляция данных пользователей

---

## 🛠 Технологический стек

### Backend
| Технология | Назначение |
|------------|------------|
| **NestJS** | Backend фреймворк |
| **Prisma** | ORM для работы с БД |
| **PostgreSQL** | Реляционная база данных |
| **JWT** | Токены авторизации |
| **Bcrypt** | Хеширование паролей |
| **Passport** | Аутентификация |
| **Docker** | Контейнеризация БД |

### Frontend
| Технология | Назначение |
|------------|------------|
| **React Context** | Управление состоянием auth |
| **React Hook Form** | Формы входа/регистрации |
| **Zod** | Валидация данных |
| **LocalStorage** | Хранение токена |

---

## 📁 Структура проекта

### Backend (новое)
```
backend/
├── prisma/
│   └── schema.prisma          ← Схема БД
├── src/
│   ├── auth/                  ← Auth модуль
│   │   ├── dto/
│   │   │   └── auth.dto.ts
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts
│   │   ├── auth.controller.ts
│   │   ├── auth.service.ts
│   │   └── auth.module.ts
│   ├── history/               ← История вычислений
│   │   ├── history.controller.ts
│   │   ├── history.service.ts
│   │   └── history.module.ts
│   ├── prisma/                ← Prisma модуль
│   │   ├── prisma.service.ts
│   │   └── prisma.module.ts
│   └── app.module.ts          ← Обновлён
├── .env                       ← Переменные окружения
└── docker-compose.yml         ← PostgreSQL
```

### Frontend (новое)
```
frontend/
├── src/
│   ├── app/
│   │   ├── auth/
│   │   │   └── page.tsx       ← Страница входа/регистрации
│   │   ├── history/
│   │   │   └── page.tsx       ← История вычислений
│   │   └── layout.tsx         ← Обновлён (AuthProvider)
│   ├── components/
│   │   └── auth/
│   │       ├── LoginForm.tsx  ← Форма входа
│   │       └── RegisterForm.tsx ← Форма регистрации
│   ├── contexts/
│   │   └── AuthContext.tsx    ← Auth контекст
│   └── components/Layout/
│       └── Header.tsx         ← Обновлён (меню пользователя)
```

---

## 🔑 API Endpoints

### Auth
```
POST   /auth/register    - Регистрация
POST   /auth/login       - Вход
GET    /auth/profile     - Профиль (защищён)
```

### History
```
GET    /history          - Получить историю
GET    /history?type=... - Фильтр по типу
DELETE /history/:id      - Удалить запись
DELETE /history          - Очистить всё
```

---

## 📊 Модель данных

### User
```typescript
{
  id: string (UUID)
  email: string (уникальный)
  password: string (хеш)
  name?: string
  createdAt: DateTime
  updatedAt: DateTime
}
```

### Calculation
```typescript
{
  id: string (UUID)
  userId: string
  type: string ('clustering', 'integral', etc.)
  input: JSON (входные данные)
  result: JSON (результаты)
  createdAt: DateTime
}
```

---

## 🎨 Интерфейс

### Страница авторизации

**URL:** `/auth`

**Функционал:**
- 📝 Форма входа
- ✍️ Форма регистрации
- 🔄 Переключение между формами
- ⚡ Валидация в реальном времени
- 🎨 Красивый дизайн с градиентами

### Header

**Для гостей:**
```
[Навигация] [Тема] [Войти]
```

**Для авторизованных:**
```
[Навигация] [Тема] [👤 Имя пользователя ▼]
                        ├─ История
                        └─ Выйти
```

### Страница истории

**URL:** `/history`

**Функционал:**
- 📋 Список всех вычислений
- 🔍 Фильтры по типу
- 📅 Дата и время
- 🗑️ Удаление записей
- 🧹 Очистка всей истории

---

## 🔄 Workflow

### Регистрация нового пользователя

1. Открыть `/auth`
2. Переключиться на "Регистрация"
3. Заполнить данные:
   - Email
   - Пароль (мин. 6 символов)
   - Имя (необязательно)
4. Нажать "Зарегистрироваться"
5. Автоматический вход и перенаправление на главную

### Вход существующего пользователя

1. Открыть `/auth`
2. Ввести email и пароль
3. Нажать "Войти"
4. Перенаправление на главную

### Использование приложения

1. Выполнить вычисление (любое)
2. Результат автоматически сохраняется в истории
3. Просмотр истории: Header → Имя пользователя → История

### Выход

1. Header → Имя пользователя → Выйти
2. Токен удаляется
3. Перенаправление на главную

---

## 🔒 Безопасность

### Backend
- ✅ Пароли хешируются (bcrypt, 10 раундов)
- ✅ JWT токены с истечением (7 дней)
- ✅ Guards защищают endpoints
- ✅ Валидация всех входных данных

### Frontend
- ✅ Токен хранится в localStorage
- ✅ Автоматическая загрузка при старте
- ✅ Защита маршрутов (редирект на /auth)
- ✅ Очистка данных при выходе

---

## 🧪 Тестирование

### Регистрация через API

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Test User"
  }'
```

### Вход через API

```bash
curl -X POST http://localhost:3001/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123"
  }'
```

### Получение профиля

```bash
curl http://localhost:3001/auth/profile \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## 📚 Управление БД

### Prisma Studio (GUI для БД)

```bash
cd backend
npx prisma studio
```

Откроется на `http://localhost:5555`

### Миграции

```bash
# Создать миграцию
npx prisma migrate dev --name init

# Применить миграции
npx prisma migrate deploy

# Сбросить БД
npx prisma migrate reset
```

### Docker команды

```bash
# Запустить PostgreSQL
docker-compose up -d

# Остановить
docker-compose down

# Остановить и удалить данные
docker-compose down -v

# Просмотр логов
docker-compose logs -f postgres
```

---

## ⚙️ Конфигурация

### .env файл

```env
# Database
DATABASE_URL="postgresql://postgres:postgres@localhost:5432/mathcalc?schema=public"

# JWT
JWT_SECRET="your-super-secret-jwt-key-change-this-in-production"
JWT_EXPIRATION="7d"

# App
PORT=3001
NODE_ENV=development
```

**⚠️ ВАЖНО:** Измените `JWT_SECRET` на production!

---

## 🎯 Дополнительные возможности

### Будущие улучшения

- [ ] OAuth (Google, GitHub)
- [ ] Восстановление пароля
- [ ] Email подтверждение
- [ ] Двухфакторная аутентификация
- [ ] Управление сессиями
- [ ] Экспорт истории вычислений
- [ ] Sharing ссылок на результаты

---

## ✅ Checklist запуска

- [x] PostgreSQL запущен
- [x] База данных создана
- [x] Backend запущен
- [x] Frontend запущен
- [x] `/auth` открывается
- [x] Регистрация работает
- [x] Вход работает
- [x] История сохраняется

---

## 🎉 Готово к использованию!

**URL для авторизации:**
```
http://localhost:3000/auth
```

**URL истории:**
```
http://localhost:3000/history
```

**Все современные технологии интегрированы!** 🚀
