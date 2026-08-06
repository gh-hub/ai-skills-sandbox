"use client";

import Link from "next/link";
import { CreateRoleForm } from "@/components/create-role-form";
import { RolesList } from "@/components/roles-list";
import { isAdmin, useMe } from "@/lib/api-client/auth";

// ADMIN isn't something a visitor can pursue by simply logging in (unlike
// award management), so unlike create-award-section.tsx there is no
// login-prompt branch here: anonymous, non-admin, and still-loading all
// render nothing at all.
export default function AdminRolesPage() {
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
          href="/admin"
          className="self-start text-sm text-muted-foreground hover:text-foreground"
        >
          ← Back
        </Link>
        <h1 className="text-2xl font-semibold text-foreground">Roles</h1>
        <p className="text-muted-foreground">
          Roles ADMINs can grant to and revoke from users.
        </p>
      </div>

      <section aria-label="Roles list" className="flex flex-col gap-4">
        <RolesList />
      </section>

      <CreateRoleForm />
    </main>
  );
}
