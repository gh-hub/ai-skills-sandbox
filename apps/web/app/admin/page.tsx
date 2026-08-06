"use client";

import Link from "next/link";
import { isAdmin, useMe } from "@/lib/api-client/auth";

// Same gating pattern as /admin/roles and /admin/users (tickets 04/05):
// ADMIN isn't something a visitor can pursue by simply logging in, so there
// is no login-prompt branch here — anonymous, non-admin, and still-loading
// all render nothing.
export default function AdminHubPage() {
  const me = useMe();

  if (me.isLoading || me.data === undefined) {
    return null;
  }

  if (!isAdmin(me.data)) {
    return null;
  }

  return (
    <main className="mx-auto flex max-w-2xl flex-col gap-10 px-6 py-16">
      <div className="flex flex-col gap-2 text-center">
        <Link
          href="/"
          aria-label="Home"
          className="self-start text-sm text-muted-foreground hover:text-foreground"
        >
          ← Home
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Admin</h1>
        <p className="text-muted-foreground">
          Manage users and roles.
        </p>
      </div>

      <nav aria-label="Admin sections" className="flex flex-col gap-4">
        {/* aria-label pins each link's accessible name to just "Users"/"Roles"
            — without it, the name is computed from all inner text (heading
            + description), and "grant or revoke their roles" in the Users
            card's own description makes a substring match on "Roles" hit
            both links. */}
        <Link
          href="/admin/users"
          aria-label="Users"
          className="rounded-lg border border-border bg-card p-6 text-left transition hover:border-foreground/30"
        >
          <p className="font-medium text-foreground">Users</p>
          <p className="text-sm text-muted-foreground">
            Search users and grant or revoke their roles.
          </p>
        </Link>

        <Link
          href="/admin/roles"
          aria-label="Roles"
          className="rounded-lg border border-border bg-card p-6 text-left transition hover:border-foreground/30"
        >
          <p className="font-medium text-foreground">Roles</p>
          <p className="text-sm text-muted-foreground">
            List, create, and delete roles.
          </p>
        </Link>
      </nav>
    </main>
  );
}
