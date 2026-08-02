ARG DB_PLACEHOLDER="postgresql://postgres:postgres@postgres:5432/meetscheduledb?schema=public"

FROM node:22-alpine AS deps
ARG DB_PLACEHOLDER
WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma/
COPY prisma.config.ts ./
ENV DATABASE_URL=$DB_PLACEHOLDER
RUN npm ci
RUN npx prisma generate

FROM deps AS builder
WORKDIR /app

COPY . .

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

FROM node:22-alpine AS runner
ARG DB_PLACEHOLDER
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 nextjs

COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static
COPY --from=builder --chown=nextjs:nodejs /app/public ./public
COPY --from=builder --chown=nextjs:nodejs /app/prisma ./prisma
COPY --from=builder --chown=nextjs:nodejs /app/prisma.config.ts ./
COPY package*.json ./

ENV DATABASE_URL=$DB_PLACEHOLDER
RUN npm ci --omit=dev && npm install --no-save --include=dev prisma@7.9.1 tsx@4.19.0 && npx prisma generate && npm cache clean --force

USER nextjs

EXPOSE 3000

CMD ["sh", "-c", "node node_modules/prisma/build/index.js migrate deploy && node server.js"]
