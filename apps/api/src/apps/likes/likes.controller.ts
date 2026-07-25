import { Controller, Get, Post, Body, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import type { AuthUser } from "@thanks-claude/shared-types";
import { CurrentUser } from "../auth/current-user.decorator";
import { LikesService } from "./likes.service";
import { CreateLikeDto } from "./dto/create-like.dto";
import { GetLikesQueryDto } from "./dto/get-likes-query.dto";
import { LikeCountDto, LikeDto } from "./dto/like.dto";
import { LikesPageDto } from "./dto/likes-page.dto";
import { LikesStatsDto } from "./dto/likes-stats.dto";

@Controller("likes")
export class LikesController {
  constructor(private readonly likesService: LikesService) {}

  @Post()
  @ApiCreatedResponse({ type: LikeDto })
  async create(@Body() dto: CreateLikeDto, @CurrentUser() user: AuthUser | null): Promise<LikeDto> {
    return this.likesService.create(dto, user);
  }

  @Get("count")
  @ApiOkResponse({ type: LikeCountDto })
  async getCount(): Promise<LikeCountDto> {
    return this.likesService.getCount();
  }

  @Get("stats")
  @ApiOkResponse({ type: LikesStatsDto })
  async getStats(): Promise<LikesStatsDto> {
    return this.likesService.getStats();
  }

  @Get()
  @ApiOkResponse({ type: LikesPageDto })
  async getPage(@Query() query: GetLikesQueryDto): Promise<LikesPageDto> {
    return this.likesService.getPage(query);
  }
}
