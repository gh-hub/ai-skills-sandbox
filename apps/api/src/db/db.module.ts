import { Global, Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Env } from "../config/env.schema";
import { createDbClient, type DbClient } from "./client";

export const DATABASE_CONNECTION = "DATABASE_CONNECTION";

export type { DbClient };

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_CONNECTION,
      useFactory: (configService: ConfigService<Env, true>) =>
        createDbClient(configService.get("DATABASE_URL")),
      inject: [ConfigService],
    },
  ],
  exports: [DATABASE_CONNECTION],
})
export class DbModule {}
