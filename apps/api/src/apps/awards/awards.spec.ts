import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { eq } from "drizzle-orm";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import cookieParser from "cookie-parser";
import request, { type Response } from "supertest";
import type { DbClient } from "../../db/db.module";
import { likeAwards, likes, roles, userRoles } from "../../db/schema";

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

function uniqueTitle(label: string): string {
  return `${label} ${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("Awards", () => {
  let container: StartedPostgreSqlContainer;
  let migrationPool: Pool;
  let appPool: Pool;
  let db: DbClient;
  let app: INestApplication;
  let sessionCookie: string;

  async function grantRole(userId: string, role: "ADMIN" | "OPERATOR"): Promise<void> {
    const [roleRow] = await db.select().from(roles).where(eq(roles.name, role));
    await db.insert(userRoles).values({ userId, roleId: roleRow.id });
  }

  async function signupUser(label: string): Promise<{ id: string; email: string }> {
    const email = uniqueEmail(label);
    const response = await request(app.getHttpServer())
      .post("/auth/signup")
      .send({ name: label, email, password: "secret1" })
      .expect(201);
    return { id: response.body.id, email };
  }

  async function loginAs(email: string): Promise<string> {
    const response = await request(app.getHttpServer())
      .post("/auth/login")
      .send({ email, password: "secret1" })
      .expect(200);
    return extractSessionCookie(response);
  }

  async function signupWithRole(label: string, role: "ADMIN" | "OPERATOR"): Promise<string> {
    const { id, email } = await signupUser(label);
    await grantRole(id, role);
    return loginAs(email);
  }

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

    const signupResponse = await request(app.getHttpServer())
      .post("/auth/signup")
      .send({ name: "Ada Lovelace", email: uniqueEmail("awards"), password: "secret1" })
      .expect(201);
    await grantRole(signupResponse.body.id, "ADMIN");
    // Roles ride in the JWT and are only refreshed at login, so a fresh
    // login is needed to pick up the role just granted above.
    sessionCookie = await loginAs(signupResponse.body.email);
  });

  afterAll(async () => {
    await app?.close();
    await appPool?.end();
    await migrationPool?.end();
    await container?.stop();
  });

  describe("GET /awards", () => {
    it("returns the seeded awards, each with a numeric givenCount", async () => {
      const response = await request(app.getHttpServer()).get("/awards").expect(200);

      expect(response.body.length).toBeGreaterThanOrEqual(7);
      const bugSlayer = response.body.find((award: { title: string }) => award.title === "Bug Slayer");
      expect(bugSlayer).toMatchObject({ title: "Bug Slayer", icon: "🐛" });
      expect(typeof bugSlayer.givenCount).toBe("number");
    });

    it("includes an award created via POST", async () => {
      const title = uniqueTitle("Listed Award");
      await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title, description: "desc" })
        .expect(201);

      const response = await request(app.getHttpServer()).get("/awards").expect(200);

      const titles = response.body.map((award: { title: string }) => award.title);
      expect(titles).toContain(title);
    });
  });

  describe("GET /awards/:id", () => {
    it("returns a single award with its givenCount", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Single Award"), description: "desc" })
        .expect(201);

      const response = await request(app.getHttpServer()).get(`/awards/${created.body.id}`).expect(200);

      expect(response.body).toMatchObject({ id: created.body.id, givenCount: 0 });
    });

    it("returns 404 for an id that does not exist", async () => {
      await request(app.getHttpServer())
        .get("/awards/00000000-0000-0000-0000-000000000000")
        .expect(404);
    });

    it("reflects the count of like_awards rows referencing the award", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Counted Award"), description: "desc" })
        .expect(201);

      const [likeOne] = await db.insert(likes).values({ story: "count test 1" }).returning();
      const [likeTwo] = await db.insert(likes).values({ story: "count test 2" }).returning();
      await db.insert(likeAwards).values({ likeId: likeOne.id, awardId: created.body.id });
      await db.insert(likeAwards).values({ likeId: likeTwo.id, awardId: created.body.id });

      const response = await request(app.getHttpServer()).get(`/awards/${created.body.id}`).expect(200);

      expect(response.body.givenCount).toBe(2);
    });
  });

  describe("POST /awards", () => {
    it("returns 401 when there is no logged-in user", async () => {
      await request(app.getHttpServer())
        .post("/awards")
        .send({ title: uniqueTitle("Anon Award"), description: "desc" })
        .expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const noRoleCookie = await loginAs((await signupUser("post-no-role")).email);

      await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", noRoleCookie)
        .send({ title: uniqueTitle("No Role Award"), description: "desc" })
        .expect(403);
    });

    it("returns 201 with the created award (givenCount 0) when logged in as ADMIN", async () => {
      const title = uniqueTitle("Authed Award");

      const response = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title, description: "desc", icon: "🏆" })
        .expect(201);

      expect(response.body).toMatchObject({ title, description: "desc", icon: "🏆", givenCount: 0 });
      expect(response.body.id).toEqual(expect.any(String));
    });

    it("returns 201 with the created award when logged in as OPERATOR", async () => {
      const operatorCookie = await signupWithRole("post-operator", "OPERATOR");
      const title = uniqueTitle("Operator Award");

      const response = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", operatorCookie)
        .send({ title, description: "desc" })
        .expect(201);

      expect(response.body).toMatchObject({ title, description: "desc" });
    });

    it("rejects a missing title", async () => {
      await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ description: "desc" })
        .expect(400);
    });

    it("rejects an empty description", async () => {
      await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Bad Award"), description: "" })
        .expect(400);
    });
  });

  describe("PATCH /awards/:id", () => {
    it("returns 401 when there is no logged-in user", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Patchable Award"), description: "original" })
        .expect(201);

      await request(app.getHttpServer())
        .patch(`/awards/${created.body.id}`)
        .send({ description: "updated" })
        .expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Patchable Award"), description: "original" })
        .expect(201);
      const noRoleCookie = await loginAs((await signupUser("patch-no-role")).email);

      await request(app.getHttpServer())
        .patch(`/awards/${created.body.id}`)
        .set("Cookie", noRoleCookie)
        .send({ description: "updated" })
        .expect(403);
    });

    it("updates fields when logged in as ADMIN", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Patchable Award"), description: "original" })
        .expect(201);

      const response = await request(app.getHttpServer())
        .patch(`/awards/${created.body.id}`)
        .set("Cookie", sessionCookie)
        .send({ description: "updated" })
        .expect(200);

      expect(response.body).toMatchObject({ id: created.body.id, description: "updated" });
    });

    it("updates fields when logged in as OPERATOR", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Patchable Award"), description: "original" })
        .expect(201);
      const operatorCookie = await signupWithRole("patch-operator", "OPERATOR");

      const response = await request(app.getHttpServer())
        .patch(`/awards/${created.body.id}`)
        .set("Cookie", operatorCookie)
        .send({ description: "updated by operator" })
        .expect(200);

      expect(response.body).toMatchObject({ id: created.body.id, description: "updated by operator" });
    });

    it("returns 404 for an id that does not exist", async () => {
      await request(app.getHttpServer())
        .patch("/awards/00000000-0000-0000-0000-000000000000")
        .set("Cookie", sessionCookie)
        .send({ description: "updated" })
        .expect(404);
    });
  });

  describe("DELETE /awards/:id", () => {
    it("returns 401 when there is no logged-in user", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Deletable Award"), description: "desc" })
        .expect(201);

      await request(app.getHttpServer()).delete(`/awards/${created.body.id}`).expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Deletable Award"), description: "desc" })
        .expect(201);
      const noRoleCookie = await loginAs((await signupUser("delete-no-role")).email);

      await request(app.getHttpServer())
        .delete(`/awards/${created.body.id}`)
        .set("Cookie", noRoleCookie)
        .expect(403);
    });

    it("deletes and returns 204 when logged in as ADMIN", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Deletable Award"), description: "desc" })
        .expect(201);

      await request(app.getHttpServer())
        .delete(`/awards/${created.body.id}`)
        .set("Cookie", sessionCookie)
        .expect(204);

      await request(app.getHttpServer()).get(`/awards/${created.body.id}`).expect(404);
    });

    it("deletes and returns 204 when logged in as OPERATOR", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Deletable Award"), description: "desc" })
        .expect(201);
      const operatorCookie = await signupWithRole("delete-operator", "OPERATOR");

      await request(app.getHttpServer())
        .delete(`/awards/${created.body.id}`)
        .set("Cookie", operatorCookie)
        .expect(204);

      await request(app.getHttpServer()).get(`/awards/${created.body.id}`).expect(404);
    });

    it("returns 404 for an id that does not exist", async () => {
      await request(app.getHttpServer())
        .delete("/awards/00000000-0000-0000-0000-000000000000")
        .set("Cookie", sessionCookie)
        .expect(404);
    });

    it("cascades like_awards cleanup through the real HTTP route, leaving the referencing like's own content untouched", async () => {
      const created = await request(app.getHttpServer())
        .post("/awards")
        .set("Cookie", sessionCookie)
        .send({ title: uniqueTitle("Cascade Award"), description: "desc" })
        .expect(201);

      const signupResponse = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Cascade Owner", email: uniqueEmail("cascade-owner"), password: "secret1" })
        .expect(201);
      const ownerId: string = signupResponse.body.id;

      const [like] = await db
        .insert(likes)
        .values({ story: "cascade http test", hoursSaved: 5, userId: ownerId })
        .returning();
      await db.insert(likeAwards).values({ likeId: like.id, awardId: created.body.id });

      await request(app.getHttpServer())
        .delete(`/awards/${created.body.id}`)
        .set("Cookie", sessionCookie)
        .expect(204);

      const remainingLinks = await db
        .select()
        .from(likeAwards)
        .where(eq(likeAwards.awardId, created.body.id));
      expect(remainingLinks).toHaveLength(0);

      const remainingLikes = await db.select().from(likes).where(eq(likes.id, like.id));
      expect(remainingLikes).toHaveLength(1);
      expect(remainingLikes[0]).toMatchObject({
        story: "cascade http test",
        hoursSaved: 5,
        userId: ownerId,
      });

      const feedResponse = await request(app.getHttpServer()).get("/likes?limit=100").expect(200);
      const feedItem = feedResponse.body.items.find(
        (item: { id: string }) => item.id === like.id,
      );
      expect(feedItem.awards).toEqual([]);
    });
  });
});
