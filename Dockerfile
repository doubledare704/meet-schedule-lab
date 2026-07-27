FROM node:22-alpine AS base

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
RUN npm ci

COPY . .

RUN npx prisma generate

RUN npm run build

EXPOSE 3000

ENV PORT=3000
ENV NODE_ENV=production

CMD ["sh", "-c", "npx prisma migrate deploy && npm run start"]