import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { AwardsController } from "./awards.controller";
import { AwardsService } from "./awards.service";
import { AwardsRepository } from "./awards.repository";

@Module({
  imports: [DbModule],
  controllers: [AwardsController],
  providers: [AwardsService, AwardsRepository],
})
export class AwardsModule {}
