import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import type { Request } from "express";
import { ROLES_METADATA_KEY } from "./roles.decorator";

/**
 * Method-level guard enforcing the roles attached by `@Roles(...)`. Relies on
 * `request.user` already being populated (or left `null`) by the global
 * `CurrentUserGuard` — apply this alongside `@Roles(...)` via `@UseGuards(...)`
 * on the specific route, never globally. Fully subsumes `RequireAuthGuard`'s
 * job, so a route using this guard does not also need `RequireAuthGuard`.
 */
@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[] | undefined>(ROLES_METADATA_KEY, context.getHandler());
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const request = context.switchToHttp().getRequest<Request>();
    if (!request.user) {
      throw new UnauthorizedException();
    }

    const hasRequiredRole = request.user.roles.some((role) => requiredRoles.includes(role));
    if (!hasRequiredRole) {
      throw new ForbiddenException();
    }

    return true;
  }
}
