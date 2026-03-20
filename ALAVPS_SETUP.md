# Подробная настройка AlaVPS для MathCalc

Пошаговая инструкция по развёртыванию NestJS backend на бесплатном VPS в AlaVPS. **Без привязки банковской карты** — только верификация email.

В том же стиле, что и [SUPABASE_SETUP.md](./SUPABASE_SETUP.md), [YANDEX_CLOUD_SETUP.md](./YANDEX_CLOUD_SETUP.md) и [CLOUD_RU_SETUP.md](./CLOUD_RU_SETUP.md).

---

## Содержание

1. [Регистрация](#1-регистрация)
2. [Заказ бесплатного VPS](#2-заказ-бесплатного-vps)
3. [Получение учётных данных](#3-получение-учётных-данных)
4. [Подключение по SSH](#4-подключение-по-ssh)
5. [Установка Node.js](#5-установка-nodejs)
6. [Клонирование и сборка проекта](#6-клонирование-и-сборка-проекта)
7. [Настройка .env на сервере](#7-настройка-env-на-сервере)
8. [Запуск через PM2](#8-запуск-через-pm2)
9. [Открытие порта в firewall](#9-открытие-порта-в-firewall)
10. [Проверка работы](#10-проверка-работы)
11. [Обновление backend](#11-обновление-backend)
12. [Частые ошибки и решения](#12-частые-ошибки-и-решения)

---

## 1. Регистрация

### Шаг 1.1. Откройте портал AlaVPS

1. Перейдите на **[manage.alavps.com](https://manage.alavps.com)**.
2. Нажмите **Register** или **Sign Up** (если видите форму входа).

### Шаг 1.2. Заполнение формы регистрации

Заполните поля:

| Поле | Описание |
|------|----------|
| **Email** | Ваш email — на него придёт подтверждение и данные VPS |
| **Password** | Надёжный пароль (сохраните его) |
| **First Name** | Имя |
| **Last Name** | Фамилия |
| **Country** | Страна |

Другие поля (адрес, телефон) — заполните по необходимости, если обязательны.

### Шаг 1.3. Подтверждение email

1. Проверьте почту — должно прийти письмо от AlaVPS.
2. Перейдите по ссылке подтверждения в письме.
3. После подтверждения войдите в личный кабинет.

### Шаг 1.4. Важно

- **Карта не требуется** — AlaVPS не запрашивает платёжные данные для бесплатного VPS.
- Бесплатный VPS может быть **ограничен по сроку** (например, 1–3–6 месяцев) — уточняйте на сайте.
- Ресурсы предоставляются по принципу **fair use** — майнинг, спам и злоупотребления запрещены.

---

## 2. Заказ бесплатного VPS

### Шаг 2.1. Открыть страницу Free VPS

Перейдите по ссылке:

**[manage.alavps.com/index.php?rp=/store/free-vps-hosting](https://manage.alavps.com/index.php?rp=/store/free-vps-hosting)**

Или через сайт: [alavps.com](https://alavps.com) → **Get Free VPS Now** / **Claim Your Free VPS**.

### Шаг 2.2. Выбор пакета

На странице Free VPS Hosting отображается конфигурация:

| Ресурс | Значение |
|--------|----------|
| **vCPU** | 2 (AMD Ryzen) |
| **RAM** | 8 ГБ DDR5 |
| **Диск** | 128 ГБ NVMe SSD |
| **Трафик** | 20 ТБ (fair use) |
| **Доступ** | Root / Administrator |
| **Виртуализация** | KVM |

Нажмите **Order** / **Add to Cart** / **Get Free VPS** (в зависимости от интерфейса).

### Шаг 2.3. Настройка заказа

В форме заказа укажите:

| Поле | Рекомендация | Описание |
|------|--------------|----------|
| **ОС** | Ubuntu 22.04 LTS | Или Debian, AlmaLinux |
| **Локация** | Ближайший дата-центр | Выберите регион для меньшей задержки |
| **Billing Cycle** | Free / Trial | Обычно один вариант для бесплатного плана |

### Шаг 2.4. Оформление

1. Проверьте заказ — сумма должна быть **$0**.
2. Нажмите **Complete Order** / **Checkout** / **Submit**.
3. Подтвердите заказ (если потребуется).

### Шаг 2.5. Активация

- Активация обычно **мгновенная** или в течение нескольких минут.
- Учётные данные приходят на email, указанный при регистрации.

---

## 3. Получение учётных данных

### Шаг 3.1. Письмо от AlaVPS

На email придёт письмо с данными для доступа к VPS:

- **IP-адрес** (например, `185.xxx.xxx.xxx`)
- **Username** (часто `root`)
- **Password** (пароль для SSH)

Сохраните эти данные — они понадобятся для подключения.

### Шаг 3.2. Альтернатива: личный кабинет

Если письма нет:

1. Войдите в [manage.alavps.com](https://manage.alavps.com).
2. Откройте раздел **Services** / **My Services** / **VPS**.
3. Выберите ваш VPS — там должны быть IP, логин и возможность сбросить пароль.

### Шаг 3.3. Логин по умолчанию

Для Linux-образов (Ubuntu, Debian, AlmaLinux) логин обычно **root**. Для некоторых образов может быть **ubuntu** или **admin** — смотрите в письме или в панели управления.

---

## 4. Подключение по SSH

### Шаг 4.1. Открыть терминал

На Mac или Linux откройте **Терминал**.

### Шаг 4.2. Команда подключения

```bash
ssh root@<IP_АДРЕС_СЕРВЕРА>
```

Замените `<IP_АДРЕС_СЕРВЕРА>` на IP из письма.

**Пример:**
```bash
ssh root@185.123.45.67
```

Если логин не `root`, используйте указанный в письме:
```bash
ssh ubuntu@185.123.45.67
```

### Шаг 4.3. Ввод пароля

При запросе пароля введите пароль из письма. Символы при вводе не отображаются — это нормально.

### Шаг 4.4. Первый вход — fingerprint

При первом подключении может появиться:

```
The authenticity of host '...' can't be established.
Are you sure you want to continue connecting (yes/no)?
```

Введите `yes` и нажмите Enter.

### Шаг 4.5. Проверка

Вы должны оказаться в shell на сервере. Приглашение будет вида:

```
root@hostname:~#
```

или

```
ubuntu@hostname:~$
```

---

## 5. Установка Node.js

### Шаг 5.1. Обновление пакетов (рекомендуется)

```bash
apt update && apt upgrade -y
```

### Шаг 5.2. Установка nvm

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash
```

### Шаг 5.3. Загрузка nvm

```bash
source ~/.bashrc
```

Или для zsh: `source ~/.zshrc`

### Шаг 5.4. Установка Node.js 20

```bash
nvm install 20
nvm use 20
nvm alias default 20
```

### Шаг 5.5. Проверка

```bash
node -v   # v20.x.x
npm -v
```

---

## 6. Клонирование и сборка проекта

### Шаг 6.1. Установка Git

```bash
apt install -y git
```

### Шаг 6.2. SSH-ключ для GitHub (если репозиторий приватный)

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

### Шаг 6.3. Клонирование

```bash
cd ~
git clone git@github.com:Edgarok1991/math-stat-calculator.git
cd math-stat-calculator/calculator/backend
```

Или через HTTPS: `git clone https://github.com/Edgarok1991/math-stat-calculator.git`

### Шаг 6.4. Установка и сборка

```bash
npm ci
nano .env   # создайте и заполните (см. раздел 7)
npx prisma generate
npx prisma db push
npm run build
```

---

## 7. Настройка .env на сервере

### Шаг 7.1. Создание файла

```bash
nano ~/math-stat-calculator/calculator/backend/.env
```

### Шаг 7.2. Содержимое

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

### Шаг 7.3. Генерация JWT_SECRET

```bash
openssl rand -base64 32
```

Скопируйте вывод в `JWT_SECRET`.

### Шаг 7.4. Сохранение в nano

- `Ctrl+O` → Enter → `Ctrl+X`

---

## 8. Запуск через PM2

### Шаг 8.1. Установка PM2

```bash
npm install -g pm2
```

Если нужны права root: `sudo npm install -g pm2`

### Шаг 8.2. Запуск

```bash
cd ~/math-stat-calculator/calculator/backend
pm2 start dist/main.js --name mathcalc-api
```

### Шаг 8.3. Автозапуск при перезагрузке

```bash
pm2 startup
```

Выполните команду, которую выведет PM2. Затем:

```bash
pm2 save
```

### Шаг 8.4. Проверка

```bash
pm2 status
pm2 logs mathcalc-api
```

---

## 9. Открытие порта в firewall

### Шаг 9.1. UFW (если установлен)

```bash
ufw allow 3001
ufw allow 22
ufw enable
```

При запросе подтверждения введите `y`.

### Шаг 9.2. iptables (если UFW нет)

```bash
iptables -A INPUT -p tcp --dport 3001 -j ACCEPT
iptables -A INPUT -p tcp --dport 22 -j ACCEPT
```

### Шаг 9.3. Проверка

```bash
ufw status
# или
iptables -L -n
```

---

## 10. Проверка работы

### Шаг 10.1. Проверка API

В браузере откройте:

```
http://<IP_АДРЕС_СЕРВЕРА>:3001
```

Должен вернуться JSON (приветствие API).

### Шаг 10.2. Настройка Vercel

1. Vercel → проект → **Settings** → **Environment Variables**.
2. Добавьте `NEXT_PUBLIC_API_URL` = `http://<IP_АДРЕС_СЕРВЕРА>:3001`.
3. **Deployments** → **Redeploy**.

---

## 11. Обновление backend

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

## 12. Частые ошибки и решения

### Ошибка: "Permission denied (publickey)" или "Permission denied (password)"

**Решение**:
- Проверьте логин: обычно `root`, реже `ubuntu` или `admin`.
- Проверьте пароль — скопируйте из письма без лишних пробелов.
- Убедитесь, что SSH на порту 22: `ssh -p 22 root@IP`.

---

### Ошибка: "Connection refused" к API

**Решение**:
- Проверьте `pm2 status` — процесс должен быть `online`.
- Проверьте UFW/iptables — порт 3001 должен быть открыт.
- Убедитесь, что backend слушает `0.0.0.0`, а не только `127.0.0.1`.

---

### Ошибка: "Can't reach database server"

**Решение**: Проверьте `.env` (Supabase), что проект не приостановлен, используйте Session pooler.

---

### Письмо с данными не пришло

**Решение**:
- Проверьте папку «Спам».
- Войдите в [manage.alavps.com](https://manage.alavps.com) → **Services** → ваш VPS — данные могут быть там.
- Напишите в поддержку AlaVPS через тикет-систему.

---

### Спецификации отличаются от заявленных

AlaVPS указывает, что ресурсы Free VPS могут варьироваться по локациям. Фактические параметры смотрите в письме или в панели управления.

---

## Сводка: AlaVPS vs другие платформы

| Параметр | AlaVPS | Cloud.ru | Яндекс Облако |
|----------|--------|----------|---------------|
| **Карта** | Не нужна | Нужна | Нужна |
| **Ресурсы** | 2 vCPU, 8 ГБ, 128 ГБ | 2 vCPU, 4 ГБ, 30 ГБ | Платно |
| **Логин** | root (часто) | ubuntu | ubuntu |
| **Публичный IP** | Включён | Платный | Включён |

---

## Полезные ссылки

- [AlaVPS](https://alavps.com)
- [Портал управления](https://manage.alavps.com)
- [Free VPS Hosting](https://manage.alavps.com/index.php?rp=/store/free-vps-hosting)
- [Блог AlaVPS](https://alavps.com/blog/)
