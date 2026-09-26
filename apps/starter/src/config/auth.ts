import type { UserProfile } from "@z3/admin-core";
import { SessionAuthStrategy } from "@z3/admin-core";
import { apiClient } from "@/libs/api-client";
import { queryClient } from "@/libs/query-client";
import type {
  SessionResponse,
  SignInEmail,
  SignInEmailResponse,
  SignInEmailTotpRedirectResponse,
} from "@z3/types";

export const authStrategy: SessionAuthStrategy = new SessionAuthStrategy({
  onInitialize: async () => {
    try {
      const { user: userResponse } =
        await apiClient.get<SessionResponse>("/auth/get-session");
      return {
        id: userResponse.id,
        email: userResponse.email,
        name: userResponse.name,
        avatarUrl: userResponse.image ?? undefined,
        role: userResponse.role,
      };
    } catch {
      queryClient.clear();
      return null;
    }
  },

  onLogin: async (payload: SignInEmail): Promise<UserProfile> => {
    queryClient.clear();
    const data = await apiClient.post<SignInEmailResponse>(
      "/auth/sign-in/email",
      payload,
    );

    if ("twoFactorRedirect" in data) {
      const error = new Error("TWO_FACTOR_REDIRECT");
      (error as any).twoFactorRedirect = true;
      (error as any).twoFactorMethods = data.twoFactorMethods;
      throw error;
    }

    return {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.image ?? undefined,
      role: data.user.role,
    };
  },

  onLogout: async () => {
    try {
      await apiClient.post("/auth/sign-out");
    } finally {
      queryClient.clear();
    }
  },
});
