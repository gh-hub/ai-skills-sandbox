import { LikesRepository } from "./likes.repository";
import { LikesService } from "./likes.service";

function createRepositoryMock(): jest.Mocked<LikesRepository> {
  return {
    insertLike: jest.fn(),
    countAll: jest.fn(),
    getStatsAggregate: jest.fn(),
    countWithStory: jest.fn(),
    getStoryPage: jest.fn(),
  } as unknown as jest.Mocked<LikesRepository>;
}

describe("LikesService", () => {
  describe("create", () => {
    it("passes the dto's story/hoursSaved to the repository and converts createdAt to an ISO string", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLike.mockResolvedValue({
        id: "1",
        createdAt,
        story: "hi",
        hoursSaved: 5,
        userId: null,
      });
      const service = new LikesService(repository);

      const result = await service.create({ story: "hi", hoursSaved: 5 }, null);

      expect(repository.insertLike).toHaveBeenCalledWith({
        story: "hi",
        hoursSaved: 5,
        userId: undefined,
      });
      expect(result).toEqual({
        id: "1",
        createdAt: createdAt.toISOString(),
        story: "hi",
        hoursSaved: 5,
      });
    });

    it("passes the current user's id to the repository when a session is present", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLike.mockResolvedValue({
        id: "1",
        createdAt,
        story: "hi",
        hoursSaved: 5,
        userId: "user-1",
      });
      const service = new LikesService(repository);

      await service.create(
        { story: "hi", hoursSaved: 5 },
        { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
      );

      expect(repository.insertLike).toHaveBeenCalledWith({
        story: "hi",
        hoursSaved: 5,
        userId: "user-1",
      });
    });

    it("does not leak the raw user id onto the create response", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLike.mockResolvedValue({
        id: "1",
        createdAt,
        story: "hi",
        hoursSaved: 5,
        userId: "user-1",
      });
      const service = new LikesService(repository);

      const result = await service.create(
        { story: "hi", hoursSaved: 5 },
        { id: "user-1", name: "Ada Lovelace", email: "ada@example.com" },
      );

      expect(result).not.toHaveProperty("userId");
    });
  });

  describe("getCount", () => {
    it("wraps the repository's raw count in a { count } shape", async () => {
      const repository = createRepositoryMock();
      repository.countAll.mockResolvedValue(42);
      const service = new LikesService(repository);

      const result = await service.getCount();

      expect(result).toEqual({ count: 42 });
    });
  });

  describe("getStats", () => {
    it("null-coalesces a null sum() result to 0 before computing stats", async () => {
      const repository = createRepositoryMock();
      repository.getStatsAggregate.mockResolvedValue({
        totalLikes: 2,
        likesWithHoursReported: 0,
        reportedHoursSaved: null,
      });
      const service = new LikesService(repository);

      const result = await service.getStats();

      expect(result).toEqual({
        totalLikes: 2,
        likesWithHoursReported: 0,
        reportedHoursSaved: 0,
        percentWithoutHoursReported: 100,
        averageHoursPerReport: 0,
        estimatedTotalHoursSaved: 0,
      });
    });

    it("converts a numeric-string sum() result to a number before computing stats", async () => {
      const repository = createRepositoryMock();
      repository.getStatsAggregate.mockResolvedValue({
        totalLikes: 4,
        likesWithHoursReported: 2,
        reportedHoursSaved: "30",
      });
      const service = new LikesService(repository);

      const result = await service.getStats();

      expect(result).toEqual({
        totalLikes: 4,
        likesWithHoursReported: 2,
        reportedHoursSaved: 30,
        percentWithoutHoursReported: 50,
        averageHoursPerReport: 15,
        estimatedTotalHoursSaved: 60,
      });
    });
  });

  describe("getPage", () => {
    it("computes offset from page/limit, converts row createdAt to ISO strings, and totalPages from total/limit", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-05-01T00:00:00.000Z");
      repository.countWithStory.mockResolvedValue(25);
      repository.getStoryPage.mockResolvedValue([
        { id: "1", createdAt, story: "a", hoursSaved: null, attributedUserName: null },
      ]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 3, limit: 10 });

      expect(repository.getStoryPage).toHaveBeenCalledWith(10, 20);
      expect(result).toEqual({
        items: [
          {
            id: "1",
            createdAt: createdAt.toISOString(),
            story: "a",
            hoursSaved: null,
            attributedUserName: null,
          },
        ],
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
      });
    });

    it("surfaces the attributing user's name on a feed item when the like is attributed", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-05-01T00:00:00.000Z");
      repository.countWithStory.mockResolvedValue(1);
      repository.getStoryPage.mockResolvedValue([
        { id: "1", createdAt, story: "a", hoursSaved: null, attributedUserName: "Ada Lovelace" },
      ]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 1, limit: 10 });

      expect(result.items[0].attributedUserName).toBe("Ada Lovelace");
    });

    it("returns an empty items array and correct totalPages for a page beyond the total", async () => {
      const repository = createRepositoryMock();
      repository.countWithStory.mockResolvedValue(5);
      repository.getStoryPage.mockResolvedValue([]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 10, limit: 10 });

      expect(repository.getStoryPage).toHaveBeenCalledWith(10, 90);
      expect(result).toEqual({
        items: [],
        total: 5,
        page: 10,
        limit: 10,
        totalPages: 1,
      });
    });
  });
});
