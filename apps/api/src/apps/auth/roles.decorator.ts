import { SetMetadata } from "@nestjs/common";

export const ROLES_METADATA_KEY = "roles";

/**
 * Attaches the list of roles allowed to call a route handler. Read by
 * `RolesGuard` via `Reflector` — has no effect unless that guard is also
 * applied via `@UseGuards(...)` on the same route.
 */
export const Roles = (...role: string[]): MethodDecorator & ClassDecorator => SetMetadata(ROLES_METADATA_KEY, role);
