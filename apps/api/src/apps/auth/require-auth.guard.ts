import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { Request } from "express";

/**
 * Method-level guard for routes that must reject anonymous requests.
 * Relies on `request.user` already being populated (or left `null`) by the
 * global `CurrentUserGuard` — apply this alongside it via `@UseGuards(...)`
 * on the specific route, never globally.
 */
@Injectable()
export class RequireAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    return true;
  }
}
