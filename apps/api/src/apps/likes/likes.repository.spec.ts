import { awards, likeAwards, likes, users } from "../../db/schema";
import { LikesRepository } from "./likes.repository";
import type { DbClient } from "../../db/db.module";

type ChainMock = Record<string, jest.Mock> & { then: PromiseLike<unknown>["then"] };

const CHAIN_METHODS = [
  "select",
  "insert",
  "from",
  "leftJoin",
  "innerJoin",
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

function createTransactionalDbMock(result: unknown): ChainMock & { transaction: jest.Mock } {
  const chain = createDbMock(result) as ChainMock & { transaction: jest.Mock };
  chain.transaction = jest.fn((callback: (tx: unknown) => unknown) => callback(chain));
  return chain;
}

function createSequentialTransactionalDbMock(
  results: unknown[],
): ChainMock & { transaction: jest.Mock } {
  let callIndex = 0;
  const chain = {} as ChainMock & { transaction: jest.Mock };

  for (const method of CHAIN_METHODS) {
    chain[method] = jest.fn(() => chain);
  }

  chain.then = (onFulfilled, onRejected) =>
    Promise.resolve(results[callIndex++]).then(onFulfilled, onRejected);
  chain.transaction = jest.fn((callback: (tx: unknown) => unknown) => callback(chain));

  return chain;
}

describe("LikesRepository", () => {
  describe("insertLikeWithAwards", () => {
    it("runs inside a single db.transaction()", async () => {
      const insertedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        story: "hi",
        hoursSaved: 3,
      };
      const db = createTransactionalDbMock([insertedRow]);
      const repository = new LikesRepository(db as unknown as DbClient);

      await repository.insertLikeWithAwards({ story: "hi", hoursSaved: 3 }, []);

      expect(db.transaction).toHaveBeenCalledTimes(1);
    });

    it("issues an insert().values().returning() for the like and returns it as a success result when awardIds is empty", async () => {
      const insertedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        story: "hi",
        hoursSaved: 3,
      };
      const db = createTransactionalDbMock([insertedRow]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.insertLikeWithAwards({ story: "hi", hoursSaved: 3 }, []);

      expect(db.insert).toHaveBeenCalledWith(likes);
      expect(db.values).toHaveBeenCalledWith({ story: "hi", hoursSaved: 3 });
      expect(db.returning).toHaveBeenCalledWith();
      expect(db.select).not.toHaveBeenCalled();
      expect(result).toEqual({ success: true, like: insertedRow, awards: [] });
    });

    it("passes a userId through to values() when the like is attributed to a user", async () => {
      const insertedRow = {
        id: "1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        story: "hi",
        hoursSaved: 3,
        userId: "user-1",
      };
      const db = createTransactionalDbMock([insertedRow]);
      const repository = new LikesRepository(db as unknown as DbClient);

      await repository.insertLikeWithAwards({ story: "hi", hoursSaved: 3, userId: "user-1" }, []);

      expect(db.values).toHaveBeenCalledWith({
        story: "hi",
        hoursSaved: 3,
        userId: "user-1",
      });
    });

    it("looks up the given awardIds, inserts one like_awards row per attached award, and returns the found award summaries", async () => {
      const foundAwards = [
        { id: "award-1", title: "Bug Slayer", icon: "🐛" },
        { id: "award-2", title: "Speed Demon", icon: "⚡" },
      ];
      const insertedRow = {
        id: "like-1",
        createdAt: new Date("2024-01-01T00:00:00.000Z"),
        story: "hi",
        hoursSaved: 3,
      };
      const db = createSequentialTransactionalDbMock([foundAwards, [insertedRow], []]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.insertLikeWithAwards(
        { story: "hi", hoursSaved: 3 },
        ["award-1", "award-2"],
      );

      expect(db.select).toHaveBeenCalledWith({
        id: expect.anything(),
        title: expect.anything(),
        icon: expect.anything(),
      });
      expect(db.from).toHaveBeenCalledWith(awards);
      expect(db.insert).toHaveBeenCalledWith(likes);
      expect(db.insert).toHaveBeenCalledWith(likeAwards);
      expect(db.values).toHaveBeenCalledWith([
        { likeId: "like-1", awardId: "award-1" },
        { likeId: "like-1", awardId: "award-2" },
      ]);
      expect(result).toEqual({ success: true, like: insertedRow, awards: foundAwards });
    });

    it("returns a failure result with the missing awardIds and inserts no likes row when an awardId does not exist", async () => {
      const foundAwards = [{ id: "award-1", title: "Bug Slayer", icon: "🐛" }];
      const db = createSequentialTransactionalDbMock([foundAwards]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.insertLikeWithAwards(
        { story: "hi", hoursSaved: 3 },
        ["award-1", "does-not-exist"],
      );

      expect(result).toEqual({ success: false, missingAwardIds: ["does-not-exist"] });
      expect(db.insert).not.toHaveBeenCalledWith(likes);
      expect(db.insert).not.toHaveBeenCalledWith(likeAwards);
    });
  });

  describe("getAwardsForLikeIds", () => {
    it("issues select().from(likeAwards).innerJoin(awards).where(inArray) and returns the raw rows unmodified", async () => {
      const rows = [{ likeId: "like-1", id: "award-1", title: "Bug Slayer", icon: "🐛" }];
      const db = createDbMock(rows);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.getAwardsForLikeIds(["like-1"]);

      expect(db.select).toHaveBeenCalledWith({
        likeId: expect.anything(),
        id: expect.anything(),
        title: expect.anything(),
        icon: expect.anything(),
      });
      expect(db.from).toHaveBeenCalledWith(likeAwards);
      expect(db.innerJoin).toHaveBeenCalledWith(awards, expect.anything());
      expect(db.where).toHaveBeenCalledWith(expect.anything());
      expect(result).toBe(rows);
    });

    it("returns an empty array without querying the database when likeIds is empty", async () => {
      const db = createDbMock([]);
      const repository = new LikesRepository(db as unknown as DbClient);

      const result = await repository.getAwardsForLikeIds([]);

      expect(db.select).not.toHaveBeenCalled();
      expect(result).toEqual([]);
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
