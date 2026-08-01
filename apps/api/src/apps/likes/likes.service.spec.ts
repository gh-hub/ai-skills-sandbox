import { BadRequestException } from "@nestjs/common";
import { LikesRepository } from "./likes.repository";
import { LikesService } from "./likes.service";

function createRepositoryMock(): jest.Mocked<LikesRepository> {
  return {
    insertLikeWithAwards: jest.fn(),
    countAll: jest.fn(),
    getStatsAggregate: jest.fn(),
    countWithStory: jest.fn(),
    getStoryPage: jest.fn(),
    getAwardsForLikeIds: jest.fn(),
  } as unknown as jest.Mocked<LikesRepository>;
}

describe("LikesService", () => {
  describe("create", () => {
    it("passes the dto's story/hoursSaved to the repository and converts createdAt to an ISO string", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLikeWithAwards.mockResolvedValue({
        success: true,
        like: { id: "1", createdAt, story: "hi", hoursSaved: 5, userId: null },
        awards: [],
      });
      const service = new LikesService(repository);

      const result = await service.create({ story: "hi", hoursSaved: 5 }, null);

      expect(repository.insertLikeWithAwards).toHaveBeenCalledWith(
        { story: "hi", hoursSaved: 5, userId: undefined },
        [],
      );
      expect(result).toEqual({
        id: "1",
        createdAt: createdAt.toISOString(),
        story: "hi",
        hoursSaved: 5,
        awards: [],
      });
    });

    it("passes the current user's id to the repository when a session is present", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLikeWithAwards.mockResolvedValue({
        success: true,
        like: { id: "1", createdAt, story: "hi", hoursSaved: 5, userId: "user-1" },
        awards: [],
      });
      const service = new LikesService(repository);

      await service.create(
        { story: "hi", hoursSaved: 5 },
        { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", roles: [] },
      );

      expect(repository.insertLikeWithAwards).toHaveBeenCalledWith(
        { story: "hi", hoursSaved: 5, userId: "user-1" },
        [],
      );
    });

    it("does not leak the raw user id onto the create response", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLikeWithAwards.mockResolvedValue({
        success: true,
        like: { id: "1", createdAt, story: "hi", hoursSaved: 5, userId: "user-1" },
        awards: [],
      });
      const service = new LikesService(repository);

      const result = await service.create(
        { story: "hi", hoursSaved: 5 },
        { id: "user-1", name: "Ada Lovelace", email: "ada@example.com", roles: [] },
      );

      expect(result).not.toHaveProperty("userId");
    });

    it("passes the dto's awardIds through to the repository, defaulting to an empty array when omitted", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLikeWithAwards.mockResolvedValue({
        success: true,
        like: { id: "1", createdAt, story: "hi", hoursSaved: 5, userId: null },
        awards: [{ id: "award-1", title: "Bug Slayer", icon: "🐛" }],
      });
      const service = new LikesService(repository);

      await service.create({ story: "hi", hoursSaved: 5, awardIds: ["award-1"] }, null);

      expect(repository.insertLikeWithAwards).toHaveBeenCalledWith(
        { story: "hi", hoursSaved: 5, userId: undefined },
        ["award-1"],
      );
    });

    it("includes the attached award summaries returned by the repository on the create response", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertLikeWithAwards.mockResolvedValue({
        success: true,
        like: { id: "1", createdAt, story: "hi", hoursSaved: 5, userId: null },
        awards: [{ id: "award-1", title: "Bug Slayer", icon: "🐛" }],
      });
      const service = new LikesService(repository);

      const result = await service.create({ story: "hi", hoursSaved: 5, awardIds: ["award-1"] }, null);

      expect(result.awards).toEqual([{ id: "award-1", title: "Bug Slayer", icon: "🐛" }]);
    });

    it("throws a BadRequestException and never inspects a like row when the repository reports missing awardIds", async () => {
      const repository = createRepositoryMock();
      repository.insertLikeWithAwards.mockResolvedValue({
        success: false,
        missingAwardIds: ["does-not-exist"],
      });
      const service = new LikesService(repository);

      await expect(
        service.create({ story: "hi", awardIds: ["does-not-exist"] }, null),
      ).rejects.toThrow(BadRequestException);
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
      repository.getAwardsForLikeIds.mockResolvedValue([]);
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
            awards: [],
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
      repository.getAwardsForLikeIds.mockResolvedValue([]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 1, limit: 10 });

      expect(result.items[0].attributedUserName).toBe("Ada Lovelace");
    });

    it("returns an empty items array and correct totalPages for a page beyond the total", async () => {
      const repository = createRepositoryMock();
      repository.countWithStory.mockResolvedValue(5);
      repository.getStoryPage.mockResolvedValue([]);
      repository.getAwardsForLikeIds.mockResolvedValue([]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 10, limit: 10 });

      expect(repository.getStoryPage).toHaveBeenCalledWith(10, 90);
      expect(repository.getAwardsForLikeIds).toHaveBeenCalledWith([]);
      expect(result).toEqual({
        items: [],
        total: 5,
        page: 10,
        limit: 10,
        totalPages: 1,
      });
    });

    it("groups awards for each feed item by like id, looked up in a single call with all page like ids", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-05-01T00:00:00.000Z");
      repository.countWithStory.mockResolvedValue(2);
      repository.getStoryPage.mockResolvedValue([
        { id: "like-1", createdAt, story: "a", hoursSaved: null, attributedUserName: null },
        { id: "like-2", createdAt, story: "b", hoursSaved: null, attributedUserName: null },
      ]);
      repository.getAwardsForLikeIds.mockResolvedValue([
        { likeId: "like-1", id: "award-1", title: "Bug Slayer", icon: "🐛" },
        { likeId: "like-1", id: "award-2", title: "Speed Demon", icon: "⚡" },
        { likeId: "like-2", id: "award-1", title: "Bug Slayer", icon: "🐛" },
      ]);
      const service = new LikesService(repository);

      const result = await service.getPage({ page: 1, limit: 10 });

      expect(repository.getAwardsForLikeIds).toHaveBeenCalledWith(["like-1", "like-2"]);
      expect(result.items[0].awards).toEqual([
        { id: "award-1", title: "Bug Slayer", icon: "🐛" },
        { id: "award-2", title: "Speed Demon", icon: "⚡" },
      ]);
      expect(result.items[1].awards).toEqual([{ id: "award-1", title: "Bug Slayer", icon: "🐛" }]);
    });
  });
});
