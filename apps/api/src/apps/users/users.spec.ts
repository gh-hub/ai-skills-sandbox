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
import { roles, userRoles } from "../../db/schema";

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

function uniqueRoleName(label: string): string {
  return `${label}-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

describe("Users", () => {
  let container: StartedPostgreSqlContainer;
  let migrationPool: Pool;
  let appPool: Pool;
  let db: DbClient;
  let app: INestApplication;
  let adminCookie: string;
  let adminUserId: string;
  let operatorRoleId: string;

  async function grantRole(userId: string, roleId: string): Promise<void> {
    await db.insert(userRoles).values({ userId, roleId });
  }

  async function findRoleByName(name: string): Promise<{ id: string; name: string; isBuiltIn: boolean }> {
    const [role] = await db.select().from(roles).where(eq(roles.name, name));
    if (!role) {
      throw new Error(`Expected seeded role ${name} to exist`);
    }
    return role;
  }

  async function signupUser(label: string, name?: string): Promise<{ id: string; email: string }> {
    const email = uniqueEmail(label);
    const response = await request(app.getHttpServer())
      .post("/auth/signup")
      .send({ name: name ?? label, email, password: "secret1" })
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

  async function createCustomRole(name: string): Promise<{ id: string; name: string }> {
    const response = await request(app.getHttpServer())
      .post("/roles")
      .set("Cookie", adminCookie)
      .send({ name })
      .expect(201);
    return response.body;
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

    const adminRole = await findRoleByName("ADMIN");
    const operatorRole = await findRoleByName("OPERATOR");
    operatorRoleId = operatorRole.id;

    const signupResponse = await request(app.getHttpServer())
      .post("/auth/signup")
      .send({ name: "Ada Lovelace", email: uniqueEmail("users-admin"), password: "secret1" })
      .expect(201);
    adminUserId = signupResponse.body.id;
    await grantRole(adminUserId, adminRole.id);
    adminCookie = await loginAs(signupResponse.body.email);
  });

  afterAll(async () => {
    await app?.close();
    await appPool?.end();
    await migrationPool?.end();
    await container?.stop();
  });

  describe("GET /users", () => {
    it("returns 401 when there is no logged-in user", async () => {
      await request(app.getHttpServer()).get("/users").expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const noRoleCookie = await loginAs((await signupUser("get-no-role")).email);

      await request(app.getHttpServer()).get("/users").set("Cookie", noRoleCookie).expect(403);
    });

    it("returns 200 with the pagination envelope shape", async () => {
      const response = await request(app.getHttpServer())
        .get("/users")
        .set("Cookie", adminCookie)
        .expect(200);

      expect(response.body).toEqual(
        expect.objectContaining({
          items: expect.any(Array),
          total: expect.any(Number),
          page: 1,
          limit: 10,
          totalPages: expect.any(Number),
        }),
      );
    });

    it("includes each user's currently held roles inline as {id, name}", async () => {
      const response = await request(app.getHttpServer())
        .get("/users")
        .set("Cookie", adminCookie)
        .expect(200);

      const adminItem = response.body.items.find((item: { id: string }) => item.id === adminUserId);
      expect(adminItem).toMatchObject({
        id: adminUserId,
        name: "Ada Lovelace",
      });
      expect(adminItem.roles).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "ADMIN" })]),
      );
    });

    it("defaults to page 1 and limit 10, and paginates with the requested page/limit", async () => {
      const label = uniqueRoleName("page-user");
      const created: string[] = [];
      for (let index = 0; index < 15; index += 1) {
        const { id } = await signupUser(`${label}-${index}`, `${label} ${index}`);
        created.push(id);
      }

      const firstPage = await request(app.getHttpServer())
        .get(`/users?limit=10&search=${encodeURIComponent(label)}`)
        .set("Cookie", adminCookie)
        .expect(200);

      expect(firstPage.body).toMatchObject({ page: 1, limit: 10, total: 15, totalPages: 2 });
      expect(firstPage.body.items).toHaveLength(10);

      const secondPage = await request(app.getHttpServer())
        .get(`/users?page=2&limit=10&search=${encodeURIComponent(label)}`)
        .set("Cookie", adminCookie)
        .expect(200);

      expect(secondPage.body).toMatchObject({ page: 2, limit: 10, total: 15, totalPages: 2 });
      expect(secondPage.body.items).toHaveLength(5);
    });

    it("caps limit at 100 even when a higher limit is requested", async () => {
      await request(app.getHttpServer())
        .get("/users?limit=101")
        .set("Cookie", adminCookie)
        .expect(400);
    });

    it("searches by name, case-insensitively and by partial match", async () => {
      const label = uniqueRoleName("SearchName");
      await signupUser(label, `${label} Match`);

      const response = await request(app.getHttpServer())
        .get(`/users?search=${encodeURIComponent(label.slice(0, -3).toLowerCase())}`)
        .set("Cookie", adminCookie)
        .expect(200);

      expect(response.body.items.length).toBeGreaterThanOrEqual(1);
      expect(
        response.body.items.every((item: { name: string }) =>
          item.name.toLowerCase().includes(label.slice(0, -3).toLowerCase()),
        ),
      ).toBe(true);
    });

    it("searches by email, case-insensitively and by partial match", async () => {
      const { email } = await signupUser(uniqueRoleName("search-email"));
      const partial = email.slice(0, 10).toUpperCase();

      const response = await request(app.getHttpServer())
        .get(`/users?search=${encodeURIComponent(partial)}`)
        .set("Cookie", adminCookie)
        .expect(200);

      const emails = response.body.items.map((item: { email: string }) => item.email);
      expect(emails).toContain(email);
    });
  });

  describe("POST /users/:userId/roles", () => {
    it("returns 401 when there is no logged-in user", async () => {
      const { id: userId } = await signupUser("grant-anon");

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .send({ roleId: operatorRoleId })
        .expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const { id: userId } = await signupUser("grant-target-no-role");
      const noRoleCookie = await loginAs((await signupUser("grant-no-role")).email);

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set("Cookie", noRoleCookie)
        .send({ roleId: operatorRoleId })
        .expect(403);
    });

    it("returns 204 and grants the role on success", async () => {
      const { id: userId } = await signupUser("grant-success");
      const role = await createCustomRole(uniqueRoleName("Grantable Role"));

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set("Cookie", adminCookie)
        .send({ roleId: role.id })
        .expect(204);

      const assignment = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      expect(assignment.map((row) => row.roleId)).toContain(role.id);
    });

    it("returns 400 when the roleId resolves to ADMIN, regardless of the target user's current roles", async () => {
      const adminRole = await findRoleByName("ADMIN");
      const { id: userId } = await signupUser("grant-admin-target");

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set("Cookie", adminCookie)
        .send({ roleId: adminRole.id })
        .expect(400);
    });

    it("returns 409 when the user already holds the target role", async () => {
      const { id: userId } = await signupUser("grant-conflict");
      const role = await createCustomRole(uniqueRoleName("Already Held Role"));
      await grantRole(userId, role.id);

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set("Cookie", adminCookie)
        .send({ roleId: role.id })
        .expect(409);
    });

    it("returns 404 when the user id doesn't exist", async () => {
      const role = await createCustomRole(uniqueRoleName("Missing User Role"));

      await request(app.getHttpServer())
        .post("/users/00000000-0000-0000-0000-000000000000/roles")
        .set("Cookie", adminCookie)
        .send({ roleId: role.id })
        .expect(404);
    });

    it("returns 404 when the role id doesn't exist", async () => {
      const { id: userId } = await signupUser("grant-missing-role");

      await request(app.getHttpServer())
        .post(`/users/${userId}/roles`)
        .set("Cookie", adminCookie)
        .send({ roleId: "00000000-0000-0000-0000-000000000000" })
        .expect(404);
    });
  });

  describe("DELETE /users/:userId/roles/:roleId", () => {
    it("returns 401 when there is no logged-in user", async () => {
      const { id: userId } = await signupUser("revoke-anon");
      const role = await createCustomRole(uniqueRoleName("Revoke Anon Role"));
      await grantRole(userId, role.id);

      await request(app.getHttpServer())
        .delete(`/users/${userId}/roles/${role.id}`)
        .expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const { id: userId } = await signupUser("revoke-target-no-role");
      const role = await createCustomRole(uniqueRoleName("Revoke No Role"));
      await grantRole(userId, role.id);
      const noRoleCookie = await loginAs((await signupUser("revoke-no-role")).email);

      await request(app.getHttpServer())
        .delete(`/users/${userId}/roles/${role.id}`)
        .set("Cookie", noRoleCookie)
        .expect(403);
    });

    it("returns 204 and revokes the role on success", async () => {
      const { id: userId } = await signupUser("revoke-success");
      const role = await createCustomRole(uniqueRoleName("Revocable Role"));
      await grantRole(userId, role.id);

      await request(app.getHttpServer())
        .delete(`/users/${userId}/roles/${role.id}`)
        .set("Cookie", adminCookie)
        .expect(204);

      const remaining = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, userId));
      expect(remaining.map((row) => row.roleId)).not.toContain(role.id);
    });

    it("returns 400 when the roleId resolves to ADMIN, even when called on the calling admin's own row", async () => {
      const adminRole = await findRoleByName("ADMIN");

      await request(app.getHttpServer())
        .delete(`/users/${adminUserId}/roles/${adminRole.id}`)
        .set("Cookie", adminCookie)
        .expect(400);

      const stillAdmin = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.userId, adminUserId));
      expect(stillAdmin.map((row) => row.roleId)).toContain(adminRole.id);
    });

    it("returns 400 when the roleId resolves to ADMIN for a different target user", async () => {
      const adminRole = await findRoleByName("ADMIN");
      const { id: userId } = await signupUser("revoke-admin-other-target");
      await grantRole(userId, adminRole.id);

      await request(app.getHttpServer())
        .delete(`/users/${userId}/roles/${adminRole.id}`)
        .set("Cookie", adminCookie)
        .expect(400);
    });

    it("returns 404 when the user id doesn't exist", async () => {
      const role = await createCustomRole(uniqueRoleName("Missing User Revoke Role"));

      await request(app.getHttpServer())
        .delete(`/users/00000000-0000-0000-0000-000000000000/roles/${role.id}`)
        .set("Cookie", adminCookie)
        .expect(404);
    });

    it("returns 404 when the role id doesn't exist", async () => {
      const { id: userId } = await signupUser("revoke-missing-role");

      await request(app.getHttpServer())
        .delete(`/users/${userId}/roles/00000000-0000-0000-0000-000000000000`)
        .set("Cookie", adminCookie)
        .expect(404);
    });

    it("returns 404 when the user doesn't hold the specified role", async () => {
      const { id: userId } = await signupUser("revoke-not-held");
      const role = await createCustomRole(uniqueRoleName("Not Held Role"));

      await request(app.getHttpServer())
        .delete(`/users/${userId}/roles/${role.id}`)
        .set("Cookie", adminCookie)
        .expect(404);
    });
  });
});
