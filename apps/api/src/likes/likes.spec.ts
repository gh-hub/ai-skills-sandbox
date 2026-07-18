import path from "node:path";
import { Pool } from "pg";
import { drizzle } from "drizzle-orm/node-postgres";
import { migrate } from "drizzle-orm/node-postgres/migrator";
import { PostgreSqlContainer, StartedPostgreSqlContainer } from "@testcontainers/postgresql";
import { Test } from "@nestjs/testing";
import { INestApplication, ValidationPipe } from "@nestjs/common";
import request from "supertest";

describe("Likes", () => {
  let container: StartedPostgreSqlContainer;
  let migrationPool: Pool;
  let appPool: Pool;
  let app: INestApplication;

  beforeAll(async () => {
    container = await new PostgreSqlContainer("postgres:16-alpine").start();
    process.env.DATABASE_URL = container.getConnectionUri();

    migrationPool = new Pool({ connectionString: process.env.DATABASE_URL });
    await migrate(drizzle(migrationPool), {
      migrationsFolder: path.join(__dirname, "../../drizzle"),
    });

    const { AppModule } = await import("../app.module");
    const { pool } = await import("../db/client");
    appPool = pool;

    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();

    app = moduleRef.createNestApplication();
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
});
