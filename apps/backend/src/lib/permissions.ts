import { createAccessControl } from "better-auth/plugins/access";
import { createMiddleware } from "hono/factory";
import { USER_ROLE } from "@z3/types";

export const statement = {
  user: ["list", "set-role", "update", "ban", "delete"],
  seo: ["read", "write", "delete"],
  email: ["read", "write", "send"],
  outreach: ["read", "write", "dispatch"],
} as const;

export const ac = createAccessControl(statement);

export const user = ac.newRole({
  email: ["read", "write", "send"],
});

export const admin = ac.newRole({
  seo: ["read", "write", "delete"],
  email: ["read", "write", "send"],
  outreach: ["read", "write", "dispatch"],
});

export const super_admin = ac.newRole({
  user: ["list", "set-role", "update", "ban", "delete"],
  seo: ["read", "write", "delete"],
  email: ["read", "write", "send"],
  outreach: ["read", "write", "dispatch"],
});

export const roles = {
  user,
  admin,
  super_admin,
} as const;

export type RoleName = keyof typeof roles;

/**
 * Role predicate helpers.
 */
export const isSuperAdmin = (role?: string) =>
  role === USER_ROLE.SUPER_ADMIN;

export const isAdminOrSuperAdmin = (role?: string) =>
  role === USER_ROLE.SUPER_ADMIN || role === USER_ROLE.ADMIN;

/**
 * Core role-based authorization middleware.
 */
export const requireRole = (...allowedRoles: (USER_ROLE | string)[]) =>
  createMiddleware(async (c, next) => {
    const userContext = c.get("user" as any) as { role?: string } | undefined;
    if (!userContext?.role || !allowedRoles.includes(userContext.role)) {
      return c.json(
        {
          success: false,
          message: "Forbidden: insufficient permissions",
        },
        403,
      );
    }
    await next();
  });

/**
 * Flexible require helper supporting both predicate functions and role names:
 * e.g. `require(isAdminOrSuperAdmin)` or `require(USER_ROLE.SUPER_ADMIN)`
 */
export function require(
  predicateOrRole: ((role?: string) => boolean) | USER_ROLE | string,
  ...moreRoles: (USER_ROLE | string)[]
) {
  if (typeof predicateOrRole === "function") {
    return createMiddleware(async (c, next) => {
      const userContext = c.get("user" as any) as { role?: string } | undefined;
      if (!predicateOrRole(userContext?.role)) {
        return c.json(
          {
            success: false,
            message: "Forbidden: insufficient permissions",
          },
          403,
        );
      }
      await next();
    });
  }
  return requireRole(predicateOrRole, ...moreRoles);
}

/**
 * Highly readable role authorization middlewares:
 * - requireSuperAdmin: strictly super_admin
 * - requireAdminOrSuperAdmin: admin and super_admin
 */
export const requireSuperAdmin = requireRole(USER_ROLE.SUPER_ADMIN);
export const requireAdminOrSuperAdmin = requireRole(
  USER_ROLE.SUPER_ADMIN,
  USER_ROLE.ADMIN,
);
