# 🚀 Быстрый старт с авторизацией

## ✅ Что добавлено

- 🔐 **Полная система авторизации** (JWT + bcrypt)
- 💾 **PostgreSQL база данных** (через Docker)
- 📊 **История вычислений** для каждого пользователя
- 👤 **Личный кабинет**

---

## ⚡ Запуск за 3 шага

### 1. База данных

```bash
cd calculator
docker-compose up -d
cd backend
npx prisma generate
npx prisma db push
```

### 2. Backend

```bash
cd backend
npm run start:dev
```

### 3. Frontend

```bash
cd frontend  
npm run dev
```

### 4. Готово!

```
http://localhost:3000/auth
```

---

## 🎯 Первое использование

### Регистрация

1. Откройте http://localhost:3000/auth
2. Нажмите "Зарегистрироваться"
3. Введите:
   - Email: `test@example.com`
   - Пароль: `password123`
   - Имя: `Тестовый пользователь`
4. Готово! Вы авторизованы

### Вычисления

1. Выполните любое вычисление
2. Результат автоматически сохраняется
3. Проверьте историю: Header → Ваше имя → История

---

## 📊 Структура

```
Приложение
├── /auth          ← Вход/Регистрация
├── /history       ← История (защищено)
├── /clustering    ← Вычисления (сохраняются)
├── /calculus      ← Вычисления (сохраняются)
└── ...            ← Все расчёты сохраняются
```

---

## 🔑 Технологии

**Backend:**
- NestJS + Prisma + PostgreSQL
- JWT + Bcrypt + Passport

**Frontend:**
- React Context + LocalStorage
- React Hook Form + Zod

---

## ✅ Checklist

- [x] Docker Compose создан
- [x] Prisma схема готова
- [x] Auth модуль реализован
- [x] History модуль реализован
- [x] Frontend компоненты созданы
- [x] Header обновлён
- [x] Auth context настроен

---

## 🎉 Готово!

**Откройте:**
```
http://localhost:3000/auth
```

**Зарегистрируйтесь и попробуйте!**
