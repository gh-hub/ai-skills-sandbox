import type { UserRoleSummary } from "@thanks-claude/shared-types";
import type { UserRoleRow } from "./users.repository";

export function groupRolesByUserId(rows: UserRoleRow[]): Map<string, UserRoleSummary[]> {
  const rolesByUserId = new Map<string, UserRoleSummary[]>();

  for (const row of rows) {
    const rolesForUser = rolesByUserId.get(row.userId) ?? [];
    rolesForUser.push({ id: row.id, name: row.name });
    rolesByUserId.set(row.userId, rolesForUser);
  }

  return rolesByUserId;
}
