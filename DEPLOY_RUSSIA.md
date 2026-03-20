# Деплой в России (альтернативы Neon и Render)

Neon и Render недоступны или заблокированы в РФ. Варианты ниже.

---

## Вариант 1: Supabase (БД) + Vercel (backend через Serverless)

**Supabase** — бесплатный PostgreSQL. Часто доступен из России.

1. [supabase.com](https://supabase.com) → Sign up
2. New Project → скопируйте **Connection string** (URI)
3. Формат: `postgresql://postgres:[PASSWORD]@[HOST]:5432/postgres`

⚠️ **Ограничение:** Render не открывается. Backend нужно размещать в другом месте.

---

## Вариант 2: Российские облака

### Yandex Cloud (яндекс.облако)

- [cloud.yandex.ru](https://cloud.yandex.ru)
- Есть бесплатный грант для новых пользователей
- **Managed Service for PostgreSQL** — управляемая БД
- **Compute Cloud** — виртуальные машины для backend

### Timeweb Cloud

- [timeweb.cloud](https://timeweb.cloud)
- PostgreSQL от ~790 ₽/мес
- Облачные серверы для Node.js
- Работает в России

### Selectel

- [selectel.ru](https://selectel.ru)
- PostgreSQL в облаке
- Бонус 30 000 ₽ новым клиентам на тест

---

## Вариант 3: Backend на Vercel (Serverless)

Можно перенести API в **Vercel Serverless Functions** — тогда всё будет на Vercel, без Render.

**Плюсы:** один хостинг, работает в РФ  
**Минусы:** нужна переработка NestJS под serverless (API Routes или отдельные функции)

---

## Вариант 4: Локальный сервер / VPS

Размещение на своём компьютере или VPS (Timeweb, Selectel, Beget и т.п.):

- Backend: `npm run start:prod`
- PostgreSQL: Docker или установленный сервер
- Nginx как reverse proxy
- Доступ по домену или IP

---

## Рекомендация

1. **Попробовать Supabase** — если открывается, использовать для БД.
2. **Backend:** Yandex Cloud Compute или Timeweb VPS (платно, но доступно в РФ).
3. **Бесплатный вариант:** Supabase + переписать backend на Vercel Serverless (больше работы).
