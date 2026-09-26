FROM oven/bun:1.3.9-alpine AS dependencies
WORKDIR /app

COPY package.json bun.lock ./
COPY apps/backend/package.json apps/backend/package.json
COPY apps/starter/package.json apps/starter/package.json
COPY packages/core/package.json packages/core/package.json
COPY packages/eslint-config/package.json packages/eslint-config/package.json
COPY packages/types/package.json packages/types/package.json
COPY packages/typescript-config/package.json packages/typescript-config/package.json
RUN bun install --frozen-lockfile

FROM dependencies AS build
ARG VITE_API_BASE_URL
RUN test -n "$VITE_API_BASE_URL"
ENV VITE_API_BASE_URL=$VITE_API_BASE_URL

COPY apps/starter apps/starter
COPY packages/core packages/core
COPY packages/types packages/types
COPY packages/typescript-config packages/typescript-config
RUN bun run --cwd apps/starter build

FROM nginx:alpine AS runtime
COPY apps/starter/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/apps/starter/dist /usr/share/nginx/html

EXPOSE 80
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD wget -q -O - http://127.0.0.1/healthz >/dev/null || exit 1
