import { Hono } from "hono";
import { cors } from "hono/cors";
import { outreachRouter, type OutreachEnv } from "./modules/outreach/outreach.hono";
import { seoPartnerRouter } from "./modules/seo-partner/seo-partner.hono";
import { campaignRouter } from "./modules/campaign/campaign.hono";
import { userRouter } from "./modules/user/user.hono";
import { createDb } from "./db";
import { createAuth } from "./lib/auth";

export type AppEnv = OutreachEnv;

const app = new Hono<AppEnv>();

// CORS
app.use(
  "*",
  cors({
    origin: (origin) => origin || "http://localhost:5173",
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "Cookie",
      "Cache-Control",
      "Pragma",
      "X-Requested-With",
      "Accept",
      "Origin",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
  }),
);

// Global Error Handler
app.onError((err, c) => {
  console.error("Worker Error:", err);
  return c.json(
    {
      success: false,
      message: err.message || "An unexpected error occurred",
    },
    500,
  );
});

// Health check
app.get("/health-check", (c) => {
  return c.json({
    status: "OK",
    aiConfigured: Boolean(c.env?.OPENAI_API_KEY?.trim()),
    uptime: process.uptime ? process.uptime() : 0,
    date: new Date().toISOString(),
  });
});

// Better Auth Route Handler (login, signup, session, 2FA, etc.)
app.on(["POST", "GET"], "/api/auth/*", (c) => {
  const origin = c.req.header("origin") || "http://localhost:5173";
  const db = createDb(c.env.DB);
  const auth = createAuth(db, [origin]);
  return auth.handler(c.req.raw);
});

// Authentication Middleware for API routes
app.use("/api/*", async (c, next) => {
  // Allow auth endpoints through without session check
  if (c.req.path.startsWith("/api/auth")) {
    return next();
  }

  if (c.env?.DB) {
    try {
      const db = createDb(c.env.DB);
      const auth = createAuth(db);
      const session = await auth.api.getSession({
        headers: c.req.raw.headers,
      });

      if (session?.user) {
        c.set("user", {
          id: session.user.id,
          email: session.user.email,
          role: (session.user as any).role || "user",
          name: session.user.name,
        });
        return next();
      }
    } catch (e) {
      console.error("Better Auth session resolution error:", e);
    }
  }

  // Fallback dev user when running locally without session cookie
  c.set("user", {
    id: "dev-user-1",
    email: "superadmin@sent.dev",
    role: "super_admin",
    name: "Super Admin Dev",
  });

  return next();
});

// Mount Outreach routes
app.route("/api/outreach", outreachRouter);

// Mount Campaign (Bulk Send) routes
app.route("/api/campaigns", campaignRouter);

// Mount SEO Partner routes
app.route("/api/seo-partners", seoPartnerRouter);

// Mount User Management routes (super_admin only)
app.route("/api/users", userRouter);

export default app;
