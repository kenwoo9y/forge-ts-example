# syntax=docker/dockerfile:1
# Build context: monorepo root (docker build -f apps/web/Dockerfile .)

# ─── Stage 1: Install dependencies ───────────────────────────────────────────
FROM node:26-slim AS installer
WORKDIR /app

RUN corepack enable && corepack prepare pnpm@11.3.0 --activate

# Copy workspace manifests first for layer caching
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml ./
COPY apps/web/package.json ./apps/web/
COPY packages/auth/package.json ./packages/auth/
COPY packages/error/package.json ./packages/error/
COPY packages/schema/package.json ./packages/schema/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ───────────────────────────────────────────────────────────
FROM installer AS builder
WORKDIR /app

# Copy workspace package sources
COPY packages/auth/src ./packages/auth/src
COPY packages/auth/tsconfig.json ./packages/auth/tsconfig.json
COPY packages/error/src ./packages/error/src
COPY packages/error/tsconfig.json ./packages/error/tsconfig.json
COPY packages/schema/src ./packages/schema/src
COPY packages/schema/tsconfig.json ./packages/schema/tsconfig.json

# Build workspace packages in dependency order
RUN pnpm --filter auth build
RUN pnpm --filter error build
RUN pnpm --filter schema build

# Copy Next.js app source
COPY apps/web ./apps/web

# NEXT_PUBLIC_* vars are baked into the client bundle at build time.
# Pass them here if your app uses any (e.g. --build-arg NEXT_PUBLIC_API_URL=...).
ARG NEXT_PUBLIC_API_URL
ENV NEXT_PUBLIC_API_URL=${NEXT_PUBLIC_API_URL}

RUN pnpm --filter web build

# ─── Stage 3: Runtime ─────────────────────────────────────────────────────────
FROM node:26-slim AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

RUN addgroup --system --gid 1001 nodejs && adduser --system --uid 1001 --ingroup nodejs nextjs
USER nextjs

# standalone bundle already contains all server-side node_modules.
# The directory structure inside standalone mirrors the monorepo root.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/standalone ./

# Static assets must be copied separately alongside the standalone server.
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=builder --chown=nextjs:nodejs /app/apps/web/public ./apps/web/public

EXPOSE 3001

# server.js lives at apps/web/server.js inside the standalone bundle
CMD ["node", "apps/web/server.js"]
