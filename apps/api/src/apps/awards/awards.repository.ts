import { Inject, Injectable } from "@nestjs/common";
import { asc, count, eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../../db/db.module";
import { awards, likeAwards } from "../../db/schema";

export type AwardRow = typeof awards.$inferSelect;

export type AwardWithCountRow = {
  id: string;
  createdAt: Date;
  title: string;
  description: string;
  icon: string | null;
  givenCount: number;
};

export type NewAwardValues = {
  title: string;
  description: string;
  icon?: string;
};

export type UpdateAwardValues = Partial<NewAwardValues>;

@Injectable()
export class AwardsRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

  async insertAward(values: NewAwardValues): Promise<AwardRow> {
    const [award] = await this.db.insert(awards).values(values).returning();
    return award;
  }

  async findAll(): Promise<AwardWithCountRow[]> {
    return this.db
      .select(this.awardWithCountColumns())
      .from(awards)
      .leftJoin(likeAwards, eq(likeAwards.awardId, awards.id))
      .groupBy(awards.id)
      .orderBy(asc(awards.createdAt));
  }

  async findById(id: string): Promise<AwardWithCountRow | undefined> {
    const [award] = await this.db
      .select(this.awardWithCountColumns())
      .from(awards)
      .leftJoin(likeAwards, eq(likeAwards.awardId, awards.id))
      .where(eq(awards.id, id))
      .groupBy(awards.id);

    return award;
  }

  async updateAward(id: string, values: UpdateAwardValues): Promise<AwardRow | undefined> {
    const [award] = await this.db.update(awards).set(values).where(eq(awards.id, id)).returning();
    return award;
  }

  async deleteAward(id: string): Promise<AwardRow | undefined> {
    const [award] = await this.db.delete(awards).where(eq(awards.id, id)).returning();
    return award;
  }

  private awardWithCountColumns() {
    return {
      id: awards.id,
      createdAt: awards.createdAt,
      title: awards.title,
      description: awards.description,
      icon: awards.icon,
      givenCount: count(likeAwards.id),
    };
  }
}
