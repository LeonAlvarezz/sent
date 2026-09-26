import type { UserProfile } from "../types";
import type { AuthStrategy } from "./type";

export interface TokenStorage {
  getItem: (key: string) => string | null;
  setItem: (key: string, value: string) => void;
  removeItem: (key: string) => void;
}

export type RefreshTokenResult =
  string | { accessToken: string; refreshToken?: string };

export interface JwtStrategyOptions {
  onInitialize: (
    token: string | null,
  ) => Promise<{ user: UserProfile | null; newToken?: string | null }>;
  onLogin: (
    credentials: Record<string, any>,
  ) => Promise<{ user: UserProfile; token: string; refreshToken?: string }>;
  onRefreshToken?: (
    refreshToken?: string | null,
  ) => Promise<RefreshTokenResult>;
  onLogout?: () => Promise<void>;
  tokenKey?: string;
  refreshTokenKey?: string;
  storage?: TokenStorage;
}

export class JwtAuthStrategy implements AuthStrategy {
  type = "jwt" as const;
  private token: string | null = null;
  private refreshTokenValue: string | null = null;
  private onInitialize: JwtStrategyOptions["onInitialize"];
  private onLogin: JwtStrategyOptions["onLogin"];
  private onRefreshToken?: JwtStrategyOptions["onRefreshToken"];
  private onLogout?: JwtStrategyOptions["onLogout"];
  private tokenKey: string;
  private refreshTokenKey?: string;
  private storage?: TokenStorage;

  constructor(options: JwtStrategyOptions) {
    this.onInitialize = options.onInitialize;
    this.onLogin = options.onLogin;
    this.onRefreshToken = options.onRefreshToken;
    this.onLogout = options.onLogout;
    this.tokenKey = options.tokenKey ?? "auth_token";
    this.refreshTokenKey = options.refreshTokenKey;
    this.storage =
      options.storage ??
      (typeof window !== "undefined" ? localStorage : undefined);

    if (this.storage) {
      this.token = this.storage.getItem(this.tokenKey);
      if (this.refreshTokenKey) {
        this.refreshTokenValue = this.storage.getItem(this.refreshTokenKey);
      }
    }
  }

  setToken(token: string | null, refreshToken?: string | null): void {
    this.token = token;
    if (refreshToken !== undefined) {
      this.refreshTokenValue = refreshToken;
    }

    if (this.storage) {
      if (token) {
        this.storage.setItem(this.tokenKey, token);
      } else {
        this.storage.removeItem(this.tokenKey);
      }

      if (this.refreshTokenKey) {
        if (this.refreshTokenValue) {
          this.storage.setItem(this.refreshTokenKey, this.refreshTokenValue);
        } else {
          this.storage.removeItem(this.refreshTokenKey);
        }
      }
    }
  }

  getToken(): string | null {
    return this.token;
  }

  getRefreshToken(): string | null {
    return this.refreshTokenValue;
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.token) {
      headers["Authorization"] = `Bearer ${this.token}`;
    }
    return headers;
  }

  async initialize(): Promise<UserProfile | null> {
    try {
      const result = await this.onInitialize(this.token);
      if (result.newToken !== undefined) {
        this.setToken(result.newToken);
      }
      if (!result.user) {
        this.setToken(null, null);
      }
      return result.user;
    } catch {
      this.setToken(null, null);
      return null;
    }
  }

  async login(credentials: Record<string, any>): Promise<UserProfile> {
    const { user, token, refreshToken } = await this.onLogin(credentials);
    this.setToken(token, refreshToken);
    return user;
  }

  async refreshToken(): Promise<string | null> {
    if (!this.onRefreshToken) return null;
    try {
      const res = await this.onRefreshToken(this.refreshTokenValue);
      if (typeof res === "string") {
        this.setToken(res);
        return res;
      } else {
        this.setToken(res.accessToken, res.refreshToken);
        return res.accessToken;
      }
    } catch (err) {
      this.setToken(null, null);
      throw err;
    }
  }

  async logout(): Promise<void> {
    if (this.onLogout) {
      await this.onLogout();
    }
    this.setToken(null, null);
  }
}
