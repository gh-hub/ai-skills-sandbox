import { Controller, Get, Inject } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { HealthStatus } from "@thanks-claude/shared-types";
import { DATABASE_CONNECTION, type DbClient } from "./db/db.module";

@Controller()
export class AppController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

  @Get("health")
  async getHealth(): Promise<HealthStatus> {
    await this.db.execute(sql`select 1`);
    return { status: "ok" };
  }
}
