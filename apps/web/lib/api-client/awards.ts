import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

type CreateAwardBody = components["schemas"]["CreateAwardDto"];

export const awardsQueryKey = ["awards", "list"] as const;

function throwApiError(error: unknown, message: string): never {
  console.error(error);
  throw new Error(message, { cause: error });
}

export function useAwards() {
  return useQuery({
    queryKey: awardsQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/awards");
      if (error) {
        throwApiError(error, "Failed to load awards");
      }
      return data;
    },
  });
}

export function useCreateAward() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (body: CreateAwardBody) => {
      const { error } = await apiClient.POST("/awards", { body });
      if (error) {
        throwApiError(error, "Failed to create award");
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: awardsQueryKey });
    },
  });
}
