# Development and production Dockerfile for ai-coding-starter-kit
# ================================================================
# Usage:
#   Development: docker compose up dev
#   Production:  docker compose up prod

FROM node:20-alpine AS base

RUN apk add --no-cache git curl

WORKDIR /app

# -------------------------------------------
# Development stage – hot-reload mit next dev
# -------------------------------------------
FROM base AS dev

# Dependencies zuerst kopieren (Layer-Caching)
COPY package.json package-lock.json ./
RUN npm ci

# Source wird per Volume gemountet (siehe docker-compose.yml),
# daher kein COPY des restlichen Codes nötig.

EXPOSE 3000

CMD ["npm", "run", "dev"]

# -------------------------------------------
# Production build stage
# -------------------------------------------
FROM base AS builder

COPY package.json package-lock.json ./
RUN npm ci

COPY . .
RUN npm run build

# -------------------------------------------
# Production runtime stage
# -------------------------------------------
FROM base AS prod

ENV NODE_ENV=production

COPY --from=builder /app/package.json /app/package-lock.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/next.config.ts ./

EXPOSE 3000

CMD ["npm", "run", "start"]
