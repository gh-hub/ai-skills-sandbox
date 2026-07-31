import { BadRequestException, Injectable } from "@nestjs/common";
import type { AuthUser } from "@thanks-claude/shared-types";
import { LikesRepository } from "./likes.repository";
import { CreateLikeDto } from "./dto/create-like.dto";
import { GetLikesQueryDto } from "./dto/get-likes-query.dto";
import { LikeCountDto, LikeDto } from "./dto/like.dto";
import { LikesPageDto } from "./dto/likes-page.dto";
import { LikesStatsDto } from "./dto/likes-stats.dto";
import { computeLikesStats } from "./likes-stats.util";
import { groupAwardsByLikeId } from "./likes-awards.util";

@Injectable()
export class LikesService {
  constructor(private readonly likesRepository: LikesRepository) {}

  async create(dto: CreateLikeDto, currentUser: AuthUser | null): Promise<LikeDto> {
    const awardIds = dto.awardIds ?? [];
    const result = await this.likesRepository.insertLikeWithAwards(
      {
        story: dto.story,
        hoursSaved: dto.hoursSaved,
        userId: currentUser?.id,
      },
      awardIds,
    );

    if (!result.success) {
      throw new BadRequestException(
        `Unknown awardIds: ${result.missingAwardIds.join(", ")}`,
      );
    }

    return {
      id: result.like.id,
      createdAt: result.like.createdAt.toISOString(),
      story: result.like.story,
      hoursSaved: result.like.hoursSaved,
      awards: result.awards,
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

    const awardRows = await this.likesRepository.getAwardsForLikeIds(rows.map((row) => row.id));
    const awardsByLikeId = groupAwardsByLikeId(awardRows);

    return {
      items: rows.map((row) => ({
        id: row.id,
        createdAt: row.createdAt.toISOString(),
        story: row.story,
        hoursSaved: row.hoursSaved,
        attributedUserName: row.attributedUserName,
        awards: awardsByLikeId.get(row.id) ?? [],
      })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
