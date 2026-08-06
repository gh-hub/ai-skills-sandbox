"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pagination } from "@/components/pagination";
import { UserRoleToggle } from "@/components/user-role-toggle";
import { useRoles } from "@/lib/api-client/roles";
import { useUsers } from "@/lib/api-client/users";

const ADMIN_ROLE_NAME = "ADMIN";
const SEARCH_DEBOUNCE_MS = 300;

export function UsersListSkeleton() {
  return (
    <ul className="flex flex-col gap-2" aria-hidden="true">
      {[0, 1, 2].map((key) => (
        <li
          key={key}
          className="h-16 animate-pulse rounded-lg border border-border bg-card"
        />
      ))}
    </ul>
  );
}

export function UsersList() {
  const [page, setPage] = useState(1);
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");

  useEffect(() => {
    const timeout = setTimeout(() => setSearch(searchInput), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(timeout);
  }, [searchInput]);

  // A new search term invalidates the previous page's meaning, so paging
  // back to 1 avoids landing on a page number the new result set may not have.
  useEffect(() => {
    setPage(1);
  }, [search]);

  const users = useUsers({ page, search });
  // Reused live from the shared `rolesQueryKey` cache — the roles list
  // component (ticket 04) invalidates it on create, so a newly created
  // custom role shows up here as a togglable option without a reload, per
  // spec user story 16.
  const roles = useRoles();
  const assignableRoles = (roles.data ?? []).filter(
    (role) => role.name !== ADMIN_ROLE_NAME
  );

  return (
    <section aria-label="Users list" className="flex flex-col gap-4">
      <Input
        type="search"
        placeholder="Search by name or email"
        aria-label="Search users"
        value={searchInput}
        onChange={(event) => setSearchInput(event.target.value)}
      />

      {users.isError && (
        <p role="alert" className="text-center text-sm text-destructive">
          Unable to load users.{" "}
          <Button onClick={() => users.refetch()} variant="link" size="sm">
            Retry
          </Button>
        </p>
      )}

      {!users.isError && (users.isLoading || users.data === undefined) && (
        <UsersListSkeleton />
      )}

      {!users.isError &&
        users.data !== undefined &&
        users.data.items.length === 0 && (
          <p className="text-center text-sm text-muted-foreground">
            No users found.
          </p>
        )}

      {!users.isError && users.data !== undefined && users.data.items.length > 0 && (
        <ul className="flex flex-col gap-2">
          {users.data.items.map((user) => {
            const holdsAdmin = user.roles.some(
              (role) => role.name === ADMIN_ROLE_NAME
            );

            return (
              <li
                key={user.id}
                className="flex flex-col gap-3 rounded-lg border border-border bg-card px-4 py-3"
              >
                <div className="flex flex-wrap items-center gap-2">
                  <span className="font-medium text-foreground">{user.name}</span>
                  <span className="text-sm text-muted-foreground">{user.email}</span>
                  {holdsAdmin && (
                    <span className="inline-flex items-center rounded-full border border-border bg-muted/40 px-2 py-0.5 text-xs font-medium text-foreground">
                      ADMIN
                    </span>
                  )}
                </div>

                {assignableRoles.length > 0 && (
                  <div className="flex flex-wrap gap-4">
                    {assignableRoles.map((role) => (
                      <UserRoleToggle
                        key={role.id}
                        userId={user.id}
                        userName={user.name}
                        role={role}
                        isGranted={user.roles.some((held) => held.id === role.id)}
                      />
                    ))}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      {!users.isError && users.data !== undefined && (
        <Pagination
          page={users.data.page}
          totalPages={users.data.totalPages}
          onChange={setPage}
        />
      )}
    </section>
  );
}
