import { ConflictException, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import { UsersRepository, type UserRow } from "../users/users.repository";
import { AuthService } from "./auth.service";

jest.mock("bcrypt");

function createUsersRepositoryMock(): jest.Mocked<UsersRepository> {
  return {
    insert: jest.fn(),
    findByEmail: jest.fn(),
    findById: jest.fn(),
    findRolesByUserId: jest.fn().mockResolvedValue([]),
  } as unknown as jest.Mocked<UsersRepository>;
}

function createJwtServiceMock(): jest.Mocked<JwtService> {
  return {
    sign: jest.fn(),
    verify: jest.fn(),
  } as unknown as jest.Mocked<JwtService>;
}

function createUserRow(overrides: Partial<UserRow> = {}): UserRow {
  return {
    id: "1",
    name: "Ada Lovelace",
    email: "ada@example.com",
    passwordHash: "hashed-password",
    createdAt: new Date("2024-01-01T00:00:00.000Z"),
    ...overrides,
  };
}

describe("AuthService", () => {
  describe("signup", () => {
    it("hashes the password, creates the user, and issues a session token", async () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      usersRepository.findByEmail.mockResolvedValue(null);
      usersRepository.insert.mockResolvedValue(createUserRow({ passwordHash: "hashed-password" }));
      (bcrypt.hash as jest.Mock).mockResolvedValue("hashed-password");
      jwtService.sign.mockReturnValue("signed-token");
      const service = new AuthService(usersRepository, jwtService);

      const result = await service.signup({
        name: "Ada Lovelace",
        email: "ada@example.com",
        password: "secret1",
      });

      expect(bcrypt.hash).toHaveBeenCalledWith("secret1", expect.any(Number));
      expect(usersRepository.insert).toHaveBeenCalledWith({
        name: "Ada Lovelace",
        email: "ada@example.com",
        passwordHash: "hashed-password",
      });
      expect(jwtService.sign).toHaveBeenCalledWith({
        sub: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        roles: [],
      });
      expect(result).toEqual({
        user: { id: "1", name: "Ada Lovelace", email: "ada@example.com", roles: [] },
        token: "signed-token",
      });
    });

    it("rejects a duplicate email with a conflict error", async () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      usersRepository.findByEmail.mockResolvedValue(createUserRow());
      const service = new AuthService(usersRepository, jwtService);

      await expect(
        service.signup({ name: "Ada Lovelace", email: "ada@example.com", password: "secret1" }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(usersRepository.insert).not.toHaveBeenCalled();
    });
  });

  describe("login", () => {
    it("verifies the bcrypt hash and issues a session token on success", async () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      usersRepository.findByEmail.mockResolvedValue(createUserRow());
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue("signed-token");
      const service = new AuthService(usersRepository, jwtService);

      const result = await service.login({ email: "ada@example.com", password: "secret1" });

      expect(bcrypt.compare).toHaveBeenCalledWith("secret1", "hashed-password");
      expect(result).toEqual({
        user: { id: "1", name: "Ada Lovelace", email: "ada@example.com", roles: [] },
        token: "signed-token",
      });
    });

    it("looks up the user's roles and includes them in both the token payload and the returned user", async () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      usersRepository.findByEmail.mockResolvedValue(createUserRow());
      usersRepository.findRolesByUserId.mockResolvedValue(["ADMIN", "OPERATOR"]);
      (bcrypt.compare as jest.Mock).mockResolvedValue(true);
      jwtService.sign.mockReturnValue("signed-token");
      const service = new AuthService(usersRepository, jwtService);

      const result = await service.login({ email: "ada@example.com", password: "secret1" });

      expect(usersRepository.findRolesByUserId).toHaveBeenCalledWith("1");
      expect(jwtService.sign).toHaveBeenCalledWith(
        expect.objectContaining({ roles: ["ADMIN", "OPERATOR"] }),
      );
      expect(result.user.roles).toEqual(["ADMIN", "OPERATOR"]);
    });

    it("rejects an unknown email and a wrong password with the identical generic failure", async () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      const service = new AuthService(usersRepository, jwtService);

      usersRepository.findByEmail.mockResolvedValueOnce(null);
      const unknownEmailError: unknown = await service
        .login({ email: "missing@example.com", password: "secret1" })
        .catch((error) => error);

      usersRepository.findByEmail.mockResolvedValueOnce(createUserRow());
      (bcrypt.compare as jest.Mock).mockResolvedValueOnce(false);
      const wrongPasswordError: unknown = await service
        .login({ email: "ada@example.com", password: "wrong-password" })
        .catch((error) => error);

      expect(unknownEmailError).toBeInstanceOf(UnauthorizedException);
      expect(wrongPasswordError).toBeInstanceOf(UnauthorizedException);
      expect((unknownEmailError as UnauthorizedException).message).toBe(
        (wrongPasswordError as UnauthorizedException).message,
      );
    });
  });

  describe("verifySessionToken", () => {
    it("returns null when no token is given", () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      const service = new AuthService(usersRepository, jwtService);

      expect(service.verifySessionToken(undefined)).toBeNull();
      expect(jwtService.verify).not.toHaveBeenCalled();
    });

    it("returns the decoded user when the token is valid", () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      jwtService.verify.mockReturnValue({
        sub: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        roles: ["ADMIN"],
      });
      const service = new AuthService(usersRepository, jwtService);

      const result = service.verifySessionToken("valid-token");

      expect(result).toEqual({
        id: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        roles: ["ADMIN"],
      });
    });

    it("defaults roles to an empty array for a stale token issued before roles existed", () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      jwtService.verify.mockReturnValue({ sub: "1", name: "Ada Lovelace", email: "ada@example.com" });
      const service = new AuthService(usersRepository, jwtService);

      const result = service.verifySessionToken("stale-token");

      expect(result).toEqual({
        id: "1",
        name: "Ada Lovelace",
        email: "ada@example.com",
        roles: [],
      });
    });

    it("returns null when the token is invalid or expired", () => {
      const usersRepository = createUsersRepositoryMock();
      const jwtService = createJwtServiceMock();
      jwtService.verify.mockImplementation(() => {
        throw new Error("jwt expired");
      });
      const service = new AuthService(usersRepository, jwtService);

      expect(service.verifySessionToken("expired-token")).toBeNull();
    });
  });
});
