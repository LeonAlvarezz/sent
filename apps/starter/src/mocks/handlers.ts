import { USER_ROLE } from "@z3/types";
import type {
  User,
  UsersListResponse,
  SessionResponse,
  SignInEmailResponse,
  EnableTwoFactorResponse,
} from "@z3/types";
import { SAMPLE_USERS } from "./data/users";

// In-memory mock database state
let mockUsers: User[] = [...SAMPLE_USERS];
let currentSessionUser: User | null = { ...SAMPLE_USERS[1] }; // Default logged in as Admin User

export class MockHttpError extends Error {
  status: number;
  data: unknown;
  constructor(status: number, message: string, data?: unknown) {
    super(message);
    this.status = status;
    this.data = data ?? { success: false, message };
    this.name = "MockHttpError";
  }
}

export function resetMockState() {
  mockUsers = [...SAMPLE_USERS];
  currentSessionUser = { ...SAMPLE_USERS[1] };
}

export async function handleMockRequest<T = any>(
  url: string,
  config: {
    method?: string;
    data?: any;
    params?: Record<string, any>;
  } = {},
): Promise<any> {
  const method = (config.method || "GET").toUpperCase();
  const parsedUrl = new URL(url, "http://localhost:3333");
  const pathname = parsedUrl.pathname.replace(/^\/api/, "");
  const searchParams = parsedUrl.searchParams;

  // Combine URL params with config params
  const params: Record<string, any> = {
    ...Object.fromEntries(searchParams.entries()),
    ...config.params,
  };

  // ---------------------------------------------------------
  // AUTH ROUTES
  // ---------------------------------------------------------
  if (pathname === "/auth/get-session" && method === "GET") {
    if (!currentSessionUser) {
      throw new MockHttpError(401, "Unauthorized: No active session");
    }
    const sessionRes: SessionResponse = {
      user: {
        id: currentSessionUser.id,
        email: currentSessionUser.email,
        name: currentSessionUser.name,
        role: currentSessionUser.role,
        image: currentSessionUser.image,
        emailVerified: currentSessionUser.emailVerified,
        createdAt: currentSessionUser.createdAt,
        updatedAt: currentSessionUser.updatedAt,
      },
      session: {
        id: "mock_sess_" + Math.random().toString(36).substring(2, 9),
        userId: currentSessionUser.id,
        expiresAt: new Date(Date.now() + 86400000 * 7),
        token: "mock_session_token",
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    };
    return sessionRes;
  }

  if (pathname === "/auth/sign-in/email" && method === "POST") {
    const { email, password } = config.data || {};
    if (!email || !password) {
      throw new MockHttpError(400, "Email and password are required");
    }

    const found = mockUsers.find(
      (u) => u.email.toLowerCase() === String(email).toLowerCase(),
    );

    const user: User = found ?? {
      id: "usr_" + Math.random().toString(36).substring(2, 9),
      email,
      name: email.split("@")[0],
      role: USER_ROLE.ADMIN,
      emailVerified: true,
      image: null,
      banned: false,
      banReason: null,
      banExpires: null,
      twoFactorEnabled: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    if (!found) {
      mockUsers.push(user);
    }

    currentSessionUser = { ...user };

    const signInRes: SignInEmailResponse = {
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        image: user.image,
        emailVerified: user.emailVerified,
        createdAt: user.createdAt,
        updatedAt: user.updatedAt,
      },
      token: "mock_jwt_token",
    };
    return signInRes;
  }

  if (pathname === "/auth/sign-out" && method === "POST") {
    currentSessionUser = null;
    return { success: true };
  }

  if (pathname === "/auth/update-user" && method === "POST") {
    if (!currentSessionUser) {
      throw new MockHttpError(401, "Unauthorized");
    }
    const sessionUser = currentSessionUser;
    const { name, image } = config.data || {};
    if (name) sessionUser.name = name;
    if (image !== undefined) sessionUser.image = image;
    sessionUser.updatedAt = new Date().toISOString();

    mockUsers = mockUsers.map((u) =>
      u.id === sessionUser.id ? { ...sessionUser } : u,
    );

    return { user: sessionUser };
  }

  if (pathname === "/auth/change-password" && method === "POST") {
    return {
      success: true,
      message: "Password updated successfully",
    };
  }

  if (pathname === "/auth/two-factor/enable" && method === "POST") {
    const res: EnableTwoFactorResponse = {
      method: "totp",
      totpURI:
        "otpauth://totp/ZeroUI%20Admin:admin%40example.com?secret=JBSWY3DPEHPK3PXP&issuer=ZeroUI%20Admin",
      backupCodes: ["8f4b-2e9a", "3c7d-1a5b", "9e2f-6d4c", "4a1b-7c8d"],
    };
    return res;
  }

  if (pathname === "/auth/two-factor/verify-totp" && method === "POST") {
    if (currentSessionUser) {
      currentSessionUser.twoFactorEnabled = true;
    }
    return { success: true };
  }

  if (pathname === "/auth/two-factor/verify-backup-code" && method === "POST") {
    return { success: true };
  }

  if (pathname === "/auth/two-factor/disable" && method === "POST") {
    if (currentSessionUser) {
      currentSessionUser.twoFactorEnabled = false;
    }
    return { success: true };
  }

  // ---------------------------------------------------------
  // USER ROUTES
  // ---------------------------------------------------------
  if (pathname === "/users" && method === "GET") {
    let filtered = [...mockUsers];

    if (params.search && typeof params.search === "string") {
      const q = params.search.toLowerCase().trim();
      filtered = filtered.filter(
        (u) =>
          u.name.toLowerCase().includes(q) || u.email.toLowerCase().includes(q),
      );
    }

    if (
      params.role &&
      params.role !== "all" &&
      Object.values(USER_ROLE).includes(params.role)
    ) {
      filtered = filtered.filter((u) => u.role === params.role);
    }

    const order = params.order === "asc" ? 1 : -1;
    filtered.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return (dateA - dateB) * order;
    });

    const limit = Number(params.limit) || 20;
    const paginated = filtered.slice(0, limit);
    const lastUser = paginated[paginated.length - 1];

    const res: UsersListResponse = {
      users: paginated,
      total: filtered.length,
      meta: {
        has_more: filtered.length > limit,
        limit,
        next_cursor:
          filtered.length > limit
            ? btoa(
                JSON.stringify({
                  id: lastUser.id,
                  created_at: new Date(lastUser.createdAt).toISOString(),
                }),
              )
            : null,
      },
    };
    return res;
  }

  if (pathname === "/users/set-role" && method === "POST") {
    const { userId, role } = config.data || {};
    const userIndex = mockUsers.findIndex((u) => u.id === userId);
    if (userIndex === -1) {
      throw new MockHttpError(404, `User not found: ${userId}`);
    }

    mockUsers[userIndex] = {
      ...mockUsers[userIndex],
      role,
      updatedAt: new Date().toISOString(),
    };

    if (currentSessionUser && currentSessionUser.id === userId) {
      currentSessionUser.role = role;
    }

    return mockUsers[userIndex];
  }


  throw new MockHttpError(
    404,
    `Mock handler not found for ${method} ${pathname}`,
  );
}
