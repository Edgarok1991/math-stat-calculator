# 🐳 Подробная инструкция: Docker + PostgreSQL

## 📋 Полное руководство с проверкой каждого шага

---

## ЧАСТЬ 1: Установка Docker Desktop

### Шаг 1.1: Проверка системы

**Откройте Terminal и выполните:**

```bash
sw_vers
```

**Вы должны увидеть:**
```
ProductName:		macOS
ProductVersion:		14.6.0 (или выше)
```

✅ **Проверка пройдена** - переходите к следующему шагу

---

### Шаг 1.2: Скачивание Docker Desktop

**Вариант A: Через браузер (рекомендуется)**

1. Откройте в браузере:
   ```
   https://www.docker.com/products/docker-desktop
   ```

2. Нажмите **"Download for Mac"**

3. Выберите версию:
   - **Apple Silicon (M1/M2/M3)** - если у вас новый Mac
   - **Intel Chip** - если у вас старый Mac

4. Дождитесь загрузки файла `Docker.dmg` (~500 MB)

**Вариант B: Через Homebrew (для опытных)**

```bash
brew install --cask docker
```

---

### Шаг 1.3: Установка Docker Desktop

1. **Откройте скачанный файл** `Docker.dmg`

2. **Перетащите иконку Docker** в папку Applications

3. **Откройте Docker** из Applications:
   ```bash
   open /Applications/Docker.app
   ```
   
   Или найдите в Launchpad

4. **При первом запуске:**
   - Разрешите доступ (System Settings)
   - Примите условия использования
   - Подождите инициализации (~1-2 минуты)

5. **Дождитесь сообщения:**
   ```
   Docker Desktop is running
   ```

6. **Проверьте статус** - в menu bar появится иконка кита 🐳

---

### Шаг 1.4: Проверка установки Docker

**В терминале выполните:**

```bash
docker --version
```

**Должно показать:**
```
Docker version 24.0.0 или выше
```

**Затем:**

```bash
docker compose version
```

**Должно показать:**
```
Docker Compose version v2.20.0 или выше
```

✅ **Если обе команды работают - Docker установлен правильно!**

---

## ЧАСТЬ 2: Запуск PostgreSQL

### Шаг 2.1: Подготовка файла docker-compose.yml

**Файл уже создан здесь:**
```
/Users/edgar/Desktop/Project/math-stat-calculator/calculator/docker-compose.yml
```

**Проверьте его содержимое:**

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator
cat docker-compose.yml
```

**Должен быть такой:**
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
    healthcheck:
      test: ['CMD-SHELL', 'pg_isready -U postgres']
      interval: 10s
      timeout: 5s
      retries: 5

volumes:
  postgres_data:
    driver: local
```

✅ **Файл на месте - переходим дальше**

---

### Шаг 2.2: Запуск PostgreSQL контейнера

**Выполните команду:**

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator
docker compose up -d
```

**Вы увидите:**
```
[+] Running 2/2
 ✔ Network calculator_default       Created
 ✔ Container mathcalc-postgres      Started
```

**Это означает:**
- `Created` - сеть создана
- `Started` - PostgreSQL запущен

⏳ **Первый запуск:** ~30-60 секунд (скачивание образа)  
⏳ **Последующие запуски:** ~5 секунд

---

### Шаг 2.3: Проверка работы PostgreSQL

**Проверка 1: Статус контейнера**

```bash
docker ps
```

**Вывод должен содержать:**
```
CONTAINER ID   IMAGE                 STATUS         PORTS                    NAMES
xxx            postgres:15-alpine    Up 10 seconds  0.0.0.0:5432->5432/tcp   mathcalc-postgres
```

✅ **STATUS = Up** - PostgreSQL работает!

**Проверка 2: Healthcheck**

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

**Должно быть:**
```
NAMES               STATUS
mathcalc-postgres   Up 1 minute (healthy)
```

✅ **(healthy)** - база данных готова к работе!

**Проверка 3: Логи**

```bash
docker logs mathcalc-postgres
```

**В конце должно быть:**
```
PostgreSQL init process complete; ready for start up.
database system is ready to accept connections
```

✅ **"ready to accept connections"** - всё работает!

---

## ЧАСТЬ 3: Настройка Prisma

### Шаг 3.1: Генерация Prisma Client

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend
npx prisma generate
```

**Вывод:**
```
✔ Generated Prisma Client to ./node_modules/@prisma/client
```

⏳ **Время:** ~10-15 секунд

✅ **Prisma Client создан!**

---

### Шаг 3.2: Создание таблиц в PostgreSQL

```bash
npx prisma db push
```

**Вы увидите:**
```
Environment variables loaded from .env
Prisma schema loaded from prisma/schema.prisma
Datasource "db": PostgreSQL database "mathcalc"

🚀  Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

**Что произошло:**
- Подключение к PostgreSQL ✅
- Создана таблица `users` ✅
- Создана таблица `calculations` ✅
- Созданы индексы ✅

✅ **База данных готова!**

---

### Шаг 3.3: Проверка таблиц в PostgreSQL

**Подключитесь к базе:**

```bash
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc
```

**В psql консоли выполните:**

```sql
\dt
```

**Должно показать:**
```
           List of relations
 Schema |     Name      | Type  | Owner
--------+---------------+-------+----------
 public | calculations  | table | postgres
 public | users         | table | postgres
```

✅ **Обе таблицы созданы!**

**Проверьте структуру таблицы users:**

```sql
\d users
```

**Должно показать столбцы:**
- id (text, primary key)
- email (text, unique)
- password (text)
- name (text)
- createdAt (timestamp)
- updatedAt (timestamp)

**Выход из psql:**

```sql
\q
```

---

## ЧАСТЬ 4: Запуск приложения

### Шаг 4.1: Сборка Backend

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend
npm run build
```

**Должно завершиться без ошибок:**
```
> backend@0.0.1 build
> nest build

(компиляция...)
```

⏳ **Время:** ~10-15 секунд

✅ **Backend собран!**

---

### Шаг 4.2: Остановка старого Backend

**Найдите терминал, где запущен backend**

**Нажмите:** `Ctrl + C`

**Или найдите процесс:**

```bash
lsof -i :3001
```

**Убейте процесс:**

```bash
kill -9 PID_NUMBER
```

---

### Шаг 4.3: Запуск нового Backend

```bash
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator/backend
npm run start:dev
```

**В логах вы должны увидеть:**

```
[Nest] Starting Nest application...
[Nest] PrismaService dependencies initialized
[Nest] AuthModule dependencies initialized
[Nest] HistoryModule dependencies initialized
[Nest] Mapped {/auth/register, POST} route
[Nest] Mapped {/auth/login, POST} route
[Nest] Mapped {/auth/profile, GET} route
[Nest] Mapped {/history, GET} route
[Nest] Mapped {/history/:id, DELETE} route
[Nest] Nest application successfully started
Backend сервер запущен на порту 3001
```

✅ **Backend запущен с поддержкой авторизации!**

---

## ЧАСТЬ 5: Тестирование

### Шаг 5.1: Проверка API

**Тест регистрации через curl:**

```bash
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "test@example.com",
    "password": "password123",
    "name": "Тестовый пользователь"
  }'
```

**Должно вернуть:**
```json
{
  "user": {
    "id": "uuid...",
    "email": "test@example.com",
    "name": "Тестовый пользователь"
  },
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
}
```

✅ **Регистрация работает!**

---

### Шаг 5.2: Проверка в браузере

**Откройте:**
```
http://localhost:3000/auth
```

**Попробуйте зарегистрироваться:**
- Email: `your@email.com`
- Пароль: `password123`
- Имя: `Ваше имя`

✅ **Должно работать без ошибок!**

---

### Шаг 5.3: Проверка данных в PostgreSQL

**Способ 1: Через psql**

```bash
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc -c "SELECT email, name FROM users;"
```

**Должно показать:**
```
        email        |        name
---------------------+--------------------
 test@example.com    | Тестовый пользователь
```

**Способ 2: Через Prisma Studio**

```bash
cd backend
npx prisma studio
```

Откройте http://localhost:5555

- Кликните на **User**
- Увидите всех пользователей

✅ **Данные сохраняются в PostgreSQL!**

---

## 🔧 Решение проблем

### Проблема 1: Docker не запускается

**Ошибка:** `command not found: docker`

**Решение:**
1. Убедитесь, что Docker Desktop установлен
2. Запустите Docker Desktop из Applications
3. Дождитесь иконки кита в menu bar
4. Попробуйте снова

---

### Проблема 2: Порт 5432 занят

**Ошибка:** `port is already allocated`

**Проверка:**
```bash
lsof -i :5432
```

**Решение A:** Остановите другой PostgreSQL
```bash
brew services stop postgresql
```

**Решение B:** Измените порт в docker-compose.yml
```yaml
ports:
  - '5433:5432'  # используем 5433
```

И в .env:
```env
DATABASE_URL="postgresql://postgres:postgres@localhost:5433/mathcalc?schema=public"
```

---

### Проблема 3: Контейнер не запускается

**Проверка логов:**
```bash
docker logs mathcalc-postgres
```

**Решение:**
```bash
# Удалить контейнер
docker rm -f mathcalc-postgres

# Удалить volume
docker volume rm calculator_postgres_data

# Запустить заново
docker compose up -d
```

---

### Проблема 4: Prisma не подключается к БД

**Ошибка:** `Can't reach database server`

**Проверка:**
```bash
# PostgreSQL работает?
docker ps | grep postgres

# Порт доступен?
nc -zv localhost 5432
```

**Решение:**
1. Убедитесь, что контейнер работает
2. Проверьте DATABASE_URL в .env
3. Подождите ~10 секунд после запуска

---

## 📊 Checklist установки

### Docker Desktop
- [ ] Docker Desktop скачан
- [ ] Docker Desktop установлен
- [ ] Docker Desktop запущен
- [ ] Иконка кита видна в menu bar
- [ ] `docker --version` работает
- [ ] `docker compose version` работает

### PostgreSQL
- [ ] `docker compose up -d` выполнено
- [ ] `docker ps` показывает mathcalc-postgres
- [ ] STATUS = Up (healthy)
- [ ] Логи показывают "ready to accept connections"

### Prisma
- [ ] `npx prisma generate` выполнено
- [ ] `npx prisma db push` выполнено
- [ ] Таблицы созданы (проверка через \dt)
- [ ] Prisma Studio открывается (опционально)

### Backend
- [ ] `npm run build` выполнено без ошибок
- [ ] `npm run start:dev` запущено
- [ ] Логи показывают /auth/register endpoint
- [ ] curl тест регистрации работает

### Frontend
- [ ] http://localhost:3000/auth открывается
- [ ] Регистрация работает без ошибок
- [ ] Пользователь создаётся в БД
- [ ] Токен получается

---

## 🎯 Полная последовательность команд

**Скопируйте и выполните по порядку:**

```bash
# 1. Установите Docker Desktop (если не установлен)
# Скачайте с https://www.docker.com/products/docker-desktop
# Запустите Docker.app

# 2. Проверка Docker
docker --version
docker compose version

# 3. Переход в директорию проекта
cd /Users/edgar/Desktop/Project/math-stat-calculator/calculator

# 4. Запуск PostgreSQL
docker compose up -d

# 5. Проверка контейнера
docker ps

# 6. Ожидание готовности (10 секунд)
sleep 10

# 7. Переход в backend
cd backend

# 8. Генерация Prisma Client
npx prisma generate

# 9. Создание таблиц
npx prisma db push

# 10. Проверка таблиц
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc -c "\dt"

# 11. Сборка backend
npm run build

# 12. Запуск backend (в отдельном терминале)
npm run start:dev

# 13. Тест (в другом терминале)
curl -X POST http://localhost:3001/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"test@test.com","password":"123456","name":"Test"}'
```

---

## 📸 Визуальные подсказки

### Docker Desktop должен показывать:

```
┌─────────────────────────────────────┐
│ Docker Desktop                      │
├─────────────────────────────────────┤
│ Containers (1)                      │
│  🟢 mathcalc-postgres    RUNNING    │
│                                     │
│ Volumes (1)                         │
│  📦 calculator_postgres_data        │
└─────────────────────────────────────┘
```

### Terminal после docker compose up:

```
✅ [+] Running 2/2
 ✔ Volume "calculator_postgres_data"  Created
 ✔ Container mathcalc-postgres         Started
```

### Terminal после prisma db push:

```
✅ 🚀 Your database is now in sync with your Prisma schema.
✔ Generated Prisma Client
```

---

## 🎓 Что каждая команда делает

| Команда | Что делает |
|---------|------------|
| `docker compose up -d` | Запускает PostgreSQL в фоне |
| `docker ps` | Показывает запущенные контейнеры |
| `docker logs` | Показывает логи контейнера |
| `npx prisma generate` | Создаёт TypeScript типы для БД |
| `npx prisma db push` | Создаёт таблицы в PostgreSQL |
| `npx prisma studio` | Открывает GUI для просмотра БД |

---

## 🚀 После настройки

### Управление PostgreSQL

**Остановить:**
```bash
docker compose down
```

**Запустить:**
```bash
docker compose up -d
```

**Перезапустить:**
```bash
docker compose restart
```

**Удалить с данными:**
```bash
docker compose down -v
```

---

## 💡 Полезные команды

### Просмотр данных

```bash
# Все пользователи
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT id, email, name, \"createdAt\" FROM users;"

# Количество пользователей
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT COUNT(*) FROM users;"

# Последние вычисления
docker exec -it mathcalc-postgres psql -U postgres -d mathcalc \
  -c "SELECT type, \"userId\", \"createdAt\" FROM calculations ORDER BY \"createdAt\" DESC LIMIT 5;"
```

### Бэкап базы данных

```bash
# Создать бэкап
docker exec mathcalc-postgres pg_dump -U postgres mathcalc > backup.sql

# Восстановить
cat backup.sql | docker exec -i mathcalc-postgres psql -U postgres -d mathcalc
```

---

## 🎉 Готово!

После всех шагов у вас будет:

- ✅ Docker Desktop работает
- ✅ PostgreSQL запущен в контейнере
- ✅ База данных mathcalc создана
- ✅ Таблицы users и calculations созданы
- ✅ Backend подключён к PostgreSQL
- ✅ Авторизация работает
- ✅ Данные сохраняются

**Откройте и попробуйте:**
```
http://localhost:3000/auth
```

**Профессиональная база данных! 🚀**
