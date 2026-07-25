import { Body, Controller, Get, HttpCode, Post, Res } from "@nestjs/common";
import { ApiCreatedResponse, ApiOkResponse } from "@nestjs/swagger";
import type { CookieOptions, Response } from "express";
import type { AuthUser } from "@thanks-claude/shared-types";
import { AuthService } from "./auth.service";
import { CurrentUser } from "./current-user.decorator";
import { AuthUserDto } from "./dto/auth-user.dto";
import { LoginDto } from "./dto/login.dto";
import { MeResponseDto } from "./dto/me-response.dto";
import { SignupDto } from "./dto/signup.dto";
import { SESSION_COOKIE_NAME, SESSION_MAX_AGE_MS } from "./session.constants";

function buildSessionCookieOptions(): CookieOptions {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: SESSION_MAX_AGE_MS,
  };
}

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("signup")
  @ApiCreatedResponse({ type: AuthUserDto })
  async signup(
    @Body() dto: SignupDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const { user, token } = await this.authService.signup(dto);
    response.cookie(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
    return user;
  }

  @Post("login")
  @HttpCode(200)
  @ApiOkResponse({ type: AuthUserDto })
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) response: Response,
  ): Promise<AuthUserDto> {
    const { user, token } = await this.authService.login(dto);
    response.cookie(SESSION_COOKIE_NAME, token, buildSessionCookieOptions());
    return user;
  }

  @Post("logout")
  @HttpCode(200)
  logout(@Res({ passthrough: true }) response: Response): void {
    response.clearCookie(SESSION_COOKIE_NAME);
  }

  @Get("me")
  @ApiOkResponse({ type: MeResponseDto })
  me(@CurrentUser() user: AuthUser | null): MeResponseDto {
    return { user };
  }
}
