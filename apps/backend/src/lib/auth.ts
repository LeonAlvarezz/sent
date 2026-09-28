import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin as adminPlugin, twoFactor } from "better-auth/plugins";
import { ac, admin, super_admin, user } from "./permissions";
import type { Database } from "@/db";
import * as schema from "@/db/schema";

export const createAuth = (db: Database, trustedOrigins?: string[]) =>
  betterAuth({
    appName: "Sent Outreach",
    database: drizzleAdapter(db, {
      provider: "sqlite",
      schema,
    }),
    emailAndPassword: {
      enabled: true,
    },
    trustedOrigins: trustedOrigins || [
      "http://localhost:5173",
      "https://sent-admin-cts.pages.dev",
      "https://sent.eurasietravel.com",
      "https://*.eurasietravel.com",
    ],
    plugins: [
      twoFactor(),
      adminPlugin({
        ac,
        adminRoles: ["super_admin"],
        roles: {
          admin,
          super_admin,
          user,
        },
      }),
    ],
  });

export type Auth = ReturnType<typeof createAuth>;
