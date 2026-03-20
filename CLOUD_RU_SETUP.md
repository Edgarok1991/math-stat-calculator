# Подробная настройка Cloud.ru для MathCalc

Пошаговая инструкция по развёртыванию NestJS backend на бесплатной виртуальной машине в Cloud.ru Evolution. В том же стиле, что и [SUPABASE_SETUP.md](./SUPABASE_SETUP.md) и [YANDEX_CLOUD_SETUP.md](./YANDEX_CLOUD_SETUP.md).

---

## Содержание

1. [Регистрация и Free Tier](#1-регистрация-и-free-tier)
2. [SSH-ключ](#2-ssh-ключ)
3. [Создание бесплатной ВМ](#3-создание-бесплатной-вм)
4. [Публичный IP-адрес](#4-публичный-ip-адрес)
5. [Подключение по SSH](#5-подключение-по-ssh)
6. [Установка Node.js](#6-установка-nodejs)
7. [Клонирование и сборка проекта](#7-клонирование-и-сборка-проекта)
8. [Настройка .env на сервере](#8-настройка-env-на-сервере)
9. [Запуск через PM2](#9-запуск-через-pm2)
10. [Открытие порта в firewall](#10-открытие-порта-в-firewall)
11. [Проверка работы](#11-проверка-работы)
12. [Обновление backend](#12-обновление-backend)
13. [Частые ошибки и решения](#13-частые-ошибки-и-решения)

---

## 1. Регистрация и Free Tier

### Шаг 1.1. Откройте сайт

1. Перейдите на **[cloud.ru](https://cloud.ru)**.
2. Нажмите **Войти** или **Зарегистрироваться**.

### Шаг 1.2. Регистрация

1. Откройте **[console.cloud.ru/registration](https://console.cloud.ru/registration/)**.
2. Заполните форму регистрации (email, пароль и т.д.).
3. Подтвердите email, если потребуется.

### Шаг 1.3. Привязка карты и бонусы

Для доступа к Free Tier нужен **положительный баланс**:

- При **привязке банковской карты** вы получаете **4000 бонусных рублей**.
- Бонусы тратятся на платные услуги (например, публичный IP).
- Free tier ВМ — бесплатна, но **публичный IP тарифицируется отдельно**.

Без публичного IP к ВМ нельзя подключиться из интернета. Публичный IP стоит около 4–5 ₽/день (уточняйте в [тарифах](https://cloud.ru/docs/public-ip/ug/topics/pricing)).

### Шаг 1.4. Личный кабинет

После входа откроется **личный кабинет** (консоль управления):

- **Верхняя панель**: меню (☰), выбор проекта/каталога.
- **Левое меню**: Инфраструктура, Биллинг и др.
- **Центральная область**: список ресурсов.

---

## 2. SSH-ключ

SSH-ключ нужен для подключения к ВМ. Добавить его нужно **до** создания виртуальной машины.

### Шаг 2.1. Генерация ключа (на вашем компьютере)

В терминале на Mac или Linux:

```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_ed25519 -N ""
```

Или с RSA:

```bash
ssh-keygen -t rsa -b 4096 -C "your_email@example.com" -f ~/.ssh/id_rsa -N ""
```

### Шаг 2.2. Проверка ключа

Публичный ключ не должен содержать **кириллицу** в конце (username@computername). Если есть — отредактируйте файл и замените на латиницу.

```bash
cat ~/.ssh/id_ed25519.pub
# или
cat ~/.ssh/id_rsa.pub
```

### Шаг 2.3. Загрузка ключа в Cloud.ru

1. В консоли нажмите **☰** (меню) слева вверху.
2. Выберите **Инфраструктура** → **SSH-ключи**.
3. Нажмите **Добавить ключ**.
4. Выберите **Загрузить публичный ключ из файла** и укажите путь к `~/.ssh/id_ed25519.pub` (или `id_rsa.pub`).
5. Нажмите **Добавить**.

Ключ появится в списке — запомните его название, оно понадобится при создании ВМ.

---

## 3. Создание бесплатной ВМ

### Шаг 3.1. Открыть страницу создания Free Tier ВМ

Перейдите по прямой ссылке:

**[console.cloud.ru/spa/svp/virtual-machines/create?free-tier=true](https://console.cloud.ru/spa/svp/virtual-machines/create?free-tier=true)**

Или:

1. Меню **☰** → **Инфраструктура** → **Виртуальные машины**.
2. Нажмите **Создать виртуальную машину**.
3. Если есть опция **Free Tier** — выберите её.

### Шаг 3.2. Конфигурация Free Tier (фиксированная)

Бесплатная ВМ создаётся с **неизменяемой** конфигурацией:

| Параметр | Значение |
|----------|----------|
| **vCPU** | 2 |
| **RAM** | 4 ГБ |
| **Диск** | 30 ГБ NVMe |
| **Гарантированная доля vCPU** | до 10% |

Этого достаточно для NestJS backend.

### Шаг 3.3. Название ВМ

В поле **Название** введите, например: `mathcalc-backend`.

Имя должно быть уникальным в проекте.

### Шаг 3.4. Образ ОС

1. Выберите вкладку **Публичные** (или **Маркетплейс**).
2. Найдите и выберите **Ubuntu 22.04 LTS** (или другой Ubuntu).

### Шаг 3.5. Публичный IP

1. Оставьте включённой опцию **Подключить публичный IP**.
2. Выберите **Арендовать новый** (если нет свободного IP).

Публичный IP платный (~4–5 ₽/день). Без него к ВМ нельзя подключиться по SSH из интернета.

### Шаг 3.6. Логин и аутентификация

| Поле | Значение | Описание |
|------|----------|----------|
| **Логин** | `ubuntu` | Стандартный пользователь для Ubuntu. |
| **Метод аутентификации** | **Публичный ключ** | Выберите загруженный SSH-ключ из списка. |

Если ключа нет в списке — вернитесь к разделу 2 и загрузите его.

### Шаг 3.7. Создание

1. Нажмите **Создать**.
2. Дождитесь создания (1–2 минуты).
3. В списке ВМ статус сменится на **Запущена**.
4. Запишите **публичный IP-адрес** ВМ — он понадобится для SSH.

---

## 4. Публичный IP-адрес

Если при создании ВМ вы не назначили публичный IP:

1. Откройте **Инфраструктура** → **Публичные IP**.
2. Нажмите **Арендовать**.
3. Выберите зону доступности (ту же, что и ВМ).
4. Назначьте IP на ВМ: **Виртуальные машины** → ваша ВМ → **Сетевые интерфейсы** → привязка IP.

---

## 5. Подключение по SSH

### Шаг 5.1. Команда подключения

В терминале на вашем компьютере:

```bash
ssh ubuntu@<ПУБЛИЧНЫЙ_IP_ВМ>
```

Пример: `ssh ubuntu@185.xxx.xxx.xxx`

Для Ubuntu-образа логин обычно `ubuntu`. Если использовали другой образ (например, Debian) — логин может быть `admin` или `debian`. Проверьте в документации к образу.

### Шаг 5.2. Первый вход

При первом подключении:

```
The authenticity of host '...' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Введите `yes` и нажмите Enter.

### Шаг 5.3. Проверка

Приглашение в консоли будет вида:

```
ubuntu@mathcalc-backend:~$
```

---

## 6. Установка Node.js

### Шаг 6.1. Установка nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### Шаг 6.2. Загрузка nvm

```bash
source ~/.bashrc
```

Или для zsh: `source ~/.zshrc`

### Шаг 6.3. Установка Node.js 20

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Шаг 6.4. Проверка

```bash
node -v   # v20.x.x
npm -v
```

---

## 7. Клонирование и сборка проекта

### Шаг 7.1. Установка Git

```bash
sudo apt update
sudo apt install -y git
```

### Шаг 7.2. SSH-ключ для GitHub (если репозиторий приватный)

```bash
ssh-keygen -t ed25519 -C "your_email@example.com" -f ~/.ssh/id_github -N ""
cat ~/.ssh/id_github.pub
```

Добавьте ключ в GitHub: **Settings** → **SSH and GPG keys** → **New SSH key**.

```bash
echo 'Host github.com
  HostName github.com
  User git
  IdentityFile ~/.ssh/id_github' >> ~/.ssh/config
chmod 600 ~/.ssh/config
```

### Шаг 7.3. Клонирование

```bash
cd ~
git clone git@github.com:Edgarok1991/math-stat-calculator.git
cd math-stat-calculator/calculator/backend
```

Или через HTTPS: `git clone https://github.com/Edgarok1991/math-stat-calculator.git`

### Шаг 7.4. Установка и сборка

```bash
npm ci
nano .env   # создайте и заполните (см. раздел 8)
npx prisma generate
npx prisma db push
npm run build
```

---

## 8. Настройка .env на сервере

### Шаг 8.1. Создание файла

```bash
nano ~/math-stat-calculator/calculator/backend/.env
```

### Шаг 8.2. Содержимое

```env
# Supabase (из локального .env)
DATABASE_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"
DIRECT_URL="postgres://prisma.[PROJECT-REF]:[PASSWORD]@aws-0-[REGION].pooler.supabase.com:5432/postgres"

# JWT (новый для production!)
JWT_SECRET="сгенерируйте-ключ-openssl-rand-base64-32"
JWT_EXPIRATION="7d"

# App
PORT=3001
NODE_ENV=production

# Frontend (Vercel)
FRONTEND_URL="https://ваш-проект.vercel.app"
APP_URL="https://ваш-проект.vercel.app"

# SMTP Yandex
SMTP_HOST=smtp.yandex.ru
SMTP_PORT=587
SMTP_USER=ваш_email@yandex.ru
SMTP_PASS=пароль_приложения
```

### Шаг 8.3. Генерация JWT_SECRET

```bash
openssl rand -base64 32
```

Скопируйте вывод в `JWT_SECRET`.

### Шаг 8.4. Сохранение в nano

- `Ctrl+O` → Enter → `Ctrl+X`

---

## 9. Запуск через PM2

### Шаг 9.1. Установка PM2

```bash
sudo npm install -g pm2
```

### Шаг 9.2. Запуск

```bash
cd ~/math-stat-calculator/calculator/backend
pm2 start dist/main.js --name mathcalc-api
```

### Шаг 9.3. Автозапуск при перезагрузке

```bash
pm2 startup
```

Выполните команду, которую выведет PM2. Затем:

```bash
pm2 save
```

### Шаг 9.4. Проверка

```bash
pm2 status
pm2 logs mathcalc-api
```

---

## 10. Открытие порта в firewall

### Вариант A: Группа безопасности в Cloud.ru

1. **Инфраструктура** → **Группы безопасности**.
2. Найдите группу, привязанную к ВМ.
3. Добавьте **Входящее правило**:
   - Порт: `3001`
   - Протокол: TCP
   - Источник: `0.0.0.0/0`

### Вариант B: UFW на сервере

```bash
sudo ufw allow 3001
sudo ufw allow 22
sudo ufw enable
```

---

## 11. Проверка работы

### Шаг 11.1. Проверка API

В браузере откройте:

```
http://<ПУБЛИЧНЫЙ_IP>:3001
```

Должен вернуться JSON (приветствие API).

### Шаг 11.2. Настройка Vercel

1. Vercel → проект → **Settings** → **Environment Variables**.
2. Добавьте `NEXT_PUBLIC_API_URL` = `http://<ПУБЛИЧНЫЙ_IP>:3001`.
3. **Deployments** → **Redeploy**.

---

## 12. Обновление backend

```bash
cd ~/math-stat-calculator
git pull
cd calculator/backend
npm ci
npx prisma generate
npx prisma db push   # при изменении схемы
npm run build
pm2 restart mathcalc-api
```

---

## 13. Частые ошибки и решения

### Ошибка: "Permission denied (publickey)"

**Решение**: Проверьте, что SSH-ключ добавлен в Cloud.ru и выбран при создании ВМ. Для существующей ВМ ключ добавляется только через консоль в гостевой ОС.

---

### Ошибка: "Connection refused" к API

**Решение**: Проверьте группу безопасности (порт 3001), UFW, `pm2 status`.

---

### Ошибка: "Can't reach database server"

**Решение**: Проверьте `.env` (Supabase), что проект не приостановлен, используйте Session pooler.

---

### Публичный IP не назначается

**Решение**: Убедитесь, что баланс положительный. Публичный IP тарифицируется отдельно.

---

### Free tier недоступен

**Решение**: Баланс должен быть положительным. Привяжите карту для получения 4000 бонусов.

---

## Сводка: отличия от Яндекс Облака

| Параметр | Cloud.ru | Яндекс Облако |
|----------|----------|---------------|
| **Регион** | Россия | Россия |
| **Free tier** | 1 ВМ: 2 vCPU, 4 ГБ RAM, 30 ГБ | Платно (грант) |
| **Публичный IP** | Платный (~4–5 ₽/день) | Включён в ВМ |
| **Консоль** | console.cloud.ru | console.cloud.yandex.ru |
| **Бонусы** | 4000 ₽ при привязке карты | Стартовый грант (если есть) |

---

## Полезные ссылки

- [Личный кабинет](https://console.cloud.ru)
- [Free Tier](https://cloud.ru/offers/free-tier)
- [Документация Cloud.ru](https://cloud.ru/docs)
- [Создание бесплатной ВМ](https://cloud.ru/docs/virtual-machines/ug/topics/guides__create-free-tier-vm)
