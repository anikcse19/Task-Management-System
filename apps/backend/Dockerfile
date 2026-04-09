# ─── Stage 1: Install dependencies ──────────────────────
FROM node:22-alpine AS deps
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

# Copy workspace root files
COPY package.json pnpm-workspace.yaml pnpm-lock.yaml .npmrc ./
COPY apps/backend/package.json ./apps/backend/

RUN pnpm install --frozen-lockfile

# ─── Stage 2: Build ─────────────────────────────────────
FROM node:22-alpine AS builder
RUN corepack enable && corepack prepare pnpm@latest --activate
WORKDIR /app

COPY --from=deps /app/node_modules ./node_modules
COPY --from=deps /app/ ./

COPY . .

# Generate Prisma client (Prisma 7 — output to src/generated/prisma)
RUN cd apps/backend && npx prisma generate --config prisma.config.ts

# Build the NestJS app
RUN cd apps/backend && npx tsc -p tsconfig.json

# ─── Stage 3: Production ────────────────────────────────
FROM node:22-alpine AS runner
WORKDIR /app

# Copy all node_modules (includes @prisma/adapter-pg, pg, etc.)
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/prisma.config.ts ./apps/backend/
COPY --from=builder /app/apps/backend/package.json ./apps/backend/
COPY --from=builder /app/apps/backend/docker-entrypoint.sh ./apps/backend/

WORKDIR /app/apps/backend

RUN chmod +x docker-entrypoint.sh

EXPOSE 3001

CMD ["./docker-entrypoint.sh"]
