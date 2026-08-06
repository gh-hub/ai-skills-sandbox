import { NotFoundException } from "@nestjs/common";
import { AwardsRepository } from "./awards.repository";
import { AwardsService } from "./awards.service";

function createRepositoryMock(): jest.Mocked<AwardsRepository> {
  return {
    insertAward: jest.fn(),
    findAll: jest.fn(),
    findById: jest.fn(),
    updateAward: jest.fn(),
    deleteAward: jest.fn(),
  } as unknown as jest.Mocked<AwardsRepository>;
}

describe("AwardsService", () => {
  describe("getAll", () => {
    it("converts each row's createdAt to an ISO string and passes givenCount through unmodified", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.findAll.mockResolvedValue([
        { id: "1", createdAt, title: "Bug Slayer", description: "desc", icon: "🐛", givenCount: 3 },
      ]);
      const service = new AwardsService(repository);

      const result = await service.getAll();

      expect(result).toEqual([
        {
          id: "1",
          createdAt: createdAt.toISOString(),
          title: "Bug Slayer",
          description: "desc",
          icon: "🐛",
          givenCount: 3,
        },
      ]);
    });
  });

  describe("getById", () => {
    it("returns the mapped award when found", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.findById.mockResolvedValue({
        id: "1",
        createdAt,
        title: "Bug Slayer",
        description: "desc",
        icon: "🐛",
        givenCount: 3,
      });
      const service = new AwardsService(repository);

      const result = await service.getById("1");

      expect(result).toEqual({
        id: "1",
        createdAt: createdAt.toISOString(),
        title: "Bug Slayer",
        description: "desc",
        icon: "🐛",
        givenCount: 3,
      });
    });

    it("throws NotFoundException when no award matches the id", async () => {
      const repository = createRepositoryMock();
      repository.findById.mockResolvedValue(undefined);
      const service = new AwardsService(repository);

      await expect(service.getById("missing")).rejects.toThrow(NotFoundException);
    });
  });

  describe("create", () => {
    it("passes the dto to the repository and returns the created award with givenCount 0", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.insertAward.mockResolvedValue({
        id: "1",
        createdAt,
        title: "Bug Slayer",
        description: "desc",
        icon: "🐛",
      });
      const service = new AwardsService(repository);

      const result = await service.create({ title: "Bug Slayer", description: "desc", icon: "🐛" });

      expect(repository.insertAward).toHaveBeenCalledWith({
        title: "Bug Slayer",
        description: "desc",
        icon: "🐛",
      });
      expect(result).toEqual({
        id: "1",
        createdAt: createdAt.toISOString(),
        title: "Bug Slayer",
        description: "desc",
        icon: "🐛",
        givenCount: 0,
      });
    });
  });

  describe("update", () => {
    it("updates then returns the fresh award (with current givenCount) when found", async () => {
      const repository = createRepositoryMock();
      const createdAt = new Date("2024-03-01T12:00:00.000Z");
      repository.updateAward.mockResolvedValue({
        id: "1",
        createdAt,
        title: "New Title",
        description: "desc",
        icon: "🐛",
      });
      repository.findById.mockResolvedValue({
        id: "1",
        createdAt,
        title: "New Title",
        description: "desc",
        icon: "🐛",
        givenCount: 5,
      });
      const service = new AwardsService(repository);

      const result = await service.update("1", { title: "New Title" });

      expect(repository.updateAward).toHaveBeenCalledWith("1", { title: "New Title" });
      expect(result).toEqual({
        id: "1",
        createdAt: createdAt.toISOString(),
        title: "New Title",
        description: "desc",
        icon: "🐛",
        givenCount: 5,
      });
    });

    it("throws NotFoundException when no award matches the id", async () => {
      const repository = createRepositoryMock();
      repository.updateAward.mockResolvedValue(undefined);
      const service = new AwardsService(repository);

      await expect(service.update("missing", { title: "New Title" })).rejects.toThrow(NotFoundException);
    });
  });

  describe("remove", () => {
    it("resolves without error when the award is deleted", async () => {
      const repository = createRepositoryMock();
      repository.deleteAward.mockResolvedValue({
        id: "1",
        createdAt: new Date(),
        title: "Bug Slayer",
        description: "desc",
        icon: "🐛",
      });
      const service = new AwardsService(repository);

      await expect(service.remove("1")).resolves.toBeUndefined();
    });

    it("throws NotFoundException when no award matches the id", async () => {
      const repository = createRepositoryMock();
      repository.deleteAward.mockResolvedValue(undefined);
      const service = new AwardsService(repository);

      await expect(service.remove("missing")).rejects.toThrow(NotFoundException);
    });
  });
});
