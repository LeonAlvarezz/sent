import type { SignInEmail } from "@z3/types";
import type { UserProfile } from "../types";
import type { AuthStrategy } from "./type";

export interface SessionStrategyOptions {
  onInitialize: () => Promise<UserProfile | null>;
  onLogin: (payload: SignInEmail) => Promise<UserProfile>;
  onLogout: () => Promise<void>;
  getCsrfToken?: () => string | null;
  csrfHeaderName?: string;
}

export class SessionAuthStrategy implements AuthStrategy {
  type = "session" as const;
  private onInitialize: () => Promise<UserProfile | null>;
  private onLogin: (payload: SignInEmail) => Promise<UserProfile>;
  private onLogout: () => Promise<void>;
  private getCsrfToken?: () => string | null;
  private csrfHeaderName: string;

  constructor(options: SessionStrategyOptions) {
    this.onInitialize = options.onInitialize;
    this.onLogin = options.onLogin;
    this.onLogout = options.onLogout;
    this.getCsrfToken = options.getCsrfToken;
    this.csrfHeaderName = options.csrfHeaderName ?? "X-CSRF-Token";
  }

  async initialize(): Promise<UserProfile | null> {
    return this.onInitialize();
  }

  async login(payload: SignInEmail): Promise<UserProfile> {
    return this.onLogin(payload);
  }

  async logout(): Promise<void> {
    return this.onLogout();
  }

  getAuthHeaders(): Record<string, string> {
    const headers: Record<string, string> = {};
    if (this.getCsrfToken) {
      const token = this.getCsrfToken();
      if (token) {
        headers[this.csrfHeaderName] = token;
      }
    }
    return headers;
  }
}
