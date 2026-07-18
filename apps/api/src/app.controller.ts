import { Controller, Get, Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { HealthStatus } from "@thanks-claude/shared-types";
import { DATABASE_CONNECTION } from "./db/db.module";
import type { db as Database } from "./db/client";

@Controller()
export class AppController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: typeof Database) {}

  @Get("health")
  async getHealth(): Promise<HealthStatus> {
    await this.db.execute(sql`select 1`);
    return { status: "ok" };
  }
}
