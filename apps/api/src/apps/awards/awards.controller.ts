import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import type { Award } from "@thanks-claude/shared-types";
import { Roles } from "../auth/roles.decorator";
import { RolesGuard } from "../auth/roles.guard";
import { AwardsService } from "./awards.service";
import { AwardDto } from "./dto/award.dto";
import { CreateAwardDto } from "./dto/create-award.dto";
import { UpdateAwardDto } from "./dto/update-award.dto";

@Controller("awards")
export class AwardsController {
  constructor(private readonly awardsService: AwardsService) {}

  @Get()
  @ApiOkResponse({ type: [AwardDto] })
  async getAll(): Promise<Award[]> {
    return this.awardsService.getAll();
  }

  @Get(":id")
  @ApiOkResponse({ type: AwardDto })
  async getById(@Param("id", ParseUUIDPipe) id: string): Promise<Award> {
    return this.awardsService.getById(id);
  }

  @Post()
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "OPERATOR")
  @ApiCreatedResponse({ type: AwardDto })
  async create(@Body() dto: CreateAwardDto): Promise<Award> {
    return this.awardsService.create(dto);
  }

  @Patch(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "OPERATOR")
  @ApiOkResponse({ type: AwardDto })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAwardDto,
  ): Promise<Award> {
    return this.awardsService.update(id, dto);
  }

  @Delete(":id")
  @UseGuards(RolesGuard)
  @Roles("ADMIN", "OPERATOR")
  @HttpCode(204)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.awardsService.remove(id);
  }
}
