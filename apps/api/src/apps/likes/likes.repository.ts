import { Inject, Injectable } from "@nestjs/common";
import { and, count, desc, eq, inArray, isNotNull, ne, sum } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../../db/db.module";
import { awards, likeAwards, likes, users } from "../../db/schema";

export type LikeRow = typeof likes.$inferSelect;

export type LikeFeedRow = {
  id: string;
  createdAt: Date;
  story: string | null;
  hoursSaved: number | null;
  attributedUserName: string | null;
};

export type NewLikeValues = {
  story?: string;
  hoursSaved?: number;
  userId?: string;
};

export type LikesStatsAggregateRow = {
  totalLikes: number;
  likesWithHoursReported: number;
  reportedHoursSaved: string | null;
};

export type AwardSummaryRow = {
  id: string;
  title: string;
  icon: string | null;
};

export type LikeAwardRow = AwardSummaryRow & {
  likeId: string;
};

export type InsertLikeWithAwardsResult =
  | { success: true; like: LikeRow; awards: AwardSummaryRow[] }
  | { success: false; missingAwardIds: string[] };

@Injectable()
export class LikesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

  async insertLikeWithAwards(
    values: NewLikeValues,
    awardIds: string[],
  ): Promise<InsertLikeWithAwardsResult> {
    return this.db.transaction(async (tx) => {
      if (awardIds.length === 0) {
        const [like] = await tx.insert(likes).values(values).returning();
        return { success: true, like, awards: [] };
      }

      const foundAwards = await tx
        .select({ id: awards.id, title: awards.title, icon: awards.icon })
        .from(awards)
        .where(inArray(awards.id, awardIds));

      const foundAwardIds = new Set(foundAwards.map((award) => award.id));
      const missingAwardIds = awardIds.filter((awardId) => !foundAwardIds.has(awardId));
      if (missingAwardIds.length > 0) {
        return { success: false, missingAwardIds };
      }

      const [like] = await tx.insert(likes).values(values).returning();
      await tx
        .insert(likeAwards)
        .values(awardIds.map((awardId) => ({ likeId: like.id, awardId })));

      return { success: true, like, awards: foundAwards };
    });
  }

  async getAwardsForLikeIds(likeIds: string[]): Promise<LikeAwardRow[]> {
    if (likeIds.length === 0) {
      return [];
    }

    return this.db
      .select({
        likeId: likeAwards.likeId,
        id: awards.id,
        title: awards.title,
        icon: awards.icon,
      })
      .from(likeAwards)
      .innerJoin(awards, eq(likeAwards.awardId, awards.id))
      .where(inArray(likeAwards.likeId, likeIds));
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

  async getStoryPage(limit: number, offset: number): Promise<LikeFeedRow[]> {
    return this.db
      .select({
        id: likes.id,
        createdAt: likes.createdAt,
        story: likes.story,
        hoursSaved: likes.hoursSaved,
        attributedUserName: users.name,
      })
      .from(likes)
      .leftJoin(users, eq(likes.userId, users.id))
      .where(this.hasStoryFilter())
      .orderBy(desc(likes.createdAt))
      .limit(limit)
      .offset(offset);
  }

  private hasStoryFilter() {
    return and(isNotNull(likes.story), ne(likes.story, ""));
  }
}
