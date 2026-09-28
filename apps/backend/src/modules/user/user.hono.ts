import { Hono } from "hono";
import { eq, or, like, desc, asc, and, count } from "drizzle-orm";
import * as v from "valibot";
import { createDb } from "@/db";
import { user as userTable } from "@/db/schema";
import { requireSuperAdmin } from "@/lib/permissions";
import {
  SetRoleSchema,
  USER_ROLE,
  type User,
  type UsersListResponse,
} from "@z3/types";

export type UserEnv = {
  Bindings: {
    DB: D1Database;
  };
  Variables: {
    user: {
      id: string;
      email: string;
      role: string;
      name?: string;
    };
  };
};

export const userRouter = new Hono<UserEnv>();

// Restrict all user management endpoints strictly to super_admin
userRouter.use("*", requireSuperAdmin);

// GET /api/users
userRouter.get("/", async (c) => {
  const db = createDb(c.env.DB);
  const search = c.req.query("search")?.trim();
  const roleParam = c.req.query("role")?.trim() as USER_ROLE | undefined;
  const limitParam = Number(c.req.query("limit")) || 20;
  const orderParam = c.req.query("order") === "asc" ? "asc" : "desc";

  const conditions = [];

  if (search) {
    const q = `%${search}%`;
    conditions.push(or(like(userTable.name, q), like(userTable.email, q)));
  }

  if (roleParam && Object.values(USER_ROLE).includes(roleParam)) {
    conditions.push(eq(userTable.role, roleParam));
  }

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [totalResult] = await db
    .select({ value: count() })
    .from(userTable)
    .where(whereClause);

  const total = totalResult?.value ?? 0;
  const orderBy =
    orderParam === "asc" ? asc(userTable.createdAt) : desc(userTable.createdAt);

  const rows = await db
    .select()
    .from(userTable)
    .where(whereClause)
    .orderBy(orderBy)
    .limit(limitParam);

  const users: User[] = rows.map((r) => ({
    id: r.id,
    name: r.name,
    email: r.email,
    emailVerified: Boolean(r.emailVerified),
    image: r.image,
    role: r.role as USER_ROLE,
    banned: Boolean(r.banned),
    banReason: r.banReason,
    banExpires: r.banExpires ? new Date(r.banExpires).toISOString() : null,
    twoFactorEnabled: Boolean(r.twoFactorEnabled),
    createdAt: new Date(r.createdAt).toISOString(),
    updatedAt: new Date(r.updatedAt).toISOString(),
  }));

  const response: UsersListResponse = {
    users,
    total,
    meta: {
      has_more: total > users.length,
      limit: limitParam,
      next_cursor: null,
    },
  };

  return c.json(response);
});

// POST /api/users/set-role
userRouter.post("/set-role", async (c) => {
  const currentUser = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(SetRoleSchema, body);

  if (currentUser.id === payload.userId) {
    return c.json(
      { success: false, message: "Cannot change your own role" },
      400,
    );
  }

  const db = createDb(c.env.DB);
  const [targetUser] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, payload.userId));

  if (!targetUser) {
    return c.json(
      { success: false, message: `User not found: ${payload.userId}` },
      404,
    );
  }

  await db
    .update(userTable)
    .set({
      role: payload.role,
      updatedAt: new Date(),
    })
    .where(eq(userTable.id, payload.userId));

  const [updated] = await db
    .select()
    .from(userTable)
    .where(eq(userTable.id, payload.userId));

  const userResult: User = {
    id: updated.id,
    name: updated.name,
    email: updated.email,
    emailVerified: Boolean(updated.emailVerified),
    image: updated.image,
    role: updated.role as USER_ROLE,
    banned: Boolean(updated.banned),
    banReason: updated.banReason,
    banExpires: updated.banExpires
      ? new Date(updated.banExpires).toISOString()
      : null,
    twoFactorEnabled: Boolean(updated.twoFactorEnabled),
    createdAt: new Date(updated.createdAt).toISOString(),
    updatedAt: new Date(updated.updatedAt).toISOString(),
  };

  return c.json(userResult);
});
