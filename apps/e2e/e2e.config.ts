// Runs e2e against its own docker compose project, ports, and database so it never collides
// with a dev stack already running via the root docker-compose.yml on its default ports/project.
// Values come from .env.e2e (also passed to `docker compose --env-file` so the compose file's
// own ${WEB_PORT}-style substitutions match what Playwright expects).

import path from "node:path";
import { config as loadEnvFile } from "dotenv";

loadEnvFile({ path: path.resolve(__dirname, ".env.e2e") });

export const PROJECT_NAME = process.env.E2E_COMPOSE_PROJECT ?? "thanks-claude-e2e";
export const WEB_PORT = process.env.WEB_PORT ?? "8082";
export const POSTGRES_PORT = process.env.POSTGRES_PORT ?? "5434";
export const POSTGRES_DB = process.env.POSTGRES_DB ?? "thanks_claude_e2e";
export const POSTGRES_USER = process.env.POSTGRES_USER ?? "thanks_claude";
export const POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD ?? "thanks_claude";

export const COMPOSE_ARGS = ["compose", "--env-file", path.resolve(__dirname, ".env.e2e"), "-p", PROJECT_NAME];

export const COMPOSE_ENV = {
  ...process.env,
  WEB_PORT,
  POSTGRES_PORT,
  POSTGRES_DB,
  POSTGRES_USER,
  POSTGRES_PASSWORD,
};
