"use client";

import Link from "next/link";
import { AuthModal } from "@/components/auth-modal";
import { Button } from "@/components/ui/button";
import { UserAvatar } from "@/components/user-avatar";
import { isAdmin, useLogout, useMe } from "@/lib/api-client/auth";

export function HeaderAuthControl() {
  const me = useMe();
  const logout = useLogout();

  if (me.isLoading || me.data === undefined) {
    return null;
  }

  if (me.data === null) {
    return <AuthModal />;
  }

  return (
    <div className="flex items-center gap-2">
      <UserAvatar name={me.data.name} size="sm" />
      {isAdmin(me.data) && (
        <Link
          href="/admin"
          className="text-sm font-medium text-muted-foreground hover:text-foreground"
        >
          Admin
        </Link>
      )}
      {me.data.roles.length > 0 && (
        <ul className="flex gap-1" aria-label="Roles">
          {me.data.roles.map((role) => (
            <li key={role}>
              <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
                {role}
              </span>
            </li>
          ))}
        </ul>
      )}
      <Button
        onClick={() => logout.mutate()}
        disabled={logout.isPending}
        variant="ghost"
        size="sm"
      >
        Log out
      </Button>
    </div>
  );
}
