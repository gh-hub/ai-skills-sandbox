import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, isNotNull, ne, sum } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../../db/db.module";
import { likes } from "../../db/schema";

export type LikeRow = typeof likes.$inferSelect;

export type NewLikeValues = {
  story?: string;
  hoursSaved?: number;
};

export type LikesStatsAggregateRow = {
  totalLikes: number;
  likesWithHoursReported: number;
  reportedHoursSaved: string | null;
};

@Injectable()
export class LikesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

  async insertLike(values: NewLikeValues): Promise<LikeRow> {
    const [like] = await this.db.insert(likes).values(values).returning();
    return like;
  }

  async countAll(): Promise<number> {
    const [{ value }] = await this.db.select({ value: count() }).from(likes);
    return value;
  }

  async getStatsAggregate(): Promise<LikesStatsAggregateRow> {
    const [row] = await this.db
      .select({
        totalLikes: count(),
        likesWithHoursReported: count(likes.hoursSaved),
        reportedHoursSaved: sum(likes.hoursSaved),
      })
      .from(likes);

    return row;
  }

  async countWithStory(): Promise<number> {
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(likes)
      .where(this.hasStoryFilter());

    return value;
  }

  async getStoryPage(limit: number, offset: number): Promise<LikeRow[]> {
    return this.db
      .select()
      .from(likes)
      .where(this.hasStoryFilter())
      .orderBy(desc(likes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  private hasStoryFilter() {
    return and(isNotNull(likes.story), ne(likes.story, ""));
  }
}
