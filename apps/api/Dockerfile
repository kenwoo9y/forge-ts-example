# syntax=docker/dockerfile:1
# Build context: monorepo root (docker build -f apps/api/Dockerfile .)

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:26-slim AS installer
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/api/package.json ./apps/api/
COPY packages/db/package.json ./packages/db/
COPY packages/error/package.json ./packages/error/
COPY packages/schema/package.json ./packages/schema/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM installer AS builder
WORKDIR /app

# Copy source files for all packages used by the API
COPY packages/db/prisma ./packages/db/prisma
COPY packages/db/prisma.config.ts ./packages/db/prisma.config.ts
COPY packages/error/src ./packages/error/src
COPY packages/error/tsconfig.json ./packages/error/tsconfig.json
COPY packages/schema/src ./packages/schema/src
COPY packages/schema/tsconfig.json ./packages/schema/tsconfig.json
COPY apps/api/src ./apps/api/src
COPY apps/api/tsconfig.json ./apps/api/tsconfig.json

# Generate Prisma client for the target platform
RUN pnpm --filter db generate

# Build packages in dependency order (turbo: ^build)
RUN pnpm --filter error build
RUN pnpm --filter schema build
RUN pnpm --filter api build

# Create a self-contained deployment bundle (resolves workspace:* deps)
RUN pnpm --filter api --prod deploy /app/deploy

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:26-slim AS runner
WORKDIR /app

# Prisma's query engine binary links against libssl
RUN apt-get update -y && apt-get install -y --no-install-recommends libssl3 && rm -rf /var/lib/apt/lists/*

# Run as non-root for security
RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs apiuser
USER apiuser

COPY --from=builder --chown=apiuser:nodejs /app/deploy ./

EXPOSE 3000
CMD ["node", "dist/index.js"]
