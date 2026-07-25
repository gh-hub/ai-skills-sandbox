import { Injectable } from "@nestjs/common";
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

  async create(dto: CreateLikeDto): Promise<LikeDto> {
    const like = await this.likesRepository.insertLike({
      story: dto.story,
      hoursSaved: dto.hoursSaved,
    });

    return { ...like, createdAt: like.createdAt.toISOString() };
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
      items: rows.map((row) => ({ ...row, createdAt: row.createdAt.toISOString() })),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }
}
