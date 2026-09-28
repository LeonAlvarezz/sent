import { describe, expect, it } from "bun:test";
import { Hono } from "hono";
import {
  admin,
  isAdminOrSuperAdmin,
  isSuperAdmin,
  require as requireAuth,
  requireAdminOrSuperAdmin,
  requireRole,
  requireSuperAdmin,
  super_admin,
  user,
} from "@/lib/permissions";
import { USER_ROLE } from "@z3/types";

describe("Access Control & Role Guards", () => {
  describe("Better Auth AC (ac.newRole authorize)", () => {
    it("super_admin has permission across all resources", () => {
      expect(super_admin.authorize({ user: ["list", "delete"] }).success).toBe(
        true,
      );
      expect(super_admin.authorize({ seo: ["read", "write"] }).success).toBe(
        true,
      );
      expect(
        super_admin.authorize({ outreach: ["write", "dispatch"] }).success,
      ).toBe(true);
      expect(super_admin.authorize({ email: ["read", "send"] }).success).toBe(
        true,
      );
    });

    it("admin has seo, email, and outreach, but is denied user resource", () => {
      expect(admin.authorize({ seo: ["read", "write"] }).success).toBe(true);
      expect(admin.authorize({ email: ["read", "send"] }).success).toBe(true);
      expect(admin.authorize({ outreach: ["dispatch"] }).success).toBe(true);

      const userCheck = admin.authorize({ user: ["list"] });
      expect(userCheck.success).toBe(false);
      expect(userCheck.error).toContain("user");
    });

    it("standard user only has email, and is denied seo, outreach, and user", () => {
      expect(user.authorize({ email: ["read", "send"] }).success).toBe(true);
      expect(user.authorize({ seo: ["read"] }).success).toBe(false);
      expect(user.authorize({ outreach: ["dispatch"] }).success).toBe(false);
      expect(user.authorize({ user: ["list"] }).success).toBe(false);
    });
  });

  describe("Role Predicates", () => {
    it("isSuperAdmin validates correctly", () => {
      expect(isSuperAdmin(USER_ROLE.SUPER_ADMIN)).toBe(true);
      expect(isSuperAdmin(USER_ROLE.ADMIN)).toBe(false);
      expect(isSuperAdmin(USER_ROLE.USER)).toBe(false);
      expect(isSuperAdmin(undefined)).toBe(false);
    });

    it("isAdminOrSuperAdmin validates correctly", () => {
      expect(isAdminOrSuperAdmin(USER_ROLE.SUPER_ADMIN)).toBe(true);
      expect(isAdminOrSuperAdmin(USER_ROLE.ADMIN)).toBe(true);
      expect(isAdminOrSuperAdmin(USER_ROLE.USER)).toBe(false);
      expect(isAdminOrSuperAdmin(undefined)).toBe(false);
    });
  });

  describe("Role-based Middlewares (requireSuperAdmin, requireAdminOrSuperAdmin, require(predicate))", () => {
    const app = new Hono<{
      Variables: {
        user?: { id: string; role: string; email: string };
      };
    }>();

    // Guarded by requireSuperAdmin
    app.get("/users", requireSuperAdmin, (c) => {
      return c.json({ allowed: true });
    });

    // Guarded by requireAdminOrSuperAdmin
    app.get("/seo", requireAdminOrSuperAdmin, (c) => {
      return c.json({ allowed: true });
    });

    // Guarded by require(isAdminOrSuperAdmin)
    app.post("/outreach", requireAuth(isAdminOrSuperAdmin), (c) => {
      return c.json({ allowed: true });
    });

    // Bulk email accessible to any authenticated role
    app.get("/email", (c) => {
      return c.json({ allowed: true });
    });

    it("super_admin can access all endpoints", async () => {
      const testApp = new Hono<{
        Variables: { user: { id: string; role: string; email: string } };
      }>();
      testApp.use("*", async (c, next) => {
        c.set("user", {
          id: "u1",
          role: USER_ROLE.SUPER_ADMIN,
          email: "super@example.com",
        });
        await next();
      });
      testApp.route("/", app);

      expect((await testApp.request("/users")).status).toBe(200);
      expect((await testApp.request("/seo")).status).toBe(200);
      expect(
        (await testApp.request("/outreach", { method: "POST" })).status,
      ).toBe(200);
      expect((await testApp.request("/email")).status).toBe(200);
    });

    it("admin can access seo, outreach, and email, but is 403 Forbidden on users", async () => {
      const testApp = new Hono<{
        Variables: { user: { id: string; role: string; email: string } };
      }>();
      testApp.use("*", async (c, next) => {
        c.set("user", {
          id: "u2",
          role: USER_ROLE.ADMIN,
          email: "admin@example.com",
        });
        await next();
      });
      testApp.route("/", app);

      expect((await testApp.request("/seo")).status).toBe(200);
      expect(
        (await testApp.request("/outreach", { method: "POST" })).status,
      ).toBe(200);
      expect((await testApp.request("/email")).status).toBe(200);

      // Denied on users
      const usersRes = await testApp.request("/users");
      expect(usersRes.status).toBe(403);
    });

    it("user can access email, but is 403 Forbidden on seo, outreach, and users", async () => {
      const testApp = new Hono<{
        Variables: { user: { id: string; role: string; email: string } };
      }>();
      testApp.use("*", async (c, next) => {
        c.set("user", {
          id: "u3",
          role: USER_ROLE.USER,
          email: "user@example.com",
        });
        await next();
      });
      testApp.route("/", app);

      expect((await testApp.request("/email")).status).toBe(200);

      expect((await testApp.request("/seo")).status).toBe(403);
      expect(
        (await testApp.request("/outreach", { method: "POST" })).status,
      ).toBe(403);
      expect((await testApp.request("/users")).status).toBe(403);
    });

    it("unauthenticated request returns 403 Forbidden", async () => {
      const unauthApp = new Hono<{
        Variables: { user?: { id: string; role: string; email: string } };
      }>();
      unauthApp.route("/", app);

      const res = await unauthApp.request("/seo");
      expect(res.status).toBe(403);
    });
  });
});
