import { Module } from "@nestjs/common";
import { DbModule } from "../../db/db.module";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { RolesRepository } from "./roles.repository";

@Module({
  imports: [DbModule],
  controllers: [RolesController],
  providers: [RolesService, RolesRepository],
  exports: [RolesRepository],
})
export class RolesModule {}
