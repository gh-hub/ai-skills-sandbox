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
import { RequireAuthGuard } from "../auth/require-auth.guard";
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
  @UseGuards(RequireAuthGuard)
  @ApiCreatedResponse({ type: AwardDto })
  async create(@Body() dto: CreateAwardDto): Promise<Award> {
    return this.awardsService.create(dto);
  }

  @Patch(":id")
  @ApiOkResponse({ type: AwardDto })
  async update(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() dto: UpdateAwardDto,
  ): Promise<Award> {
    return this.awardsService.update(id, dto);
  }

  @Delete(":id")
  @HttpCode(204)
  async remove(@Param("id", ParseUUIDPipe) id: string): Promise<void> {
    await this.awardsService.remove(id);
  }
}
