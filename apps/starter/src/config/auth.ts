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

const USER_CACHE_KEY = "sent_cached_user";

function getCachedUser(): UserProfile | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = localStorage.getItem(USER_CACHE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as UserProfile;
  } catch {
    return null;
  }
}

function setCachedUser(user: UserProfile | null) {
  if (typeof window === "undefined") return;
  try {
    if (user) {
      localStorage.setItem(USER_CACHE_KEY, JSON.stringify(user));
    } else {
      localStorage.removeItem(USER_CACHE_KEY);
    }
  } catch {}
}

export const authStrategy: SessionAuthStrategy = new SessionAuthStrategy({
  getInitialUser: getCachedUser,

  onInitialize: async () => {
    try {
      const res =
        await apiClient.get<SessionResponse | null>("/auth/get-session");
      if (!res?.user) {
        setCachedUser(null);
        queryClient.clear();
        return null;
      }
      const profile: UserProfile = {
        id: res.user.id,
        email: res.user.email,
        name: res.user.name,
        avatarUrl: res.user.image ?? undefined,
        role: res.user.role,
      };
      setCachedUser(profile);
      return profile;
    } catch {
      setCachedUser(null);
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

    const profile: UserProfile = {
      id: data.user.id,
      email: data.user.email,
      name: data.user.name,
      avatarUrl: data.user.image ?? undefined,
      role: data.user.role,
    };
    setCachedUser(profile);
    return profile;
  },

  onLogout: async () => {
    try {
      await apiClient.post("/auth/sign-out", {});
    } catch (error) {
      console.warn("Server sign-out warning:", error);
    } finally {
      setCachedUser(null);
      queryClient.clear();
    }
  },
});
