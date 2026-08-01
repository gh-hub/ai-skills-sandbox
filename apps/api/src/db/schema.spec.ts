import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { awards, likeAwards, likes, userRoles, users } from "./schema";

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

  it("gives every new user zero roles by default", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "No Roles", email: "no-roles@example.com", passwordHash: "hashed" })
      .returning();

    const roles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));

    expect(roles).toHaveLength(0);
  });

  it("cascades user_roles cleanup when the referenced user is deleted", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Cascade Test", email: "cascade-role@example.com", passwordHash: "hashed" })
      .returning();
    await db.insert(userRoles).values({ userId: user.id, role: "ADMIN" });

    await db.delete(users).where(eq(users.id, user.id));

    const remainingRoles = await db.select().from(userRoles).where(eq(userRoles.userId, user.id));

    expect(remainingRoles).toHaveLength(0);
  });

  it("rejects a duplicate (user_id, role) pair", async () => {
    const [user] = await db
      .insert(users)
      .values({ name: "Unique Test", email: "unique-role@example.com", passwordHash: "hashed" })
      .returning();
    await db.insert(userRoles).values({ userId: user.id, role: "OPERATOR" });

    await expect(db.insert(userRoles).values({ userId: user.id, role: "OPERATOR" })).rejects.toThrow();
  });
});
