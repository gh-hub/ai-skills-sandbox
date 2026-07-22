import { Module } from "@nestjs/common";
import { DbModule } from "../db/db.module";
import { LikesController } from "./likes.controller";

@Module({
  imports: [DbModule],
  controllers: [LikesController],
})
export class LikesModule {}
