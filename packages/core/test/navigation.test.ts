import { describe, expect, it } from "bun:test";
import { filterNavByRole, filterNavItemByRole, hasRequiredRole } from "../src/utils/navigation";
import type { NavGroupConfig, NavItemConfig } from "../src/types";

describe("Navigation Role-Based Filtering", () => {
  const sampleNavGroups: NavGroupConfig[] = [
    {
      id: "overview",
      title: "Overview",
      items: [
        {
          id: "dashboard",
          label: "Dashboard",
          path: "/",
        },
      ],
    },
    {
      id: "campaigns",
      title: "Outreach",
      items: [
        {
          id: "seo",
          label: "SEO",
          roles: ["super_admin", "admin"],
          items: [
            {
              id: "seo-partners",
              label: "Partners",
              path: "/seo-partners",
              roles: ["super_admin", "admin"],
            },
            {
              id: "seo-quick-outreach",
              label: "Quick Outreach",
              path: "/outreach",
              roles: ["super_admin", "admin"],
            },
          ],
        },
        {
          id: "email",
          label: "Email",
          items: [
            {
              id: "email-audiences",
              label: "Audiences",
              path: "/emails",
            },
            {
              id: "email-bulk-send",
              label: "Bulk Send",
              path: "/bulk-send",
            },
            {
              id: "email-queue",
              label: "Queue",
              path: "/campaign-queue",
            },
          ],
        },
      ],
    },
    {
      id: "system",
      title: "System",
      items: [
        {
          id: "users",
          label: "Users",
          path: "/users",
          roles: ["super_admin"],
        },
        {
          id: "settings",
          label: "Settings",
          items: [
            {
              id: "settings-account",
              label: "Account",
              path: "/settings/account",
            },
            {
              id: "settings-mail",
              label: "Mail",
              path: "/settings/mail",
            },
          ],
        },
      ],
    },
  ];

  it("super_admin has full access to all groups, nested items, and users", () => {
    const result = filterNavByRole(sampleNavGroups, "super_admin");
    const itemIds = result
      .flatMap((g) => g.items)
      .flatMap((item) =>
        item.items ? [item.id, ...item.items.map((sub) => sub.id)] : [item.id],
      );

    expect(itemIds).toContain("dashboard");
    expect(itemIds).toContain("seo");
    expect(itemIds).toContain("seo-partners");
    expect(itemIds).toContain("seo-quick-outreach");
    expect(itemIds).toContain("email");
    expect(itemIds).toContain("email-audiences");
    expect(itemIds).toContain("email-bulk-send");
    expect(itemIds).toContain("email-queue");
    expect(itemIds).toContain("users");
    expect(itemIds).toContain("settings");
    expect(itemIds).toContain("settings-account");
    expect(itemIds).toContain("settings-mail");
  });

  it("admin sees SEO and Email, but users is completely stripped", () => {
    const result = filterNavByRole(sampleNavGroups, "admin");
    const itemIds = result
      .flatMap((g) => g.items)
      .flatMap((item) =>
        item.items ? [item.id, ...item.items.map((sub) => sub.id)] : [item.id],
      );

    expect(itemIds).toContain("dashboard");
    expect(itemIds).toContain("seo");
    expect(itemIds).toContain("seo-partners");
    expect(itemIds).toContain("seo-quick-outreach");
    expect(itemIds).toContain("email");
    expect(itemIds).toContain("email-audiences");
    expect(itemIds).toContain("settings");
    expect(itemIds).toContain("settings-mail");

    // Must NOT have users
    expect(itemIds).not.toContain("users");
  });

  it("user sees Email and Settings, but SEO and Users are completely stripped", () => {
    const result = filterNavByRole(sampleNavGroups, "user");
    const itemIds = result
      .flatMap((g) => g.items)
      .flatMap((item) =>
        item.items ? [item.id, ...item.items.map((sub) => sub.id)] : [item.id],
      );

    expect(itemIds).toContain("dashboard");
    expect(itemIds).toContain("email");
    expect(itemIds).toContain("email-audiences");
    expect(itemIds).toContain("email-bulk-send");
    expect(itemIds).toContain("email-queue");
    expect(itemIds).toContain("settings");
    expect(itemIds).toContain("settings-mail");

    // Must NOT have SEO or Users
    expect(itemIds).not.toContain("seo");
    expect(itemIds).not.toContain("seo-partners");
    expect(itemIds).not.toContain("seo-quick-outreach");
    expect(itemIds).not.toContain("users");
  });

  it("filters out empty parent containers when all sub-items are unauthorized", () => {
    const containerItem: NavItemConfig = {
      id: "parent",
      label: "Parent",
      items: [
        {
          id: "secret",
          label: "Secret",
          path: "/secret",
          roles: ["super_admin"],
        },
      ],
    };

    const filtered = filterNavItemByRole(containerItem, "user");
    expect(filtered).toBeNull();
  });

  describe("hasRequiredRole Helper", () => {
    it("allows any role when allowedRoles is empty or undefined", () => {
      expect(hasRequiredRole("user", undefined)).toBe(true);
      expect(hasRequiredRole("user", [])).toBe(true);
      expect(hasRequiredRole(undefined, [])).toBe(true);
    });

    it("verifies user role against allowed list", () => {
      expect(hasRequiredRole("super_admin", ["super_admin"])).toBe(true);
      expect(hasRequiredRole("admin", ["super_admin", "admin"])).toBe(true);
      expect(hasRequiredRole("user", ["super_admin", "admin"])).toBe(false);
      expect(hasRequiredRole(undefined, ["super_admin"])).toBe(false);
    });
  });
});
