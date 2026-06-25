# ── frontend/Dockerfile ────────────────────────────────────────────────────────
# Build multi-stage para Next.js com suporte a standalone output.
# Etapa 1 (deps): instala dependências.
# Etapa 2 (builder): gera o build otimizado.
# Etapa 3 (runner): imagem final mínima (Node Alpine).
# ──────────────────────────────────────────────────────────────────────────────

# Etapa 1 — Dependências
FROM node:22-alpine AS deps
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci --prefer-offline

# Etapa 2 — Builder
FROM node:22-alpine AS builder
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Variáveis de build (sobrescrevidas pelo docker-compose)
ARG NEXT_PUBLIC_API_URL=http://localhost:8000
ENV NEXT_PUBLIC_API_URL=$NEXT_PUBLIC_API_URL

RUN npm run build

# Etapa 3 — Runner (imagem de produção mínima)
FROM node:22-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production

# Copiar apenas os artefatos necessários
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static

EXPOSE 3000

# Necessário para standalone output do Next.js
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
