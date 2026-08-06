import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

export const USERS_PAGE_LIMIT = 10;

// Ticket 05 (admin users page) builds a paginated/searchable query key on
// top of this prefix (e.g. [...usersListQueryKeyPrefix, page, search]).
// Defined here, ahead of that ticket, only because role deletion (ticket 04)
// needs a stable prefix to invalidate every cached page/search variant of
// the user list once a role's assignments change — React Query's
// invalidateQueries matches by key prefix, so invalidating this exact array
// invalidates every list variant ticket 05 will nest underneath it.
export const usersListQueryKeyPrefix = ["users", "list"] as const;

export function usersListQueryKey(page: number, search: string) {
  return [...usersListQueryKeyPrefix, page, search] as const;
}

function throwApiError(error: unknown, message: string): never {
  console.error(error);
  throw new Error(message, { cause: error });
}

export function useUsers({ page, search }: { page: number; search: string }) {
  return useQuery({
    queryKey: usersListQueryKey(page, search),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/users", {
        params: {
          query: {
            page,
            limit: USERS_PAGE_LIMIT,
            search: search || undefined,
          },
        },
      });
      if (error) {
        throwApiError(error, "Failed to load users");
      }
      return data;
    },
  });
}

type GrantUserRoleVariables = {
  userId: string;
  roleId: string;
};

export function useGrantUserRole() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, GrantUserRoleVariables>({
    mutationFn: async ({ userId, roleId }) => {
      const { error } = await apiClient.POST("/users/{userId}/roles", {
        params: { path: { userId } },
        body: { roleId },
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      // No manual list patching — refetch is the source of truth, matching
      // this codebase's existing invalidate-and-refetch convention.
      queryClient.invalidateQueries({ queryKey: usersListQueryKeyPrefix });
    },
  });
}

type RevokeUserRoleVariables = {
  userId: string;
  roleId: string;
};

export function useRevokeUserRole() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, RevokeUserRoleVariables>({
    mutationFn: async ({ userId, roleId }) => {
      const { error } = await apiClient.DELETE("/users/{userId}/roles/{roleId}", {
        params: { path: { userId, roleId } },
      });
      if (error) {
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: usersListQueryKeyPrefix });
    },
  });
}

export type UserListItem = components["schemas"]["UserListItemDto"];
export type UserRoleSummary = components["schemas"]["UserRoleDto"];
