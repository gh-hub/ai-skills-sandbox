import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import { usersListQueryKeyPrefix } from "./users";
import type { components } from "./schema";

type Role = components["schemas"]["RoleDto"];
type CreateRoleBody = components["schemas"]["CreateRoleDto"];

export const rolesQueryKey = ["roles", "list"] as const;

function throwApiError(error: unknown, message: string): never {
  console.error(error);
  throw new Error(message, { cause: error });
}

export function useRoles() {
  return useQuery({
    queryKey: rolesQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/roles");
      if (error) {
        throwApiError(error, "Failed to load roles");
      }
      return data;
    },
  });
}

export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation<Role, unknown, CreateRoleBody>({
    mutationFn: async (body) => {
      const { data, error } = await apiClient.POST("/roles", { body });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
    },
  });
}

export type RoleAffectedUser = {
  name: string;
  email: string;
};

function isRoleInUseBody(
  body: unknown
): body is { message: string; affectedUsers: RoleAffectedUser[] } {
  return (
    typeof body === "object" &&
    body !== null &&
    Array.isArray((body as { affectedUsers?: unknown }).affectedUsers)
  );
}

// Thrown instead of the raw API error when DELETE /roles/:id responds 409
// (the role is currently assigned to one or more users), so the delete
// modal can switch straight to its affected-users/force-delete step without
// re-parsing the response body itself.
export class RoleInUseError extends Error {
  affectedUsers: RoleAffectedUser[];

  constructor(affectedUsers: RoleAffectedUser[]) {
    super("Role is currently assigned to one or more users");
    this.name = "RoleInUseError";
    this.affectedUsers = affectedUsers;
  }
}

type DeleteRoleVariables = {
  id: string;
  force?: boolean;
};

export function useDeleteRole() {
  const queryClient = useQueryClient();

  return useMutation<void, unknown, DeleteRoleVariables>({
    mutationFn: async ({ id, force }) => {
      const result = await apiClient.DELETE("/roles/{id}", {
        params: {
          path: { id },
          query: force ? { force: true } : undefined,
        },
      });
      // openapi.json only documents the 204 success response for this route
      // (the 409-in-use body has no `@ApiResponse` decorator), so
      // openapi-fetch infers `error` as `never` — cast to `unknown` so the
      // 409 branch below can actually inspect it instead of being narrowed
      // away as unreachable.
      const error = result.error as unknown;
      if (error) {
        if (result.response.status === 409 && isRoleInUseBody(error)) {
          throw new RoleInUseError(error.affectedUsers);
        }
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: rolesQueryKey });
      // A role's deletion can change who holds what — invalidate every
      // cached user-list page/search variant (ticket 05), not just this
      // page's roles list.
      queryClient.invalidateQueries({ queryKey: usersListQueryKeyPrefix });
    },
  });
}
