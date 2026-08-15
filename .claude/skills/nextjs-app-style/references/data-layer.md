# Data Layer

## One module per domain, built on React Query

Once `@tanstack/react-query` is in the project (check `package.json` before assuming otherwise), the data layer is a set of per-domain modules under `lib/api-client/` — `awards.ts`, `roles.ts`, `users.ts` — each exporting:

- A query-key constant (or prefix) for that domain's cached data.
- One `useX` hook per read, wrapping `useQuery`.
- One `useX` hook per mutation, wrapping `useMutation`, invalidating the relevant query key(s) `onSuccess`.

```ts
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

type CreateOrderBody = components["schemas"]["CreateOrderDto"];

export const ordersQueryKey = ["orders", "list"] as const;

function throwApiError(error: unknown, message: string): never {
  console.error(error);
  throw new Error(message, { cause: error });
}

export function useOrders() {
  return useQuery({
    queryKey: ordersQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/orders");
      if (error) {
        throwApiError(error, "Failed to load orders");
      }
      return data;
    },
  });
}

export function useCreateOrder() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateOrderBody) => {
      const { data, error } = await apiClient.POST("/orders", { body });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ordersQueryKey });
    },
  });
}
```

Components call these hooks directly. Never call `apiClient`/`fetch` from inside a component — that's how query-key invalidation, typed error handling, and caching drift out of sync across the app.

If a project has **not** adopted React Query, fall back to a plain typed async-function module (one function per endpoint, throwing on failure) and model load state as a small union (`"loading" | "loaded" | "error"`) instead of several booleans, guarding any `useEffect`-driven fetch against post-unmount updates. Don't introduce React Query yourself as a side effect of an unrelated change — that's a stack decision for the user to make.

## A typed API client, not raw `fetch`

`apiClient` (e.g. an `openapi-fetch` client typed from a generated OpenAPI schema) lives in one shared module (`lib/api-client/client.ts`) and is imported by every domain module. Each call returns `{ data, error, response }` rather than throwing on a non-ok response — check `error` explicitly and either `throw error` (letting the mutation's `isError` surface it generically) or translate it into a typed error class when the caller needs to branch on *why* it failed.

## Business-rule-specific error branches

When a rejection means something the caller needs to react to differently — not just "it failed" — throw a dedicated `Error` subclass carrying the relevant data, instead of making every consumer re-parse the response body:

```ts
export class RoleInUseError extends Error {
  affectedUsers: RoleAffectedUser[];

  constructor(affectedUsers: RoleAffectedUser[]) {
    super("Role is currently assigned to one or more users");
    this.name = "RoleInUseError";
    this.affectedUsers = affectedUsers;
  }
}
```

The mutation's `mutationFn` inspects the specific status code/body shape and throws the typed error; the component's `onError` (or a `catch` around `.mutateAsync`) narrows on `instanceof` to decide what to render. Reserve this for rejections the UI actually branches on (e.g. switching a delete-confirm modal into a force-delete step) — a plain `isError` boolean is enough for a generic "couldn't save" message.

## Invalidate what actually changed

`onSuccess` invalidates every query key whose cached data the mutation could have affected — not just the mutation's own domain. Deleting a role, for example, can change who holds what, so it invalidates both `rolesQueryKey` and the users-list query-key prefix. Under-invalidating leaves stale cached data on screen; over-invalidating (blowing away unrelated caches) causes needless refetches — invalidate by the same reasoning you'd use to decide what a cache-busting change should touch, not reflexively either broad or narrow.

## Optimistic updates

For low-risk, easily-reversible mutations (e.g. toggling a checkbox), use React Query's `onMutate`/`onError`/`onSettled` to update the cache immediately and roll back on failure, rather than hand-rolling local component state for it.

Don't apply this pattern to destructive or hard-to-reverse actions (deletes, irreversible status transitions) — those wait for the server response and use the confirm/feedback flow in [feedback-and-dialogs.md](feedback-and-dialogs.md) instead.
