import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "./client";
import type { components } from "./schema";

type SignupBody = components["schemas"]["SignupDto"];
type LoginBody = components["schemas"]["LoginDto"];

export const meQueryKey = ["auth", "me"] as const;

function throwApiError(error: unknown, message: string): never {
  console.error(error);
  throw new Error(message, { cause: error });
}

export function useMe() {
  return useQuery({
    queryKey: meQueryKey,
    queryFn: async () => {
      const { data, error } = await apiClient.GET("/auth/me");
      if (error) {
        throwApiError(error, "Failed to load session");
      }
      return data.user;
    },
  });
}

type AuthUserDto = components["schemas"]["AuthUserDto"];

export function useSignup() {
  const queryClient = useQueryClient();

  return useMutation<AuthUserDto, unknown, SignupBody>({
    mutationFn: async (body) => {
      const { data, error } = await apiClient.POST("/auth/signup", { body });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export function useLogin() {
  const queryClient = useQueryClient();

  return useMutation<AuthUserDto, unknown, LoginBody>({
    mutationFn: async (body) => {
      const { data, error } = await apiClient.POST("/auth/login", { body });
      if (error) {
        throw error;
      }
      return data;
    },
    onSuccess: (user) => {
      queryClient.setQueryData(meQueryKey, user);
    },
  });
}

export function useLogout() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { error } = await apiClient.POST("/auth/logout");
      if (error) {
        throwApiError(error, "Failed to log out");
      }
    },
    onSuccess: () => {
      queryClient.setQueryData(meQueryKey, null);
      queryClient.invalidateQueries({ queryKey: meQueryKey });
    },
  });
}
