# 🔐 Система авторизации - Установка

## ✅ Что реализовано (Backend)

### 1. База данных PostgreSQL
- ✅ Docker Compose для PostgreSQL
- ✅ Prisma ORM
- ✅ Модели User и Calculation

### 2. Авторизация
- ✅ JWT токены
- ✅ Bcrypt для хеширования паролей
- ✅ Passport стратегия
- ✅ Guards для защиты маршрутов

### 3. API Endpoints
- ✅ POST /auth/register - регистрация
- ✅ POST /auth/login - вход
- ✅ GET /auth/profile - профиль (защищён)

### 4. История вычислений
- ✅ GET /history - получить историю
- ✅ DELETE /history/:id - удалить запись
- ✅ DELETE /history - очистить всю историю
- ✅ Автосохранение всех вычислений

---

## 🚀 Запуск базы данных

### 1. Запустить PostgreSQL

```bash
cd calculator
docker-compose up -d
```

### 2. Применить миграции Prisma

```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Просмотр базы данных (опционально)

```bash
npx prisma studio
```

Откроется на http://localhost:5555

---

## 📊 Модель данных

### User (Пользователь)
```prisma
model User {
  id        String   @id @default(uuid())
  email     String   @unique
  password  String   (hashed)
  name      String?
  createdAt DateTime
  updatedAt DateTime
  
  calculations Calculation[]
}
```

### Calculation (Вычисление)
```prisma
model Calculation {
  id        String   @id @default(uuid())
  userId    String
  type      String   // 'clustering', 'integral', etc.
  input     Json     // Входные данные
  result    Json     // Результаты
  createdAt DateTime
  
  user      User     @relation(...)
}
```

---

## 🔑 API Примеры

### Регистрация

**POST** `/auth/register`

```json
{
  "email": "user@example.com",
  "password": "password123",
  "name": "Иван Иванов"
}
```

**Ответ:**
```json
{
  "user": {
    "id": "uuid",
    "email": "user@example.com",
    "name": "Иван Иванов"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

### Вход

**POST** `/auth/login`

```json
{
  "email": "user@example.com",
  "password": "password123"
}
```

**Ответ:**
```json
{
  "user": { ... },
  "token": "..."
}
```

### Профиль

**GET** `/auth/profile`

**Headers:**
```
Authorization: Bearer <token>
```

**Ответ:**
```json
{
  "id": "uuid",
  "email": "user@example.com",
  "name": "Иван Иванов",
  "createdAt": "2026-03-14T..."
}
```

---

## 📚 История вычислений

### Получить историю

**GET** `/history?type=clustering`

**Headers:**
```
Authorization: Bearer <token>
```

**Ответ:**
```json
[
  {
    "id": "uuid",
    "type": "clustering",
    "input": { "points": [...], "k": 2 },
    "result": { "clusters": [...] },
    "createdAt": "2026-03-14T..."
  }
]
```

---

## 🛠 Установленные пакеты

### Backend
- `@prisma/client` - Prisma ORM клиент
- `prisma` - Prisma CLI
- `@nestjs/jwt` - JWT модуль
- `@nestjs/passport` - Passport интеграция
- `passport-jwt` - JWT стратегия
- `bcrypt` - Хеширование паролей
- `class-validator` - Валидация DTO
- `@nestjs/config` - Конфигурация

---

## 📁 Структура файлов

```
backend/
├── prisma/
│   └── schema.prisma          ← Схема БД
├── src/
│   ├── auth/
│   │   ├── dto/
│   │   │   └── auth.dto.ts    ← DTO для регистрации/входа
│   │   ├── guards/
│   │   │   └── jwt-auth.guard.ts  ← Guard для защиты
│   │   ├── strategies/
│   │   │   └── jwt.strategy.ts    ← JWT стратегия
│   │   ├── auth.controller.ts     ← Auth контроллер
│   │   ├── auth.service.ts        ← Auth сервис
│   │   └── auth.module.ts         ← Auth модуль
│   ├── history/
│   │   ├── history.controller.ts  ← История API
│   │   ├── history.service.ts     ← История сервис
│   │   └── history.module.ts      ← История модуль
│   ├── prisma/
│   │   ├── prisma.service.ts      ← Prisma сервис
│   │   └── prisma.module.ts       ← Prisma модуль
│   └── app.module.ts              ← Обновлён
├── .env                       ← Переменные окружения
└── docker-compose.yml         ← PostgreSQL контейнер
```

---

## 🔄 Следующие шаги

### Backend готов! ✅

**Осталось:**
1. Frontend компоненты для входа/регистрации
2. Auth Context на Frontend
3. Интеграция с API

---

**Статус Backend:** ✅ Готов
