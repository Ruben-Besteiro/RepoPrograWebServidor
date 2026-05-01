# Dockerfile
# Multi-stage build: compilar TS en build stage, ejecutar JS en producción

# ---- Stage 1: Build ----
FROM node:22-alpine AS builder

WORKDIR /app

# Instalar TODAS las dependencias (incluye devDeps con tsc/tsx)
COPY package*.json ./
RUN npm ci

# Copiar fuentes y compilar
COPY tsconfig.json ./
COPY tsconfig.build.json ./
COPY src ./src
RUN npx tsc --project tsconfig.build.json

# ---- Stage 2: Production ----
FROM node:22-alpine

WORKDIR /app

# Solo dependencias de producción
COPY package*.json ./
RUN npm ci --only=production

# Copiar JS compilado desde el stage anterior
COPY --from=builder /app/dist ./dist

# Puerto que expone la app (Railway lo sobreescribe con $PORT)
EXPOSE 3000

# Usuario no-root por seguridad
USER node

# Comando de arranque
CMD ["node", "dist/app.js"]