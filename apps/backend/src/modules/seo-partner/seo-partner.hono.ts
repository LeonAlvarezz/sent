import { Hono } from "hono";
import { createDb } from "@/db";
import { SeoPartnerRepository } from "./seo-partner.repository";
import { SeoPartnerService } from "./seo-partner.service";
import { SeoPartnerController } from "./seo-partner.controller";
import { requireAdminOrSuperAdmin } from "@/lib/permissions";

export type SeoPartnerEnv = {
  Bindings: {
    DB: D1Database;
    OPENAI_API_KEY?: string;
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

export const seoPartnerRouter = new Hono<SeoPartnerEnv>();

// Restrict all SEO Partner endpoints to admin and super_admin
seoPartnerRouter.use("*", requireAdminOrSuperAdmin);

function getController(dbBinding: D1Database): SeoPartnerController {
  const db = createDb(dbBinding);
  const repo = new SeoPartnerRepository(db);
  const service = new SeoPartnerService(repo);
  return new SeoPartnerController(service);
}

// Routes delegating to controller
seoPartnerRouter.get("/", (c) => getController(c.env.DB).listPartners(c));
seoPartnerRouter.get("/targets", (c) => getController(c.env.DB).getTargets(c));
seoPartnerRouter.get("/:id", (c) => getController(c.env.DB).getPartner(c));
seoPartnerRouter.post("/", (c) => getController(c.env.DB).createPartner(c));
seoPartnerRouter.post("/batch", (c) => getController(c.env.DB).batchImport(c));
seoPartnerRouter.put("/:id", (c) => getController(c.env.DB).updatePartner(c));
seoPartnerRouter.delete("/:id", (c) => getController(c.env.DB).deletePartner(c));
