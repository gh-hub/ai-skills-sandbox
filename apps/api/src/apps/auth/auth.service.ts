import { ConflictException, Injectable, UnauthorizedException } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import * as bcrypt from "bcrypt";
import type { AuthUser } from "@thanks-claude/shared-types";
import { UsersRepository, type UserRow } from "../users/users.repository";
import { LoginDto } from "./dto/login.dto";
import { SignupDto } from "./dto/signup.dto";

const SALT_ROUNDS = 10;
const GENERIC_LOGIN_FAILURE_MESSAGE = "Invalid email or password";

type SessionTokenPayload = {
  sub: string;
  name: string;
  email: string;
  roles: string[];
};

export type AuthSession = {
  user: AuthUser;
  token: string;
};

@Injectable()
export class AuthService {
  constructor(
    private readonly usersRepository: UsersRepository,
    private readonly jwtService: JwtService,
  ) {}

  async signup(dto: SignupDto): Promise<AuthSession> {
    const existingUser = await this.usersRepository.findByEmail(dto.email);
    if (existingUser) {
      throw new ConflictException("Email already in use");
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
    const user = await this.usersRepository.insert({
      name: dto.name,
      email: dto.email,
      passwordHash,
    });

    return this.buildSession(user);
  }

  async login(dto: LoginDto): Promise<AuthSession> {
    const user = await this.usersRepository.findByEmail(dto.email);
    if (!user) {
      throw new UnauthorizedException(GENERIC_LOGIN_FAILURE_MESSAGE);
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.passwordHash);
    if (!isPasswordValid) {
      throw new UnauthorizedException(GENERIC_LOGIN_FAILURE_MESSAGE);
    }

    return this.buildSession(user);
  }

  verifySessionToken(token: string | undefined): AuthUser | null {
    if (!token) {
      return null;
    }

    try {
      const payload = this.jwtService.verify<SessionTokenPayload>(token);
      return {
        id: payload.sub,
        name: payload.name,
        email: payload.email,
        roles: payload.roles ?? [],
      };
    } catch {
      return null;
    }
  }

  private async buildSession(user: UserRow): Promise<AuthSession> {
    const roles = await this.usersRepository.findRolesByUserId(user.id);
    const authUser: AuthUser = { id: user.id, name: user.name, email: user.email, roles };
    const payload: SessionTokenPayload = {
      sub: user.id,
      name: user.name,
      email: user.email,
      roles,
    };
    const token = this.jwtService.sign(payload);

    return { user: authUser, token };
  }
}
