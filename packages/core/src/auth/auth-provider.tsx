import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useMemo,
  useCallback,
} from "react";
import type { ApiResult, UserProfile } from "../types";
import type { AuthStrategy } from "./type";
import type { SignInEmail } from "@z3/types";

export interface AuthContextValue {
  user: UserProfile | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: Error | null;
  strategy: AuthStrategy;
  login: (payload: SignInEmail) => Promise<ApiResult<UserProfile, Error>>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<string | null>;
  initialize: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export interface AuthProviderProps {
  strategy: AuthStrategy;
  children: React.ReactNode;
  onUnauthenticated?: () => void;
  initialUser?: UserProfile | null;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({
  strategy,
  children,
  onUnauthenticated,
  initialUser,
}) => {
  const [user, setUser] = useState<UserProfile | null>(() => {
    if (initialUser !== undefined) return initialUser;
    if (strategy.getInitialUser) {
      try {
        return strategy.getInitialUser();
      } catch {
        return null;
      }
    }
    return null;
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => (initialUser !== undefined ? !initialUser : strategy.getInitialUser ? !strategy.getInitialUser() : true));
  const [error, setError] = useState<Error | null>(null);
  const hasUserRef = React.useRef(Boolean(user));
  hasUserRef.current = Boolean(user);

  const initialize = useCallback(async () => {
    if (!hasUserRef.current) {
      setIsLoading(true);
    }
    setError(null);
    try {
      const userProfile = await strategy.initialize();
      setUser(userProfile);
      if (!userProfile && onUnauthenticated) {
        onUnauthenticated();
      }
    } catch (err: any) {
      setError(
        err instanceof Error ? err : new Error("Auth initialization failed"),
      );
      setUser(null);
      if (onUnauthenticated) {
        onUnauthenticated();
      }
    } finally {
      setIsLoading(false);
    }
  }, [strategy, onUnauthenticated]);

  useEffect(() => {
    initialize();
  }, [initialize]);

  const login = useCallback(
    async (payload: SignInEmail): Promise<ApiResult<UserProfile, Error>> => {
      setIsLoading(true);
      setError(null);
      try {
        const loggedInUser = await strategy.login(payload);
        setUser(loggedInUser);
        return { success: true, data: loggedInUser, error: null };
      } catch (err: any) {
        const loginError =
          err instanceof Error ? err : new Error("Login failed");
        setError(loginError);
        setUser(null);
        return { success: false, data: null, error: loginError };
      } finally {
        setIsLoading(false);
      }
    },
    [strategy],
  );

  const logout = useCallback(async () => {
    setIsLoading(true);
    try {
      await strategy.logout();
    } finally {
      setUser(null);
      setIsLoading(false);
      if (onUnauthenticated) {
        onUnauthenticated();
      }
    }
  }, [strategy, onUnauthenticated]);

  const refreshToken = useCallback(async (): Promise<string | null> => {
    if (!strategy.refreshToken) return null;
    try {
      return await strategy.refreshToken();
    } catch (err) {
      setUser(null);
      throw err;
    }
  }, [strategy]);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: Boolean(user),
      isLoading,
      error,
      strategy,
      login,
      logout,
      refreshToken,
      initialize,
    }),
    [user, isLoading, error, strategy, login, logout, refreshToken, initialize],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export function useAuth(): AuthContextValue {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an <AuthProvider>");
  }
  return context;
}
