FROM oven/bun:1.3.9-alpine AS base
WORKDIR /app

FROM base AS dependencies
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/starter/package.json apps/starter/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile --filter express-template

FROM dependencies AS build
COPY apps/backend apps/backend
COPY packages/types packages/types
RUN bun run --cwd apps/backend build

FROM base AS production-dependencies
COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/starter/package.json apps/starter/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile --production --filter express-template

FROM oven/bun:1.3.9-alpine AS runtime
WORKDIR /app
ENV NODE_ENV=production
ENV PORT=3333

COPY --from=production-dependencies --chown=bun:bun /app/node_modules ./node_modules
COPY --from=build --chown=bun:bun /app/apps/backend ./apps/backend
COPY --from=build --chown=bun:bun /app/packages/types ./packages/types

WORKDIR /app/apps/backend
USER bun
EXPOSE 3333
HEALTHCHECK --interval=30s --timeout=3s --start-period=10s --retries=3 \
  CMD ["bun", "-e", "fetch('http://127.0.0.1:' + (process.env.PORT || '3333') + '/api/health-check').then((response) => { if (!response.ok) process.exit(1); }).catch(() => process.exit(1));"]
CMD ["bun", "run", "start"]
