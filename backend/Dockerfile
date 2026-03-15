FROM node:22-alpine AS base
WORKDIR /app
COPY package*.json ./

# ── Desarrollo ──────────────────────────────
FROM base AS dev
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "npx prisma db push && npm run dev"]

# ── Producción ──────────────────────────────
FROM base AS prod
RUN npm install
COPY prisma ./prisma
RUN npx prisma generate
COPY . .
EXPOSE 3001
CMD ["sh", "-c", "npx prisma migrate deploy && npm run dev"]
