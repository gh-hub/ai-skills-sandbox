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

describe("Auth", () => {
  let container: StartedPostgreSqlContainer;
  let migrationPool: Pool;
  let appPool: Pool;
  let app: INestApplication;

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
    appPool = moduleRef.get<DbClient>(DATABASE_CONNECTION).$client;

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

  describe("POST /auth/signup", () => {
    it("creates a user, returns it without any password field, and sets an httpOnly session cookie", async () => {
      const email = uniqueEmail("signup");

      const response = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Ada Lovelace", email, password: "secret1" })
        .expect(201);

      expect(response.body).toEqual({
        id: expect.any(String),
        name: "Ada Lovelace",
        email,
        roles: [],
      });
      const sessionCookie = extractSessionCookie(response);
      expect(sessionCookie).toContain("HttpOnly");
    });

    it("rejects a duplicate email with a conflict", async () => {
      const email = uniqueEmail("dup");
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Ada Lovelace", email, password: "secret1" })
        .expect(201);

      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Ada Again", email, password: "secret2" })
        .expect(409);
    });

    it("rejects a password shorter than 6 characters", async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Ada Lovelace", email: uniqueEmail("short"), password: "abc" })
        .expect(400);
    });

    it("rejects an invalid email format", async () => {
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Ada Lovelace", email: "not-an-email", password: "secret1" })
        .expect(400);
    });
  });

  describe("POST /auth/login", () => {
    it("logs in with correct credentials and sets a session cookie", async () => {
      const email = uniqueEmail("login");
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Grace Hopper", email, password: "secret1" })
        .expect(201);

      const response = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password: "secret1" })
        .expect(200);

      expect(response.body).toEqual({
        id: expect.any(String),
        name: "Grace Hopper",
        email,
        roles: [],
      });
      extractSessionCookie(response);
    });

    it("returns the same generic failure for an unknown email and a wrong password", async () => {
      const email = uniqueEmail("wrongpw");
      await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Grace Hopper", email, password: "secret1" })
        .expect(201);

      const unknownEmailResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email: uniqueEmail("missing"), password: "secret1" })
        .expect(401);

      const wrongPasswordResponse = await request(app.getHttpServer())
        .post("/auth/login")
        .send({ email, password: "wrong-password" })
        .expect(401);

      expect(unknownEmailResponse.body.message).toBe(wrongPasswordResponse.body.message);
    });
  });

  describe("GET /auth/me", () => {
    it("returns the current user when a valid session cookie is present", async () => {
      const email = uniqueEmail("me");
      const signupResponse = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Hedy Lamarr", email, password: "secret1" })
        .expect(201);
      const sessionCookie = extractSessionCookie(signupResponse);

      const response = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Cookie", sessionCookie)
        .expect(200);

      expect(response.body).toEqual({
        user: { id: expect.any(String), name: "Hedy Lamarr", email, roles: [] },
      });
    });

    it("returns an explicit no-session response when no cookie is present", async () => {
      const response = await request(app.getHttpServer()).get("/auth/me").expect(200);

      expect(response.body).toEqual({ user: null });
    });

    it("returns an explicit no-session response for an invalid/garbage cookie", async () => {
      const response = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Cookie", "session=not-a-real-jwt")
        .expect(200);

      expect(response.body).toEqual({ user: null });
    });
  });

  describe("POST /auth/logout", () => {
    it("clears the session cookie", async () => {
      const response = await request(app.getHttpServer()).post("/auth/logout").expect(200);

      const setCookieHeader: string[] = response.get("Set-Cookie") ?? [];
      const clearedCookie = setCookieHeader.find((cookie) => cookie.startsWith("session="));
      expect(clearedCookie).toBeDefined();
      expect(clearedCookie).toMatch(/session=;/);
    });

    it("makes /auth/me report no session again after logout", async () => {
      const email = uniqueEmail("logout");
      const signupResponse = await request(app.getHttpServer())
        .post("/auth/signup")
        .send({ name: "Katherine Johnson", email, password: "secret1" })
        .expect(201);
      const sessionCookie = extractSessionCookie(signupResponse);

      const logoutResponse = await request(app.getHttpServer())
        .post("/auth/logout")
        .set("Cookie", sessionCookie)
        .expect(200);
      const clearedCookie = extractSessionCookie(logoutResponse);

      const meResponse = await request(app.getHttpServer())
        .get("/auth/me")
        .set("Cookie", clearedCookie)
        .expect(200);

      expect(meResponse.body).toEqual({ user: null });
    });
  });
});
