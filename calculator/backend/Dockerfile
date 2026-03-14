FROM node:20-alpine

WORKDIR /app

# Копируем package files
COPY package*.json ./
COPY prisma ./prisma/

# Устанавливаем зависимости (включая dev для сборки)
RUN npm ci

# Генерируем Prisma Client
RUN npx prisma generate

# Копируем исходный код
COPY . .

# Сборка
RUN npm run build

# Удаляем dev зависимости для production
RUN npm prune --production

EXPOSE 3001

# Синхронизация схемы с БД при старте (создаёт таблицы при первом запуске)
CMD ["sh", "-c", "npx prisma db push && node dist/main.js"]
