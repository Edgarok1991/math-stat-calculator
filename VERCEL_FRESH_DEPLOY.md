# Удаление и новый деплой на Vercel

## Шаг 1: Удалить проект

1. Откройте [vercel.com/dashboard](https://vercel.com/dashboard)
2. Выберите проект **math-stat-calculator**
3. **Settings** → прокрутите вниз до **Delete Project**
4. Введите название проекта `math-stat-calculator` для подтверждения
5. Нажмите **Delete**

## Шаг 2: Новый деплой

1. На главной странице Vercel нажмите **Add New** → **Project**
2. Выберите **Import Git Repository**
3. Найдите **Edgarok1991/math-stat-calculator** и нажмите **Import**
4. Настройки (оставьте по умолчанию):
   - **Framework Preset:** Next.js (автоопределение)
   - **Root Directory:** оставьте **пустым**
   - **Build Command:** `npm run build` (по умолчанию)
   - **Output Directory:** (пусто, Next.js сам определит)
5. Нажмите **Deploy**

## Шаг 3: Дождаться сборки

Сборка займёт 1–3 минуты. После успешного деплоя сайт будет доступен по ссылке вида `math-stat-calculator-xxx.vercel.app`.
