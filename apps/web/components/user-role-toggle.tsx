"use client";

import { useGrantUserRole, useRevokeUserRole } from "@/lib/api-client/users";
import type { UserRoleSummary } from "@/lib/api-client/users";

type UserRoleToggleProps = {
  userId: string;
  userName: string;
  role: UserRoleSummary;
  isGranted: boolean;
};

// One checkbox = one role for one user. Checked state is driven entirely by
// `isGranted` (derived from the user-list query, not local component state)
// — a successful grant/revoke invalidates that query and this checkbox's
// value follows the refetch, matching the spec's "no manual list patching"
// requirement.
export function UserRoleToggle({
  userId,
  userName,
  role,
  isGranted,
}: UserRoleToggleProps) {
  const grantRole = useGrantUserRole();
  const revokeRole = useRevokeUserRole();
  const isPending = grantRole.isPending || revokeRole.isPending;
  const hasError = grantRole.isError || revokeRole.isError;

  const handleChange = (checked: boolean) => {
    if (checked) {
      grantRole.mutate({ userId, roleId: role.id });
    } else {
      revokeRole.mutate({ userId, roleId: role.id });
    }
  };

  return (
    <label className="flex items-center gap-1.5 text-sm text-foreground">
      <input
        type="checkbox"
        checked={isGranted}
        disabled={isPending}
        onChange={(event) => handleChange(event.target.checked)}
        aria-label={`${role.name} for ${userName}`}
        className="size-4 rounded border-input"
      />
      {role.name}
      {hasError && (
        <span role="alert" className="text-xs text-destructive">
          Failed
        </span>
      )}
    </label>
  );
}
