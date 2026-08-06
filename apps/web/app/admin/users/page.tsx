"use client";

import Link from "next/link";
import { UsersList } from "@/components/users-list";
import { isAdmin, useMe } from "@/lib/api-client/auth";

// Same gating pattern as /admin/roles (ticket 04): ADMIN isn't something a
// visitor can pursue by simply logging in, so there is no login-prompt
// branch here — anonymous, non-admin, and still-loading all render nothing.
export default function AdminUsersPage() {
  const me = useMe();

  if (me.isLoading || me.data === undefined) {
    return null;
  }

  if (!isAdmin(me.data)) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <Link
          href="/admin"
          className="self-start text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Users</h1>
        <p className="text-muted-foreground">
          Search users and manage their roles.
        </p>
      </div>

      <UsersList />
    </main>
  );
}
