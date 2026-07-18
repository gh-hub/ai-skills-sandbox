FROM node:22-alpine

WORKDIR /repo
RUN corepack enable

COPY pnpm-workspace.yaml package.json pnpm-lock.yaml ./
COPY apps/api/package.json apps/api/package.json
COPY packages/shared-types/package.json packages/shared-types/package.json
RUN pnpm install --frozen-lockfile

COPY packages/shared-types packages/shared-types
COPY apps/api apps/api

RUN pnpm --filter @thanks-claude/shared-types build
RUN pnpm --filter @thanks-claude/api build

WORKDIR /repo/apps/api
RUN chmod +x entrypoint.sh

EXPOSE 3000
ENTRYPOINT ["./entrypoint.sh"]
