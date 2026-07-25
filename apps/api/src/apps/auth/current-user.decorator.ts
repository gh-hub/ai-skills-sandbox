import { createParamDecorator, ExecutionContext } from "@nestjs/common";
import type { Request } from "express";
import type { AuthUser } from "@thanks-claude/shared-types";

/**
 * Reads the current user populated by `CurrentUserGuard` (registered
 * globally). Any controller can inject it to get the logged-in user, or
 * `null` when there is no valid session — it never throws.
 */
export const CurrentUser = createParamDecorator((_data: unknown, ctx: ExecutionContext): AuthUser | null => {
  const request = ctx.switchToHttp().getRequest<Request>();
  return request.user ?? null;
});
