import { Inject, Injectable } from "@nestjs/common";
import { eq } from "drizzle-orm";
import { DATABASE_CONNECTION, type DbClient } from "../../db/db.module";
import { roles, userRoles, users } from "../../db/schema";

export type RoleRow = typeof roles.$inferSelect;

export type RoleAssignedUserRow = {
  name: string;
  email: string;
};

@Injectable()
export class RolesRepository {
  constructor(@Inject(DATABASE_CONNECTION) private readonly db: DbClient) {}

  async findAll(): Promise<RoleRow[]> {
    return this.db.select().from(roles);
  }

  async findById(id: string): Promise<RoleRow | undefined> {
    const [role] = await this.db.select().from(roles).where(eq(roles.id, id));
    return role;
  }

  async findByName(name: string): Promise<RoleRow | undefined> {
    const [role] = await this.db.select().from(roles).where(eq(roles.name, name));
    return role;
  }

  async insert(name: string): Promise<RoleRow> {
    const [role] = await this.db.insert(roles).values({ name, isBuiltIn: false }).returning();
    return role;
  }

  async findUsersAssignedToRole(roleId: string): Promise<RoleAssignedUserRow[]> {
    return this.db
      .select({ name: users.name, email: users.email })
      .from(userRoles)
      .innerJoin(users, eq(userRoles.userId, users.id))
      .where(eq(userRoles.roleId, roleId));
  }

  async deleteById(id: string): Promise<RoleRow | undefined> {
    const [role] = await this.db.delete(roles).where(eq(roles.id, id)).returning();
    return role;
  }
}
