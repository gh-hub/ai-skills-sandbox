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

describe("Roles", () => {
  let container: StartedPostgreSqlContainer;
  let migrationPool: Pool;
  let appPool: Pool;
  let db: DbClient;
  let app: INestApplication;
  let adminCookie: string;

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

  async function createCustomRole(cookie: string, name: string): Promise<{ id: string; name: string }> {
    const response = await request(app.getHttpServer())
      .post("/roles")
      .set("Cookie", cookie)
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
    const signupResponse = await request(app.getHttpServer())
      .post("/auth/signup")
      .send({ name: "Ada Lovelace", email: uniqueEmail("roles-admin"), password: "secret1" })
      .expect(201);
    await grantRole(signupResponse.body.id, adminRole.id);
    adminCookie = await loginAs(signupResponse.body.email);
  });

  afterAll(async () => {
    await app?.close();
    await appPool?.end();
    await migrationPool?.end();
    await container?.stop();
  });

  describe("GET /roles", () => {
    it("returns 401 when there is no logged-in user", async () => {
      await request(app.getHttpServer()).get("/roles").expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const noRoleCookie = await loginAs((await signupUser("get-no-role")).email);

      await request(app.getHttpServer()).get("/roles").set("Cookie", noRoleCookie).expect(403);
    });

    it("returns 200 with the built-in ADMIN and OPERATOR roles when logged in as ADMIN", async () => {
      const response = await request(app.getHttpServer())
        .get("/roles")
        .set("Cookie", adminCookie)
        .expect(200);

      const names = response.body.map((role: { name: string }) => role.name);
      expect(names).toContain("ADMIN");
      expect(names).toContain("OPERATOR");
      const admin = response.body.find((role: { name: string }) => role.name === "ADMIN");
      expect(admin).toMatchObject({ name: "ADMIN", isBuiltIn: true });
    });

    it("includes a role created via POST", async () => {
      const name = uniqueRoleName("Listed Role");
      await createCustomRole(adminCookie, name);

      const response = await request(app.getHttpServer())
        .get("/roles")
        .set("Cookie", adminCookie)
        .expect(200);

      const names = response.body.map((role: { name: string }) => role.name);
      expect(names).toContain(name);
    });
  });

  describe("POST /roles", () => {
    it("returns 401 when there is no logged-in user", async () => {
      await request(app.getHttpServer())
        .post("/roles")
        .send({ name: uniqueRoleName("Anon Role") })
        .expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const noRoleCookie = await loginAs((await signupUser("post-no-role")).email);

      await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", noRoleCookie)
        .send({ name: uniqueRoleName("No Role Attempt") })
        .expect(403);
    });

    it("returns 201 with the created custom role when logged in as ADMIN", async () => {
      const name = uniqueRoleName("Created Role");

      const response = await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", adminCookie)
        .send({ name })
        .expect(201);

      expect(response.body).toMatchObject({ name, isBuiltIn: false });
      expect(response.body.id).toEqual(expect.any(String));
    });

    it("rejects a missing name", async () => {
      await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", adminCookie)
        .send({})
        .expect(400);
    });

    it("returns 409 when creating a role with a name that's already taken", async () => {
      const name = uniqueRoleName("Duplicate Role");
      await createCustomRole(adminCookie, name);

      await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", adminCookie)
        .send({ name })
        .expect(409);
    });

    it("returns 409 when attempting to recreate the built-in ADMIN role", async () => {
      await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", adminCookie)
        .send({ name: "ADMIN" })
        .expect(409);
    });

    it("returns 409 when attempting to recreate the built-in OPERATOR role", async () => {
      await request(app.getHttpServer())
        .post("/roles")
        .set("Cookie", adminCookie)
        .send({ name: "OPERATOR" })
        .expect(409);
    });
  });

  describe("DELETE /roles/:id", () => {
    it("returns 401 when there is no logged-in user", async () => {
      const created = await createCustomRole(adminCookie, uniqueRoleName("Anon Delete"));

      await request(app.getHttpServer()).delete(`/roles/${created.id}`).expect(401);
    });

    it("returns 403 when logged in with no role", async () => {
      const created = await createCustomRole(adminCookie, uniqueRoleName("No Role Delete"));
      const noRoleCookie = await loginAs((await signupUser("delete-no-role")).email);

      await request(app.getHttpServer())
        .delete(`/roles/${created.id}`)
        .set("Cookie", noRoleCookie)
        .expect(403);
    });

    it("returns 404 for an id that does not exist", async () => {
      await request(app.getHttpServer())
        .delete("/roles/00000000-0000-0000-0000-000000000000")
        .set("Cookie", adminCookie)
        .expect(404);
    });

    it("returns 400 when attempting to delete the built-in ADMIN role", async () => {
      const adminRole = await findRoleByName("ADMIN");

      await request(app.getHttpServer())
        .delete(`/roles/${adminRole.id}`)
        .set("Cookie", adminCookie)
        .expect(400);
    });

    it("returns 400 when attempting to delete the built-in OPERATOR role", async () => {
      const operatorRole = await findRoleByName("OPERATOR");

      await request(app.getHttpServer())
        .delete(`/roles/${operatorRole.id}`)
        .set("Cookie", adminCookie)
        .expect(400);
    });

    it("returns 400 even when force=true is passed for a built-in role", async () => {
      const adminRole = await findRoleByName("ADMIN");

      await request(app.getHttpServer())
        .delete(`/roles/${adminRole.id}?force=true`)
        .set("Cookie", adminCookie)
        .expect(400);
    });

    it("deletes and returns 204 for a custom role not assigned to any user", async () => {
      const created = await createCustomRole(adminCookie, uniqueRoleName("Unused Role"));

      await request(app.getHttpServer())
        .delete(`/roles/${created.id}`)
        .set("Cookie", adminCookie)
        .expect(204);

      const remaining = await db.select().from(roles).where(eq(roles.id, created.id));
      expect(remaining).toHaveLength(0);
    });

    it("returns 409 with the affected users when the role is assigned and force is not set", async () => {
      const created = await createCustomRole(adminCookie, uniqueRoleName("In Use Role"));
      const { id: userId, email } = await signupUser("in-use-target");
      await grantRole(userId, created.id);

      const response = await request(app.getHttpServer())
        .delete(`/roles/${created.id}`)
        .set("Cookie", adminCookie)
        .expect(409);

      expect(response.body.affectedUsers).toEqual(
        expect.arrayContaining([expect.objectContaining({ name: "in-use-target", email })]),
      );

      const stillExists = await db.select().from(roles).where(eq(roles.id, created.id));
      expect(stillExists).toHaveLength(1);
    });

    it("force-deletes an in-use role and cascades its user_roles rows", async () => {
      const created = await createCustomRole(adminCookie, uniqueRoleName("Force Delete Role"));
      const { id: userId } = await signupUser("force-delete-target");
      await grantRole(userId, created.id);

      await request(app.getHttpServer())
        .delete(`/roles/${created.id}?force=true`)
        .set("Cookie", adminCookie)
        .expect(204);

      const remainingRole = await db.select().from(roles).where(eq(roles.id, created.id));
      expect(remainingRole).toHaveLength(0);

      const remainingAssignments = await db
        .select()
        .from(userRoles)
        .where(eq(userRoles.roleId, created.id));
      expect(remainingAssignments).toHaveLength(0);
    });
  });
});
