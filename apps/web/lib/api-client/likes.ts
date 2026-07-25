import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

type CreateLikeBody = components["schemas"]["CreateLikeDto"];

export const likeCountQueryKey = ["likes", "count"] as const;
export const likesStatsQueryKey = ["likes", "stats"] as const;
export const FEED_PAGE_LIMIT = 10;

export function likesFeedQueryKey(page: number) {
  return ["likes", "feed", page] as const;
}

function throwApiError(error: unknown, message: string): never {
  console.error(error);
  throw new Error(message, { cause: error });
}

export function useLikeCount() {
  return useQuery({
    queryKey: likeCountQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/likes/count");
      if (error) {
        throwApiError(error, "Failed to load like count");
      }
      return data.count;
    },
  });
}

export function useLikesStats() {
  return useQuery({
    queryKey: likesStatsQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/likes/stats");
      if (error) {
        throwApiError(error, "Failed to load stats");
      }
      return data;
    },
  });
}

export function useLikesFeed(page: number) {
  return useQuery({
    queryKey: likesFeedQueryKey(page),
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/likes", {
        params: { query: { page, limit: FEED_PAGE_LIMIT } },
      });
      if (error) {
        throwApiError(error, "Failed to load story feed");
      }
      return data;
    },
  });
}

export function useSubmitLike() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateLikeBody) => {
      const { error } = await apiClient.POST("/likes", { body });
      if (error) {
        throwApiError(error, "Failed to submit like");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: likeCountQueryKey });
      queryClient.invalidateQueries({ queryKey: likesStatsQueryKey });
      // New stories land on page 1 (feed is newest-first); other pages don't
      // shift in a way that needs an immediate refresh.
      queryClient.invalidateQueries({ queryKey: likesFeedQueryKey(1) });
    },
  });
}
