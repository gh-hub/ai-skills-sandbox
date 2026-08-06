import { Inject, Injectable } from "@nestjs/common";
import { and, asc, count, eq, ilike, inArray, or } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../../db/db.module";
import { roles, userRoles, users } from "../../db/schema";

export type UserRow = typeof users.$inferSelect;

export type UserRole = (typeof roles.$inferSelect)["name"];

export type NewUserValues = {
  name: string;
  email: string;
  passwordHash: string;
};

export type UserSummaryRow = {
  id: string;
  name: string;
  email: string;
};

export type UserRoleRow = {
  userId: string;
  id: string;
  name: string;
};

export type UserRoleAssignmentRow = {
  id: string;
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

  async findRolesByUserId(userId: string): Promise<UserRole[]> {
    const rows = await this.db
      .select({ name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(eq(userRoles.userId, userId));
    return rows.map((row) => row.name);
  }

  async countMatching(search: string | undefined): Promise<number> {
    const [{ value }] = await this.db
      .select({ value: count() })
      .from(users)
      .where(this.searchFilter(search));

    return value;
  }

  async findPage(limit: number, offset: number, search: string | undefined): Promise<UserSummaryRow[]> {
    return this.db
      .select({ id: users.id, name: users.name, email: users.email })
      .from(users)
      .where(this.searchFilter(search))
      .orderBy(asc(users.createdAt))
      .limit(limit)
      .offset(offset);
  }

  async findRolesForUserIds(userIds: string[]): Promise<UserRoleRow[]> {
    if (userIds.length === 0) {
      return [];
    }

    return this.db
      .select({ userId: userRoles.userId, id: roles.id, name: roles.name })
      .from(userRoles)
      .innerJoin(roles, eq(userRoles.roleId, roles.id))
      .where(inArray(userRoles.userId, userIds));
  }

  async findAssignment(userId: string, roleId: string): Promise<UserRoleAssignmentRow | undefined> {
    const [assignment] = await this.db
      .select({ id: userRoles.id })
      .from(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)));

    return assignment;
  }

  async insertAssignment(userId: string, roleId: string): Promise<void> {
    await this.db.insert(userRoles).values({ userId, roleId });
  }

  async deleteAssignment(userId: string, roleId: string): Promise<UserRoleAssignmentRow | undefined> {
    const [deleted] = await this.db
      .delete(userRoles)
      .where(and(eq(userRoles.userId, userId), eq(userRoles.roleId, roleId)))
      .returning({ id: userRoles.id });

    return deleted;
  }

  private searchFilter(search: string | undefined) {
    if (!search) {
      return undefined;
    }

    const pattern = `%${search}%`;
    return or(ilike(users.name, pattern), ilike(users.email, pattern));
  }
}
