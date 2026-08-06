import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { awards, likeAwards, likes, roles, userRoles, users } from "./schema";

const REAL_MIGRATIONS_DIR = path.join(__dirname, "../../drizzle");
const ROLES_TABLE_MIGRATION_TAG = "0005_roles_table";

// Builds a migrations folder containing every migration EXCEPT the roles-table
// one, so a test can reach the pre-migration (enum-based `role` column) state
// before applying 0005 on top of it, to prove the backfill step actually
// moves real data rather than only running cleanly against an empty table.
function buildPreRolesTableMigrationsFolder(): string {
  const journal = JSON.parse(fs.readFileSync(path.join(REAL_MIGRATIONS_DIR, "meta/_journal.json"), "utf-8"));
  const priorEntries = journal.entries.filter(
    (entry: { tag: string }) => entry.tag !== ROLES_TABLE_MIGRATION_TAG,
  );

  const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), "pre-roles-table-migrations-"));
  fs.mkdirSync(path.join(tempDir, "meta"));
  fs.writeFileSync(
    path.join(tempDir, "meta/_journal.json"),
    JSON.stringify({ ...journal, entries: priorEntries }),
  );
  for (const entry of priorEntries) {
    fs.copyFileSync(
      path.join(REAL_MIGRATIONS_DIR, `${entry.tag}.sql`),
      path.join(tempDir, `${entry.tag}.sql`),
    );
  }

  return tempDir;
}

const SEEDED_AWARDS = [
  { icon: "🐛", title: "Bug Slayer", description: "Squashed a nasty bug that had been haunting the codebase" },
  { icon: "⚡", title: "Speed Demon", description: "Shipped something impressively fast" },
  { icon: "🧠", title: "Clean Code", description: "Wrote code so clean it made someone smile" },
  { icon: "🛟", title: "Lifesaver", description: "Saved the day right before a deadline or outage" },
  { icon: "🎨", title: "Creative Genius", description: "Came up with a solution nobody else thought of" },
  { icon: "📚", title: "Patient Teacher", description: "Explained something clearly and patiently" },
  { icon: "🔧", title: "Refactor Royalty", description: "Turned a mess into something maintainable" },
];

describe("awards schema & seed migration", () => {
  let container: StartedPostgreSqlContainer;
  let pool: Pool;
  let db: ReturnType<typeof drizzle>;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    pool = new Pool({ connectionString: container.getConnectionUri() });
    db = drizzle(pool);
    await migrate(db, { migrationsFolder: path.join(__dirname, "../../drizzle") });
  });

  afterAll(async () => {
    await pool?.end();
    await container?.stop();
  });

  async function getRoleId(name: "ADMIN" | "OPERATOR"): Promise<string> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    return role.id;
  }

  it("seeds exactly the 7 expected awards on a fresh database", async () => {
    const rows = await db.select().from(awards);

    expect(rows).toHaveLength(7);
    expect(
      rows.map(({ icon, title, description }) => ({ icon, title, description })),
    ).toEqual(expect.arrayContaining(SEEDED_AWARDS));
  });

  it("cascades like_awards cleanup when the referenced award is deleted, without touching likes", async () => {
    const [like] = await db.insert(likes).values({ story: "cascade test" }).returning();
    const [award] = await db
      .insert(awards)
      .values({ title: "Temp Award", description: "temp" })
      .returning();
    await db.insert(likeAwards).values({ likeId: like.id, awardId: award.id });

    await db.delete(awards).where(eq(awards.id, award.id));

    const remainingLinks = await db.select().from(likeAwards).where(eq(likeAwards.awardId, award.id));
    const remainingLikes = await db.select().from(likes).where(eq(likes.id, like.id));

    expect(remainingLinks).toHaveLength(0);
    expect(remainingLikes).toHaveLength(1);
  });

  it("cascades like_awards cleanup when the referenced like is deleted", async () => {
    const [like] = await db.insert(likes).values({ story: "cascade test 2" }).returning();
    const [award] = await db
      .insert(awards)
      .values({ title: "Temp Award 2", description: "temp" })
      .returning();
    await db.insert(likeAwards).values({ likeId: like.id, awardId: award.id });

    await db.delete(likes).where(eq(likes.id, like.id));

    const remainingLinks = await db.select().from(likeAwards).where(eq(likeAwards.likeId, like.id));

    expect(remainingLinks).toHaveLength(0);
  });

  it("seeds ADMIN and OPERATOR as built-in roles on a fresh database", async () => {
    const rows = await db.select().from(roles);

    expect(rows).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ name: "ADMIN", isBuiltIn: true }),
        expect.objectContaining({ name: "OPERATOR", isBuiltIn: true }),
      ]),
    );
  });

  it("cascades user_roles cleanup when the referenced role is deleted", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Role Cascade Test", email: "role-cascade@example.com", passwordHash: "hashed" })
      .returning();
    const [customRole] = await db
      .insert(roles)
      .values({ name: "TEMP_ROLE_FOR_CASCADE_TEST", isBuiltIn: false })
      .returning();
    await db.insert(userRoles).values({ userId: user.id, roleId: customRole.id });

    await db.delete(roles).where(eq(roles.id, customRole.id));

    const remainingAssignments = await db
      .select()
      .from(userRoles)
      .where(eq(userRoles.roleId, customRole.id));

    expect(remainingAssignments).toHaveLength(0);
  });

  it("backfills a pre-existing enum-based user_roles row to the matching seeded role_id", async () => {
    const backfillContainer = await new PostgreSqlContainer("postgres:16-alpine").start();
    const backfillPool = new Pool({ connectionString: backfillContainer.getConnectionUri() });
    const backfillDb = drizzle(backfillPool);
    const preMigrationsFolder = buildPreRolesTableMigrationsFolder();

    try {
      await migrate(backfillDb, { migrationsFolder: preMigrationsFolder });

      const [user] = await backfillDb
        .insert(users)
        .values({ name: "Pre-migration Admin", email: "pre-migration-admin@example.com", passwordHash: "hashed" })
        .returning();
      await backfillPool.query('INSERT INTO user_roles (user_id, role) VALUES ($1, $2)', [user.id, "ADMIN"]);

      await migrate(backfillDb, { migrationsFolder: REAL_MIGRATIONS_DIR });

      const backfilledRoles = await backfillDb
        .select({ roleName: roles.name })
        .from(userRoles)
        .innerJoin(roles, eq(userRoles.roleId, roles.id))
        .where(eq(userRoles.userId, user.id));

      expect(backfilledRoles).toEqual([{ roleName: "ADMIN" }]);
    } finally {
      await backfillPool.end();
      await backfillContainer.stop();
      fs.rmSync(preMigrationsFolder, { recursive: true, force: true });
    }
  });

  it("gives every new user zero roles by default", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "No Roles", email: "no-roles@example.com", passwordHash: "hashed" })
      .returning();

    const userRoleRows = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));

    expect(userRoleRows).toHaveLength(0);
  });

  it("cascades user_roles cleanup when the referenced user is deleted", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Cascade Test", email: "cascade-role@example.com", passwordHash: "hashed" })
      .returning();
    const adminRoleId = await getRoleId("ADMIN");
    await db.insert(userRoles).values({ userId: user.id, roleId: adminRoleId });

    await db.delete(users).where(eq(users.id, user.id));

    const remainingRoles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));

    expect(remainingRoles).toHaveLength(0);
  });

  it("rejects a duplicate (user_id, role_id) pair", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Unique Test", email: "unique-role@example.com", passwordHash: "hashed" })
      .returning();
    const operatorRoleId = await getRoleId("OPERATOR");
    await db.insert(userRoles).values({ userId: user.id, roleId: operatorRoleId });

    await expect(
      db.insert(userRoles).values({ userId: user.id, roleId: operatorRoleId }),
    ).rejects.toThrow();
  });
});
