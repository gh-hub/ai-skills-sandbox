import { Injectable } from "@nestjs/common";
import type { AuthUser } from "@thanks-claude/shared-types";
import { LikesRepository } from "./likes.repository";
import { CreateLikeDto } from "./dto/create-like.dto";
import { GetLikesQueryDto } from "./dto/get-likes-query.dto";
import { LikeCountDto, LikeDto } from "./dto/like.dto";
import { LikesPageDto } from "./dto/likes-page.dto";
import { LikesStatsDto } from "./dto/likes-stats.dto";
import { computeLikesStats } from "./likes-stats.util";

@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async create(dto: CreateLikeDto, currentUser: AuthUser | null): Promise<LikeDto> {
    const like = await this.likesRepository.insertLike({
      story: dto.story,
      hoursSaved: dto.hoursSaved,
      userId: currentUser?.id,
    });

    return {
      id: like.id,
      createdAt: like.createdAt.toISOString(),
      story: like.story,
      hoursSaved: like.hoursSaved,
    };
  }

  async getCount(): Promise<LikeCountDto> {
    const count = await this.likesRepository.countAll();
    return { count };
  }

  async getStats(): Promise<LikesStatsDto> {
    const { totalLikes, likesWithHoursReported, reportedHoursSaved } =
      await this.likesRepository.getStatsAggregate();

    return computeLikesStats({
      totalLikes,
      likesWithHoursReported,
      reportedHoursSaved: reportedHoursSaved === null ? 0 : Number(reportedHoursSaved),
    });
  }

  async getPage({ page, limit }: GetLikesQueryDto): Promise<LikesPageDto> {
    const offset = (page - 1) * limit;

    const total = await this.likesRepository.countWithStory();
    const rows = await this.likesRepository.getStoryPage(limit, offset);

    return {
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        story: row.story,
        hoursSaved: row.hoursSaved,
        attributedUserName: row.attributedUserName,
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
