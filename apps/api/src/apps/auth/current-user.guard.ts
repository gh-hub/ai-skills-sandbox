import { CanActivate, ExecutionContext, Injectable } from "@nestjs/common";
import type { Request } from "express";
import { AuthService } from "./auth.service";
import { SESSION_COOKIE_NAME } from "./session.constants";

/**
 * Global, non-blocking guard: always allows the request through, but
 * resolves the session cookie into `request.user` (or `null`) so any
 * controller can consult the shared `@CurrentUser()` decorator without
 * owning its own cookie/JWT verification. A missing or invalid/expired
 * cookie is always treated as "no session", never an error.
 */
@Injectable()
export class CurrentUserGuard implements CanActivate {
  constructor(private readonly authService: AuthService) {}

  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    request.user = this.authService.verifySessionToken(request.cookies?.[SESSION_COOKIE_NAME]);
    return true;
  }
}
