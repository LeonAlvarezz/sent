import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@z3/admin-core";
import { apiClient } from "@/libs/api-client";
import type {
  ChangePassword,
  EnableTwoFactorResponse,
  SessionResponse,
  UpdateUserInfo,
} from "@z3/types";

export const authKeys = {
  all: ["auth"] as const,
  session: () => [...authKeys.all, "session"] as const,
};

export function useSessionQuery() {
  return useQuery({
    queryKey: authKeys.session(),
    queryFn: () => apiClient.get<SessionResponse>("/auth/get-session"),
  });
}

export function useUpdateUserMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();

  return useMutation({
    mutationFn: (payload: UpdateUserInfo) =>
      apiClient.post("/auth/update-user", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      await auth.initialize();
    },
  });
}

export function useChangePasswordMutation() {
  return useMutation({
    mutationFn: (payload: ChangePassword) =>
      apiClient.post("/auth/change-password", payload),
  });
}
export function useEnableTwoFactorMutation() {
  return useMutation({
    mutationFn: (payload: { password: string }) =>
      apiClient.post<EnableTwoFactorResponse>("/auth/two-factor/enable", {
        ...payload,
        method: "totp",
      }),
  });
}

export function useVerifyTotpMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: (payload: { code: string }) =>
      apiClient.post("/auth/two-factor/verify-totp", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      await auth.initialize();
    },
  });
}

export function useDisableTwoFactorMutation() {
  const queryClient = useQueryClient();
  const auth = useAuth();
  return useMutation({
    mutationFn: (payload: { password: string }) =>
      apiClient.post("/auth/two-factor/disable", payload),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: authKeys.session() });
      await auth.initialize();
    },
  });
}
