# 🚀 Простой запуск с авторизацией

## ⚡ Автоматическая настройка (1 команда)

Запустите в терминале:

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator
./SETUP_DATABASE.sh
```

Это автоматически:
1. ✅ Запустит PostgreSQL в Docker
2. ✅ Создаст таблицы в базе данных
3. ✅ Соберёт backend

---

## 🔄 Затем запустите серверы

### Backend (в одном терминале)
```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend
npm run start:dev
```

### Frontend (уже запущен)
Frontend уже работает на http://localhost:3000

---

## 🎯 Готово!

Откройте:
```
http://localhost:3000/auth
```

И зарегистрируйтесь!

---

## 🛠 Ручная настройка (если скрипт не работает)

### 1. Запустить PostgreSQL
```bash
docker-compose up -d
```

### 2. Настроить БД
```bash
cd backend
npx prisma generate
npx prisma db push
```

### 3. Собрать backend
```bash
npm run build
```

### 4. Запустить backend
```bash
npm run start:dev
```

---

## ✅ Проверка

После запуска backend, в логах должно быть:
```
[Nest] LOG [RouterExplorer] Mapped {/auth/register, POST} route
[Nest] LOG [RouterExplorer] Mapped {/auth/login, POST} route
[Nest] LOG [RouterExplorer] Mapped {/auth/profile, GET} route
[Nest] LOG [NestApplication] Nest application successfully started
```

Затем http://localhost:3000/auth должен работать без ошибок!
