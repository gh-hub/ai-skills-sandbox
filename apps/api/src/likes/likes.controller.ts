import { Controller, Get, Post, Body, Inject } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { count } from "drizzle-orm";
import { DATABASE_CONNECTION } from "../db/db.module";
import type { db as Database } from "../db/client";
import { likes } from "../db/schema";
import { CreateLikeDto } from "./dto/create-like.dto";
import { LikeCountDto, LikeDto } from "./dto/like.dto";

@Controller("likes")
export class LikesController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: typeof Database) {}

  @Post()
  @ApiCreatedResponse({ type: LikeDto })
  async create(@Body() dto: CreateLikeDto): Promise<LikeDto> {
    const [like] = await this.db
      .insert(likes)
      .values({ story: dto.story, hoursSaved: dto.hoursSaved })
      .returning();

    return { ...like, createdAt: like.createdAt.toISOString() };
  }

  @Get("count")
  @ApiOkResponse({ type: LikeCountDto })
  async getCount(): Promise<LikeCountDto> {
    const [result] = await this.db.select({ value: count() }).from(likes);
    return { count: result.value };
  }
}
