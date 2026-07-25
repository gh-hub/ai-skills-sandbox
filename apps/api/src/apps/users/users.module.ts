import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { UsersRepository } from "./users.repository";

@Module({
  imports: [DbModule],
  providers: [UsersRepository],
  exports: [UsersRepository],
})
export class UsersModule {}
