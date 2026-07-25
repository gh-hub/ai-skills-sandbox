import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../../db/db.module";
import { users } from "../../db/schema";

export type UserRow = typeof users.$inferSelect;

export type NewUserValues = {
  name: string;
  email: string;
  passwordHash: string;
};

@Injectable()
export class UsersRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

  async insert(values: NewUserValues): Promise<UserRow> {
    const [user] = await this.db.insert(users).values(values).returning();
    return user;
  }

  async findByEmail(email: string): Promise<UserRow | null> {
    const [user] = await this.db.select().from(users).where(eq(users.email, email));
    return user ?? null;
  }

  async findById(id: string): Promise<UserRow | null> {
    const [user] = await this.db.select().from(users).where(eq(users.id, id));
    return user ?? null;
  }
}
