import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request, { type Response } from "supertest";
import type { DbClient } from "../../db/db.module";
import { userRoles } from "../../db/schema";

function extractSessionCookie(response: Response): string {
  const setCookieHeader: string[] = response.get("Set-Cookie") ?? [];
  const sessionCookie = setCookieHeader.find((cookie) => cookie.startsWith("session="));
  if (!sessionCookie) {
    throw new Error("Expected a session cookie to be set");
  }
  return sessionCookie;
}

function uniqueEmail(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
}

describe("Likes", () => {
  let container: StartedPostgreSqlContainer;
  let migrationPool: Pool;
  let appPool: Pool;
  let app: INestApplication;
  let db: DbClient;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();
    process.env.JWT_SECRET = "test-jwt-secret";

    migrationPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await migrate(drizzle(migrationPool), {
      migrationsFolder: path.join(__dirname, "../../../drizzle"),
    });

    const { AppModule } = await import("../../app.module");
    const { DATABASE_CONNECTION } = await import("../../db/db.module");

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    db = moduleRef.get<DbClient>(DATABASE_CONNECTION);
    appPool = db.$client;

    app = moduleRef.createNestApplication();
    app.use(cookieParser());
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app?.close();
    await appPool?.end();
    await migrationPool?.end();
    await container?.stop();
  });

  it("creates a like with null story and hoursSaved when no body fields are given", async () => {
    const response = await request(app.getHttpServer()).post("/likes").send({}).expect(201);

    expect(response.body).toMatchObject({ story: null, hoursSaved: null });
  });

  it("assigns a string id to a newly created like", async () => {
    const response = await request(app.getHttpServer()).post("/likes").send({}).expect(201);

    expect(response.body.id).toEqual(expect.any(String));
  });

  it("creates a like with story and hoursSaved", async () => {
    const response = await request(app.getHttpServer())
      .post("/likes")
      .send({ story: "Saved me a weekend", hoursSaved: 12 })
      .expect(201);

    expect(response.body).toMatchObject({ story: "Saved me a weekend", hoursSaved: 12 });
  });

  it("reflects the total count after creating multiple likes", async () => {
    const before = await request(app.getHttpServer()).get("/likes/count").expect(200);

    await request(app.getHttpServer()).post("/likes").send({}).expect(201);
    await request(app.getHttpServer()).post("/likes").send({}).expect(201);

    const after = await request(app.getHttpServer()).get("/likes/count").expect(200);

    expect(after.body.count).toBe(before.body.count + 2);
  });

  it("rejects a like with a non-numeric hoursSaved", async () => {
    await request(app.getHttpServer())
      .post("/likes")
      .send({ hoursSaved: "not-a-number" })
      .expect(400);
  });

  describe("GET /likes", () => {
    it("defaults to page=1 and limit=10 when no query params are given", async () => {
      const response = await request(app.getHttpServer()).get("/likes").expect(200);

      expect(response.body.page).toBe(1);
      expect(response.body.limit).toBe(10);
      expect(response.body.items.length).toBeLessThanOrEqual(10);
    });

    it("only returns likes with a non-null, non-empty story", async () => {
      const before = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const baselineTotal = before.body.total;

      await request(app.getHttpServer()).post("/likes").send({}).expect(201);
      await request(app.getHttpServer()).post("/likes").send({ story: "" }).expect(201);
      await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Unique story marker for filter test" })
        .expect(201);

      const after = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);

      expect(after.body.total).toBe(baselineTotal + 1);
      const stories = after.body.items.map((item: { story: string | null }) => item.story);
      expect(stories).toContain("Unique story marker for filter test");
      expect(stories.every((story: string | null) => story !== null && story !== "")).toBe(true);
    });

    it("orders likes by createdAt descending", async () => {
      const first = await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Order test A" })
        .expect(201);
      await new Promise((resolve) => setTimeout(resolve, 10));
      const second = await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Order test B" })
        .expect(201);

      const response = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const ids = response.body.items.map((item: { id: string }) => item.id);

      expect(ids.indexOf(second.body.id)).toBeLessThan(ids.indexOf(first.body.id));
    });

    it("respects page and limit and reports correct total/totalPages", async () => {
      const before = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const baselineTotal = before.body.total;

      const stories = ["Page test 1", "Page test 2", "Page test 3"];
      for (const story of stories) {
        await request(app.getHttpServer()).post("/likes").send({ story }).expect(201);
      }

      const expectedTotal = baselineTotal + stories.length;
      const limit = 2;
      const expectedTotalPages = Math.ceil(expectedTotal / limit);

      const firstPage = await request(app.getHttpServer())
        .get(`/likes?page=1&limit=${limit}`)
        .expect(200);

      expect(firstPage.body.items).toHaveLength(limit);
      expect(firstPage.body.total).toBe(expectedTotal);
      expect(firstPage.body.totalPages).toBe(expectedTotalPages);
      expect(firstPage.body.page).toBe(1);
      expect(firstPage.body.limit).toBe(limit);

      const secondPage = await request(app.getHttpServer())
        .get(`/likes?page=2&limit=${limit}`)
        .expect(200);
      const firstIds = firstPage.body.items.map((item: { id: string }) => item.id);
      const secondIds = secondPage.body.items.map((item: { id: string }) => item.id);

      expect(secondIds.some((id: string) => firstIds.includes(id))).toBe(false);
    });

    it("returns an empty items array (not an error) for a page beyond totalPages", async () => {
      const baseline = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const outOfRangePage = baseline.body.totalPages + 100;

      const response = await request(app.getHttpServer())
        .get(`/likes?page=${outOfRangePage}&limit=10`)
        .expect(200);

      expect(response.body.items).toEqual([]);
      expect(response.body.total).toBe(baseline.body.total);
      expect(response.body.totalPages).toBe(baseline.body.totalPages);
    });
  });

  describe("attribution", () => {
    it("attaches the current user and surfaces their name on the feed when created with a valid session cookie", async () => {
      const email = uniqueEmail("attribution");
      const signupResponse = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Ada Lovelace", email, password: "secret1" })
        .expect(201);
      const sessionCookie = extractSessionCookie(signupResponse);
      const story = `Attributed story marker ${Date.now()}`;

      const createResponse = await request(app.getHttpServer())
        .post("/likes")
        .set("Cookie", sessionCookie)
        .send({ story })
        .expect(201);

      expect(createResponse.body).not.toHaveProperty("userId");

      const feedResponse = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const feedItem = feedResponse.body.items.find(
        (item: { story: string | null }) => item.story === story,
      );

      expect(feedItem).toMatchObject({ attributedUserName: "Ada Lovelace" });
    });

    it("leaves the like anonymous and the feed item's attributedUserName null when created without a session cookie", async () => {
      const story = `Anonymous story marker ${Date.now()}`;

      const createResponse = await request(app.getHttpServer())
        .post("/likes")
        .send({ story })
        .expect(201);

      expect(createResponse.body).not.toHaveProperty("userId");

      const feedResponse = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const feedItem = feedResponse.body.items.find(
        (item: { story: string | null }) => item.story === story,
      );

      expect(feedItem).toMatchObject({ attributedUserName: null });
    });
  });

  describe("attaching awards", () => {
    async function createAward(title: string): Promise<{ id: string; title: string; icon: string | null }> {
      const email = uniqueEmail("award-creator");
      const signupResponse = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Award Creator", email, password: "secret1" })
        .expect(201);
      await db.insert(userRoles).values({ userId: signupResponse.body.id, role: "ADMIN" });
      // Roles ride in the JWT and are only refreshed at login, so a fresh
      // login is needed to pick up the role just granted above.
      const loginResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password: "secret1" })
        .expect(200);
      const sessionCookie = extractSessionCookie(loginResponse);

      const awardResponse = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title, description: `${title} description`, icon: "🏅" })
        .expect(201);

      return {
        id: awardResponse.body.id,
        title: awardResponse.body.title,
        icon: awardResponse.body.icon,
      };
    }

    it("attaches a single award to a newly created like and includes it on the create response", async () => {
      const award = await createAward(`Award A ${Date.now()}`);

      const response = await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Story with one award", awardIds: [award.id] })
        .expect(201);

      expect(response.body.awards).toEqual([award]);
    });

    it("attaches multiple awards to a newly created like", async () => {
      const awardA = await createAward(`Award B ${Date.now()}`);
      const awardB = await createAward(`Award C ${Date.now()}`);

      const response = await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Story with two awards", awardIds: [awardA.id, awardB.id] })
        .expect(201);

      const returnedIds = response.body.awards.map((award: { id: string }) => award.id).sort();
      expect(returnedIds).toEqual([awardA.id, awardB.id].sort());
    });

    it("fails the whole request with 400 and creates no likes row when an awardId does not exist", async () => {
      const before = await request(app.getHttpServer()).get("/likes/count").expect(200);
      const unknownAwardId = "00000000-0000-0000-0000-000000000000";

      await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Should not be created", awardIds: [unknownAwardId] })
        .expect(400);

      const after = await request(app.getHttpServer()).get("/likes/count").expect(200);
      expect(after.body.count).toBe(before.body.count);
    });

    it("defaults to an empty awards array when awardIds is omitted", async () => {
      const response = await request(app.getHttpServer()).post("/likes").send({}).expect(201);

      expect(response.body.awards).toEqual([]);
    });

    it("defaults to an empty awards array when awardIds is an empty array", async () => {
      const response = await request(app.getHttpServer())
        .post("/likes")
        .send({ awardIds: [] })
        .expect(201);

      expect(response.body.awards).toEqual([]);
    });

    it("surfaces attached awards on the corresponding feed item", async () => {
      const award = await createAward(`Award D ${Date.now()}`);
      const story = `Feed award story ${Date.now()}`;

      await request(app.getHttpServer())
        .post("/likes")
        .send({ story, awardIds: [award.id] })
        .expect(201);

      const feedResponse = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const feedItem = feedResponse.body.items.find(
        (item: { story: string | null }) => item.story === story,
      );

      expect(feedItem.awards).toEqual([award]);
    });
  });

  describe("GET /likes/stats", () => {
    // Each test in this block owns the full table (truncated beforehand) since the
    // aggregate math depends on the entire table's contents, not just newly-added rows.
    beforeEach(async () => {
      await appPool.query("TRUNCATE TABLE likes CASCADE");
    });

    it("computes correct aggregate math against a known seeded set", async () => {
      await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Saved a weekend", hoursSaved: 10 })
        .expect(201);
      await request(app.getHttpServer())
        .post("/likes")
        .send({ story: "Saved a sprint", hoursSaved: 20 })
        .expect(201);
      await request(app.getHttpServer()).post("/likes").send({ story: "No hours given" }).expect(201);
      await request(app.getHttpServer()).post("/likes").send({}).expect(201);

      const response = await request(app.getHttpServer()).get("/likes/stats").expect(200);

      expect(response.body).toEqual({
        totalLikes: 4,
        likesWithHoursReported: 2,
        reportedHoursSaved: 30,
        percentWithoutHoursReported: 50,
        averageHoursPerReport: 15,
        estimatedTotalHoursSaved: 60,
      });
    });

    it("returns all-zero stats for an empty table", async () => {
      const response = await request(app.getHttpServer()).get("/likes/stats").expect(200);

      expect(response.body).toEqual({
        totalLikes: 0,
        likesWithHoursReported: 0,
        reportedHoursSaved: 0,
        percentWithoutHoursReported: 0,
        averageHoursPerReport: 0,
        estimatedTotalHoursSaved: 0,
      });
    });

    it("returns 0 average and estimated hours when likes exist but none report hours", async () => {
      await request(app.getHttpServer()).post("/likes").send({ story: "No hours A" }).expect(201);
      await request(app.getHttpServer()).post("/likes").send({ story: "No hours B" }).expect(201);

      const response = await request(app.getHttpServer()).get("/likes/stats").expect(200);

      expect(response.body).toEqual({
        totalLikes: 2,
        likesWithHoursReported: 0,
        reportedHoursSaved: 0,
        percentWithoutHoursReported: 100,
        averageHoursPerReport: 0,
        estimatedTotalHoursSaved: 0,
      });
    });
  });
});
