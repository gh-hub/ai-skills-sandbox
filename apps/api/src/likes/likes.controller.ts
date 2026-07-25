import { Controller, Get, Post, Body, Inject, Query } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import { and, count, desc, isNotNull, ne, sum } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../db/db.module";
import { likes } from "../db/schema";
import { CreateLikeDto } from "./dto/create-like.dto";
import { GetLikesQueryDto } from "./dto/get-likes-query.dto";
import { LikeCountDto, LikeDto } from "./dto/like.dto";
import { LikesPageDto } from "./dto/likes-page.dto";
import { LikesStatsDto } from "./dto/likes-stats.dto";
import { computeLikesStats } from "./likes-stats.util";

@Controller("likes")
export class LikesController {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

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

  @Get("stats")
  @ApiOkResponse({ type: LikesStatsDto })
  async getStats(): Promise<LikesStatsDto> {
    const [{ totalLikes, likesWithHoursReported, reportedHoursSaved }] = await this.db
      .select({
        totalLikes: count(),
        likesWithHoursReported: count(likes.hoursSaved),
        reportedHoursSaved: sum(likes.hoursSaved),
      })
      .from(likes);

    return computeLikesStats({
      totalLikes,
      likesWithHoursReported,
      reportedHoursSaved: reportedHoursSaved === null ? 0 : Number(reportedHoursSaved),
    });
  }

  @Get()
  @ApiOkResponse({ type: LikesPageDto })
  async getPage(@Query() { page, limit }: GetLikesQueryDto): Promise<LikesPageDto> {
    const hasStory = and(isNotNull(likes.story), ne(likes.story, ""));

    const [{ value: total }] = await this.db
      .select({ value: count() })
      .from(likes)
      .where(hasStory);

    const rows = await this.db
      .select()
      .from(likes)
      .where(hasStory)
      .orderBy(desc(likes.createdAt))
      .limit(limit)
      .offset((page - 1) * limit);

    return {
      items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
