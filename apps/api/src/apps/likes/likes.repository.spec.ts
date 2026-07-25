import { likes, users } from "../../db/schema";
import { LikesRepository } from "./likes.repository";
import type { DbClient } from "../../db/db.module";

type ChainMock = Record<string, jest.Mock> & { then: PromiseLike<unknown>["then"] };

const CHAIN_METHODS = [
  "select",
  "insert",
  "from",
  "leftJoin",
  "where",
  "orderBy",
  "limit",
  "offset",
  "values",
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

describe("LikesRepository", () => {
  describe("insertLike", () => {
    it("issues an insert().values().returning() and returns the raw inserted row unmodified", async () => {
      const insertedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        story: "hi",
        hoursSaved: 3,
      };
      const db = createDbMock([insertedRow]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.insertLike({ story: "hi", hoursSaved: 3 });

      expect(db.insert).toHaveBeenCalledWith(likes);
      expect(db.values).toHaveBeenCalledWith({ story: "hi", hoursSaved: 3 });
      expect(db.returning).toHaveBeenCalledWith();
      expect(result).toBe(insertedRow);
    });

    it("passes a userId through to values() when the like is attributed to a user", async () => {
      const insertedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        story: "hi",
        hoursSaved: 3,
        userId: "user-1",
      };
      const db = createDbMock([insertedRow]);
      const repository = new LikesRepository(db as unknown as DbClient);

      await repository.insertLike({ story: "hi", hoursSaved: 3, userId: "user-1" });

      expect(db.values).toHaveBeenCalledWith({ story: "hi", hoursSaved: 3, userId: "user-1" });
    });
  });

  describe("countAll", () => {
    it("issues a plain select(count()).from(likes) and returns the raw count value", async () => {
      const db = createDbMock([{ value: 7 }]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.countAll();

      expect(db.select).toHaveBeenCalledWith({ value: expect.anything() });
      expect(db.from).toHaveBeenCalledWith(likes);
      expect(db.where).not.toHaveBeenCalled();
      expect(result).toBe(7);
    });
  });

  describe("getStatsAggregate", () => {
    it("issues a select of the count/count-with-hoursSaved/sum aggregate and returns the raw row unmodified", async () => {
      const aggregateRow = {
        totalLikes: 5,
        likesWithHoursReported: 2,
        reportedHoursSaved: "30",
      };
      const db = createDbMock([aggregateRow]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.getStatsAggregate();

      expect(db.select).toHaveBeenCalledWith({
        totalLikes: expect.anything(),
        likesWithHoursReported: expect.anything(),
        reportedHoursSaved: expect.anything(),
      });
      expect(db.from).toHaveBeenCalledWith(likes);
      expect(result).toBe(aggregateRow);
    });
  });

  describe("countWithStory", () => {
    it("issues a select(count()).from(likes).where(hasStory) and returns the raw count value", async () => {
      const db = createDbMock([{ value: 3 }]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.countWithStory();

      expect(db.select).toHaveBeenCalledWith({ value: expect.anything() });
      expect(db.from).toHaveBeenCalledWith(likes);
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(3);
    });
  });

  describe("getStoryPage", () => {
    it("issues select().from(likes).leftJoin(users).where(hasStory).orderBy(desc).limit().offset() and returns the raw rows unmodified", async () => {
      const rows = [
        {
          id: "1",
          createdAt: new Date("2024-02-02T00:00:00.000Z"),
          story: "a",
          hoursSaved: null,
          attributedUserName: null,
        },
      ];
      const db = createDbMock(rows);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.getStoryPage(10, 20);

      expect(db.select).toHaveBeenCalledWith({
        id: expect.anything(),
        createdAt: expect.anything(),
        story: expect.anything(),
        hoursSaved: expect.anything(),
        attributedUserName: expect.anything(),
      });
      expect(db.from).toHaveBeenCalledWith(likes);
      expect(db.leftJoin).toHaveBeenCalledWith(users, expect.anything());
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(db.orderBy).toHaveBeenCalledWith(expect.anything());
      expect(db.limit).toHaveBeenCalledWith(10);
      expect(db.offset).toHaveBeenCalledWith(20);
      expect(result).toBe(rows);
    });

    it("exposes the attributing user's name when a like has an authenticated user_id", async () => {
      const rows = [
        {
          id: "1",
          createdAt: new Date("2024-02-02T00:00:00.000Z"),
          story: "a",
          hoursSaved: null,
          attributedUserName: "Ada Lovelace",
        },
      ];
      const db = createDbMock(rows);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.getStoryPage(10, 0);

      expect(result[0].attributedUserName).toBe("Ada Lovelace");
    });
  });
});
