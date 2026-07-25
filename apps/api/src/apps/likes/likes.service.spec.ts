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
      });
      const service = new LikesService(repository);

      const result = await service.create({ story: "hi", hoursSaved: 5 });

      expect(repository.insertLike).toHaveBeenCalledWith({ story: "hi", hoursSaved: 5 });
      expect(result).toEqual({
        id: "1",
        createdAt: createdAt.toISOString(),
        story: "hi",
        hoursSaved: 5,
      });
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
        { id: "1", createdAt, story: "a", hoursSaved: null },
      ]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 3, limit: 10 });

      expect(repository.getStoryPage).toHaveBeenCalledWith(10, 20);
      expect(result).toEqual({
        items: [{ id: "1", createdAt: createdAt.toISOString(), story: "a", hoursSaved: null }],
        total: 25,
        page: 3,
        limit: 10,
        totalPages: 3,
      });
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
