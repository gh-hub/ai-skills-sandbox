import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

type CreateLikeBody = components["schemas"]["CreateLikeDto"];

export const likeCountQueryKey = ["likes", "count"] as const;

export function useLikeCount() {
  return useQuery({
    queryKey: likeCountQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/likes/count");
      if (error) {
        console.error(error);
        throw new Error("Failed to load like count");
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
        console.error(error);
        throw new Error("Failed to submit like");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: likeCountQueryKey });
    },
  });
}
