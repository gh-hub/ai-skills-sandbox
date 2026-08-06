"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { DeleteRoleModal } from "@/components/delete-role-modal";
import { useRoles } from "@/lib/api-client/roles";
import type { components } from "@/lib/api-client/schema";

type Role = components["schemas"]["RoleDto"];

export function RolesListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li
          key={key}
          className="h-12 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </ul>
  );
}

export function RolesList() {
  const roles = useRoles();
  const [deletingRole, setDeletingRole] = useState<Role | null>(null);

  if (roles.isError) {
    return (
      <p role="alert" className="text-center text-sm text-destructive">
        Unable to load roles.{" "}
        <Button onClick={() => roles.refetch()} variant="link" size="sm">
          Retry
        </Button>
      </p>
    );
  }

  if (roles.isLoading || roles.data === undefined) {
    return <RolesListSkeleton />;
  }

  return (
    <>
      <ul className="flex flex-col gap-2">
        {roles.data.map((role) => (
          <li
            key={role.id}
            className="flex items-center gap-3 rounded-lg border border-border bg-card px-4 py-3"
          >
            <span className="font-medium text-foreground">{role.name}</span>
            {role.isBuiltIn && (
              <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-muted-foreground">
                Built-in
              </span>
            )}
            {!role.isBuiltIn && (
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Delete ${role.name}`}
                className="ml-auto"
                onClick={() => setDeletingRole(role)}
              >
                <Trash2 />
              </Button>
            )}
          </li>
        ))}
      </ul>
      <DeleteRoleModal
        role={deletingRole}
        onClose={() => setDeletingRole(null)}
      />
    </>
  );
}
