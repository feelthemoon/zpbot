# Используем Node.js 18 как базовый образ
FROM node:22-alpine AS base

# Для корректной работы prisma
RUN apk add --no-cache libc6-compat openssl git bash

# Создаем рабочую директорию
WORKDIR /app

COPY ./prisma ./prisma

# Копируем файлы package.json и package-lock.json
COPY package*.json ./

# Устанавливаем зависимости
RUN npm ci

# Копируем исходный код
COPY . .

# Генерируем Prisma клиент
RUN npx prisma generate

# Собираем приложение
RUN npm run build

# Запускаем бота
CMD ["npm", "start"] 