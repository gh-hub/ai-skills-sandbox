FROM node:22-alpine AS build

WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/web/package.json apps/web/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile

COPY packages/shared-types packages/shared-types
COPY apps/web apps/web

RUN pnpm --filter @thanks-claude/shared-types build
RUN pnpm --filter @thanks-claude/web build

FROM nginx:1.27-alpine

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /repo/apps/web/out /usr/share/nginx/html

EXPOSE 80
