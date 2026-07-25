import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

type CreateLikeBody = components["schemas"]["CreateLikeDto"];

export const likeCountQueryKey = ["likes", "count"] as const;

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
    },
  });
}
