import { users } from "../../db/schema";
import { UsersRepository } from "./users.repository";
import type { DbClient } from "../../db/db.module";

type ChainMock = Record<string, jest.Mock> & { then: PromiseLike<unknown>["then"] };

const CHAIN_METHODS = ["select", "insert", "from", "where", "values", "returning"];

function createDbMock(result: unknown): ChainMock {
  const chain = {} as ChainMock;

  for (const method of CHAIN_METHODS) {
    chain[method] = jest.fn(() => chain);
  }

  chain.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);

  return chain;
}

describe("UsersRepository", () => {
  describe("insert", () => {
    it("issues an insert().values().returning() and returns the raw inserted row unmodified", async () => {
      const insertedRow = {
        id: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };
      const db = createDbMock([insertedRow]);
      const repository = new UsersRepository(db as unknown as DbClient);

      const result = await repository.insert({
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
      });

      expect(db.insert).toHaveBeenCalledWith(users);
      expect(db.values).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
      });
      expect(db.returning).toHaveBeenCalledWith();
      expect(result).toBe(insertedRow);
    });
  });

  describe("findByEmail", () => {
    it("issues a select().from(users).where(eq(email, ...)) and returns the matching row", async () => {
      const row = {
        id: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };
      const db = createDbMock([row]);
      const repository = new UsersRepository(db as unknown as DbClient);

      const result = await repository.findByEmail("ada@example.com");

      expect(db.select).toHaveBeenCalledWith();
      expect(db.from).toHaveBeenCalledWith(users);
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(row);
    });

    it("returns null when no row matches the email", async () => {
      const db = createDbMock([]);
      const repository = new UsersRepository(db as unknown as DbClient);

      const result = await repository.findByEmail("missing@example.com");

      expect(result).toBeNull();
    });
  });

  describe("findById", () => {
    it("issues a select().from(users).where(eq(id, ...)) and returns the matching row", async () => {
      const row = {
        id: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
      };
      const db = createDbMock([row]);
      const repository = new UsersRepository(db as unknown as DbClient);

      const result = await repository.findById("1");

      expect(db.select).toHaveBeenCalledWith();
      expect(db.from).toHaveBeenCalledWith(users);
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(row);
    });

    it("returns null when no row matches the id", async () => {
      const db = createDbMock([]);
      const repository = new UsersRepository(db as unknown as DbClient);

      const result = await repository.findById("missing-id");

      expect(result).toBeNull();
    });
  });
});
