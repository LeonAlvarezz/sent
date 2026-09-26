import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiClient } from "@/libs/api-client";
import type {
  ListUsersQuery,
  SetRole,
  User,
  UsersListResponse,
} from "@z3/types";

export const userKeys = {
  all: ["users"] as const,
  lists: () => [...userKeys.all, "list"] as const,
  list: (filters?: ListUsersQuery) => [...userKeys.lists(), filters] as const,
};

export function useUsersQuery(
  filters?: ListUsersQuery,
  options?: { enabled?: boolean },
) {
  return useQuery({
    queryKey: userKeys.list(filters),
    queryFn: () =>
      apiClient.get<UsersListResponse>("/users", {
        params: {
          search: filters?.search || undefined,
          role: filters?.role || undefined,
          cursor: filters?.cursor || undefined,
          limit: filters?.limit,
          order: filters?.order,
        },
      }),
    enabled: options?.enabled ?? true,
  });
}

export function useUpdateUserRoleMutation() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (payload: SetRole) =>
      apiClient.post<User>("/users/set-role", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: userKeys.all });
    },
  });
}
