#!/bin/sh
set -e

pnpm exec drizzle-kit migrate
exec node dist/main.js
