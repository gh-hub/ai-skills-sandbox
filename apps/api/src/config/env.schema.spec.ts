import { validateEnv } from "./env.schema";

describe("validateEnv", () => {
  it("throws when a required variable is missing", () => {
    expect(() =>
      validateEnv({ JWT_SECRET: "secret", NODE_ENV: "test" }),
    ).toThrow();
  });

  it("parses a valid configuration", () => {
    const result = validateEnv({
      PORT: "4000",
      DATABASE_URL: "postgres://localhost:5432/db",
      JWT_SECRET: "secret",
      NODE_ENV: "test",
    });

    expect(result).toEqual({
      PORT: 4000,
      DATABASE_URL: "postgres://localhost:5432/db",
      JWT_SECRET: "secret",
      NODE_ENV: "test",
    });
  });

  it("defaults PORT to 3000 when absent", () => {
    const result = validateEnv({
      DATABASE_URL: "postgres://localhost:5432/db",
      JWT_SECRET: "secret",
      NODE_ENV: "test",
    });

    expect(result.PORT).toBe(3000);
  });
});
