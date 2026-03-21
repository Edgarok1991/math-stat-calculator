This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://nextjs.org/docs/app/api-reference/cli/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## История вычислений (локальная настройка)

Для сохранения истории нужны PostgreSQL и бэкенд:

```bash
# Один раз — полная настройка (Docker, .env, Prisma)
npm run setup

# Запуск PostgreSQL (если Docker не был запущен)
cd calculator && docker-compose up -d
cd backend && npx prisma db push

# Запуск всего проекта
npm run dev:all
# Или отдельно: npm run dev:backend (бэкенд) и npm run dev (фронт)
```

После входа в аккаунт (/auth) расчёты ANOVA и кластеризации сохраняются в историю.

## Photo Math (распознавание по фото)

На странице **Калькулятор → Photo Math** можно:
- Сфотографировать пример камерой телефона
- Загрузить фото с устройства
- Поддержка: арифметика, производные, интегралы

**Улучшенное распознавание** (опционально): добавьте в `calculator/backend/.env`:
```bash
MATHPIX_APP_ID=your_app_id
MATHPIX_APP_KEY=your_app_key
```
Ключи: [mathpix.com](https://mathpix.com) → Sign up → API. Без ключей используется встроенный Tesseract.

## Автодеплой в Git

**Post-commit хук** (устанавливается при `npm install`): после каждого `git commit` автоматически выполняется `git push origin main`.

**Полный автодеплой** — коммит и push при каждом изменении файлов:

```bash
npm run auto-deploy
```

Скрипт отслеживает `src/`, `public/` и конфиги. После 10 секунд без изменений выполняется `git add`, `git commit` и `git push`.

**Ручной деплой:** `npm run deploy -- "сообщение коммита"`

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
