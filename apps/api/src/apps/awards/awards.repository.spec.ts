import { awards, likeAwards } from "../../db/schema";
import { AwardsRepository } from "./awards.repository";
import type { DbClient } from "../../db/db.module";

type ChainMock = Record<string, jest.Mock> & { then: PromiseLike<unknown>["then"] };

const CHAIN_METHODS = [
  "select",
  "insert",
  "update",
  "delete",
  "from",
  "leftJoin",
  "where",
  "groupBy",
  "orderBy",
  "values",
  "set",
  "returning",
];

function createDbMock(result: unknown): ChainMock {
  const chain = {} as ChainMock;

  for (const method of CHAIN_METHODS) {
    chain[method] = jest.fn(() => chain);
  }

  chain.then = (onFulfilled, onRejected) => Promise.resolve(result).then(onFulfilled, onRejected);

  return chain;
}

describe("AwardsRepository", () => {
  describe("insertAward", () => {
    it("issues an insert().values().returning() and returns the raw inserted row unmodified", async () => {
      const insertedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        title: "Bug Slayer",
        description: "Squashed a nasty bug",
        icon: "🐛",
      };
      const db = createDbMock([insertedRow]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.insertAward({
        title: "Bug Slayer",
        description: "Squashed a nasty bug",
        icon: "🐛",
      });

      expect(db.insert).toHaveBeenCalledWith(awards);
      expect(db.values).toHaveBeenCalledWith({
        title: "Bug Slayer",
        description: "Squashed a nasty bug",
        icon: "🐛",
      });
      expect(db.returning).toHaveBeenCalledWith();
      expect(result).toBe(insertedRow);
    });
  });

  describe("findAll", () => {
    it("issues select().from(awards).leftJoin(likeAwards).groupBy(awards.id).orderBy() and returns the raw rows unmodified", async () => {
      const rows = [
        {
          id: "1",
          createdAt: new Date("2024-01-01T00:00:00.000Z"),
          title: "Bug Slayer",
          description: "Squashed a nasty bug",
          icon: "🐛",
          givenCount: 3,
        },
      ];
      const db = createDbMock(rows);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.findAll();

      expect(db.select).toHaveBeenCalledWith({
        id: expect.anything(),
        createdAt: expect.anything(),
        title: expect.anything(),
        description: expect.anything(),
        icon: expect.anything(),
        givenCount: expect.anything(),
      });
      expect(db.from).toHaveBeenCalledWith(awards);
      expect(db.leftJoin).toHaveBeenCalledWith(likeAwards, expect.anything());
      expect(db.groupBy).toHaveBeenCalledWith(awards.id);
      expect(db.orderBy).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(rows);
    });
  });

  describe("findById", () => {
    it("issues the same joined/grouped query filtered by id and returns the single row when found", async () => {
      const row = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        title: "Bug Slayer",
        description: "Squashed a nasty bug",
        icon: "🐛",
        givenCount: 3,
      };
      const db = createDbMock([row]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.findById("1");

      expect(db.from).toHaveBeenCalledWith(awards);
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(db.groupBy).toHaveBeenCalledWith(awards.id);
      expect(result).toBe(row);
    });

    it("returns undefined when no award matches the id", async () => {
      const db = createDbMock([]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.findById("missing");

      expect(result).toBeUndefined();
    });
  });

  describe("updateAward", () => {
    it("issues an update().set().where().returning() and returns the raw updated row when found", async () => {
      const updatedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        title: "New Title",
        description: "New description",
        icon: "🐛",
      };
      const db = createDbMock([updatedRow]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.updateAward("1", { title: "New Title" });

      expect(db.update).toHaveBeenCalledWith(awards);
      expect(db.set).toHaveBeenCalledWith({ title: "New Title" });
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(db.returning).toHaveBeenCalledWith();
      expect(result).toBe(updatedRow);
    });

    it("returns undefined when no award matches the id", async () => {
      const db = createDbMock([]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.updateAward("missing", { title: "New Title" });

      expect(result).toBeUndefined();
    });
  });

  describe("deleteAward", () => {
    it("issues a delete().where().returning() and returns the raw deleted row when found", async () => {
      const deletedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        title: "Bug Slayer",
        description: "Squashed a nasty bug",
        icon: "🐛",
      };
      const db = createDbMock([deletedRow]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.deleteAward("1");

      expect(db.delete).toHaveBeenCalledWith(awards);
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(db.returning).toHaveBeenCalledWith();
      expect(result).toBe(deletedRow);
    });

    it("returns undefined when no award matches the id", async () => {
      const db = createDbMock([]);
      const repository = new AwardsRepository(db as unknown as DbClient);

      const result = await repository.deleteAward("missing");

      expect(result).toBeUndefined();
    });
  });
});
