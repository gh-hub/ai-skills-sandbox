import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { LikesController } from "./likes.controller";
import { LikesService } from "./likes.service";
import { LikesRepository } from "./likes.repository";

@Module({
  imports: [DbModule],
  controllers: [LikesController],
  providers: [LikesService, LikesRepository],
})
export class LikesModule {}
