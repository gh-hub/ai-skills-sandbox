import { Global, Module } from "@nestjs/common";
import { db } from "./client";

export const DATABASE_CONNECTION = "DATABASE_CONNECTION";

@Global()
@Module({
  providers: [{ provide: DATABASE_CONNECTION, useValue: db }],
  exports: [DATABASE_CONNECTION],
})
export class DbModule {}
