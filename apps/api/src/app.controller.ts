import { Controller, Get } from "@nestjs/common";
import { sql } from "drizzle-orm";
import type { HealthStatus } from "@thanks-claude/shared-types";
import { db } from "./db/client";

@Controller()
export class AppController {
  @Get("health")
  async getHealth(): Promise<HealthStatus> {
    await db.execute(sql`select 1`);
    return { status: "ok" };
  }
}
