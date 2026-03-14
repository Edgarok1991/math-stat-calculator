# Инструкции по запуску

## Быстрый запуск

```bash
# Установка всех зависимостей
npm run install:all

# Запуск приложения
./start.sh
```

## Ручной запуск

### 1. Установка зависимостей

```bash
# Установка зависимостей для всего проекта
npm install

# Установка зависимостей frontend
cd frontend
npm install

# Установка зависимостей backend
cd ../backend
npm install
```

### 2. Запуск backend

```bash
cd backend
npm run start:dev
```

Backend будет доступен на http://localhost:3001

### 3. Запуск frontend

```bash
cd frontend
npm run dev
```

Frontend будет доступен на http://localhost:3000

## Структура проекта

```
calculator/
├── frontend/          # Next.js приложение
│   ├── src/
│   │   ├── app/       # Страницы приложения
│   │   ├── components/ # React компоненты
│   │   ├── stores/    # MobX хранилища
│   │   ├── services/  # API сервисы
│   │   └── types/     # TypeScript типы
│   └── package.json
├── backend/           # NestJS API
│   ├── src/
│   │   ├── regression/    # Регрессионный анализ
│   │   ├── clustering/    # Кластерный анализ
│   │   ├── anova/         # ANOVA
│   │   ├── matrices/      # Работа с матрицами
│   │   └── calculus/      # Математический анализ
│   └── package.json
└── start.sh           # Скрипт запуска
```

## Функциональность

### Регрессионный анализ
- Линейная регрессия
- Полиномиальная регрессия
- Экспоненциальная регрессия

### Кластерный анализ
- K-means кластеризация
- Иерархическая кластеризация

### Дисперсионный анализ (ANOVA)
- F-тест для сравнения групп
- Различные уровни значимости

### Работа с матрицами
- Решение систем линейных уравнений методом Гаусса
- Вычисление обратной матрицы
- Вычисление определителя
- Умножение матрицы на вектор

### Математический анализ
- Вычисление производных
- Вычисление интегралов (определенных и неопределенных)

## Технологии

### Frontend
- Next.js 14 с App Router
- React 18
- TypeScript
- Tailwind CSS
- MobX для управления состоянием
- Framer Motion для анимаций
- React Hook Form для форм
- Zod для валидации

### Backend
- NestJS
- TypeScript
- mathjs для математических вычислений
- class-validator для валидации
- CORS для кросс-доменных запросов

## API Endpoints

- `POST /regression/calculate` - Регрессионный анализ
- `POST /clustering/calculate` - Кластерный анализ
- `POST /anova/calculate` - ANOVA
- `POST /matrices/gauss` - Метод Гаусса
- `POST /matrices/inverse` - Обратная матрица
- `POST /matrices/determinant` - Определитель
- `POST /matrices/multiply` - Умножение на вектор
- `POST /calculus/derivative` - Производная
- `POST /calculus/integral` - Интеграл
