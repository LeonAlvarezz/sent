import { Hono } from "hono";
import * as v from "valibot";
import { OutreachRepository } from "./outreach.repository";
import { SenderService } from "./sender.service";
import { ScraperService } from "./scraper.service";
import { GeneratorService } from "./generator.service";
import { DispatchService } from "./dispatch.service";
import { campaignRouter } from "@/modules/campaign/campaign.hono";
import { createDb } from "@/db";
import {
  CreateEmailListSchema,
  CreateEmailSchema,
  CreatePitchProfileSchema,
  CreateSenderIdentitySchema,
  DispatchOutreachSchema,
  GenerateDraftSchema,
  ImportEmailsPayloadSchema,
  ScrapeUrlSchema,
  UpdateEmailSchema,
  UpdatePitchProfileSchema,
  UpdateSenderIdentitySchema,
} from "@z3/types";

export type OutreachEnv = {
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

export const outreachRouter = new Hono<OutreachEnv>();

// Mount dedicated Campaign router under /campaigns for backwards compatibility
outreachRouter.route("/campaigns", campaignRouter);

// Lazy helper to get services for current request on demand
function getServices(dbBinding: D1Database) {
  let db: ReturnType<typeof createDb> | undefined;
  const getDb = () => (db ??= createDb(dbBinding));

  let repo: OutreachRepository | undefined;
  const getRepo = () => (repo ??= new OutreachRepository(getDb()));

  return {
    get repo() {
      return getRepo();
    },
    get senderService() {
      return new SenderService(getRepo());
    },
    get scraperService() {
      return new ScraperService();
    },
    get generatorService() {
      return new GeneratorService(getRepo());
    },
    get dispatchService() {
      return new DispatchService(getRepo());
    },
  };
}

// --- SENDERS ---
outreachRouter.get("/senders", async (c) => {
  const user = c.get("user");
  const { senderService } = getServices(c.env.DB);
  const senders = await senderService.getSenders(user.id);
  return c.json({ success: true, data: senders });
});

outreachRouter.post("/senders", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(CreateSenderIdentitySchema, body);
  const { senderService } = getServices(c.env.DB);
  const sender = await senderService.createSender(payload, user.id);
  return c.json(
    { success: true, data: sender, message: "Sender created" },
    201,
  );
});

outreachRouter.post("/senders/test", async (c) => {
  const body = await c.req.json();
  const payload = v.parse(CreateSenderIdentitySchema, body);
  const { senderService } = getServices(c.env.DB);
  const result = await senderService.testConnection(payload);
  return c.json({ success: true, message: result.message });
});

outreachRouter.put("/senders/:id", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const payload = v.parse(UpdateSenderIdentitySchema, body);
  const { senderService } = getServices(c.env.DB);
  const updated = await senderService.updateSender(id, payload, user.id);
  return c.json({ success: true, data: updated });
});

outreachRouter.delete("/senders/:id", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const { senderService } = getServices(c.env.DB);
  const deleted = await senderService.deleteSender(id, user.id);
  return c.json({ success: true, data: deleted });
});

// --- PITCH PROFILES ---
outreachRouter.get("/pitch-profiles", async (c) => {
  const user = c.get("user");
  const { repo } = getServices(c.env.DB);
  const profiles = await repo.getPitchProfiles(user.id);
  return c.json({ success: true, data: profiles });
});

outreachRouter.get("/pitch-profiles/:id", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const { repo } = getServices(c.env.DB);
  const profile = await repo.getPitchProfile(id, user.id);
  return c.json({ success: true, data: profile });
});

outreachRouter.post("/pitch-profiles", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(CreatePitchProfileSchema, body);
  const { repo } = getServices(c.env.DB);
  const profile = await repo.createPitchProfile(payload, user.id);
  return c.json(
    { success: true, data: profile, message: "Profile created" },
    201,
  );
});

outreachRouter.put("/pitch-profiles/:id", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const payload = v.parse(UpdatePitchProfileSchema, body);
  const { repo } = getServices(c.env.DB);
  const updated = await repo.updatePitchProfile(id, payload, user.id);
  return c.json({ success: true, data: updated });
});

outreachRouter.delete("/pitch-profiles/:id", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const { repo } = getServices(c.env.DB);
  const deleted = await repo.deletePitchProfile(id, user.id);
  return c.json({ success: true, data: deleted });
});

// --- EMAIL LISTS ---
outreachRouter.get("/lists", async (c) => {
  const user = c.get("user");
  const { repo } = getServices(c.env.DB);
  const lists = await repo.getEmailLists(user.id);
  return c.json({ success: true, data: lists });
});

outreachRouter.post("/lists", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(CreateEmailListSchema, body);
  const { repo } = getServices(c.env.DB);
  const list = await repo.createEmailList(payload, user.id);
  return c.json({ success: true, data: list, message: "List created" }, 201);
});

outreachRouter.delete("/lists/:id", async (c) => {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const { repo } = getServices(c.env.DB);
  const deleted = await repo.deleteEmailList(id, user.id);
  return c.json({ success: true, data: deleted });
});

// --- EMAILS ---
async function handleGetEmails(c: any) {
  const user = c.get("user");
  const listId = c.req.query("listId")
    ? Number(c.req.query("listId"))
    : undefined;
  const search = c.req.query("search") || undefined;
  const title = c.req.query("title") || undefined;
  const limit = c.req.query("limit")
    ? Number(c.req.query("limit"))
    : undefined;
  const { repo } = getServices(c.env.DB);
  const emails = await repo.getEmails(user.id, { listId, search, limit, title });
  return c.json({ success: true, data: emails });
}

async function handleCreateEmail(c: any) {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(CreateEmailSchema, body);
  const { repo } = getServices(c.env.DB);
  const newEmail = await repo.createEmail(payload, user.id);
  return c.json(
    { success: true, data: newEmail, message: "Email created" },
    201,
  );
}

async function handleImportEmails(c: any) {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(ImportEmailsPayloadSchema, body);
  const { repo } = getServices(c.env.DB);
  const inserted = await repo.batchInsertEmails(
    payload.emails,
    user.id,
    payload.listId,
  );
  return c.json({
    success: true,
    data: inserted,
    message: `Imported ${inserted.length} emails successfully`,
  });
}

async function handleUpdateEmail(c: any) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  const payload = v.parse(UpdateEmailSchema, body);
  const { repo } = getServices(c.env.DB);
  const updated = await repo.updateEmail(id, payload, user.id);
  return c.json({ success: true, data: updated });
}

async function handleDeleteEmail(c: any) {
  const user = c.get("user");
  const id = Number(c.req.param("id"));
  const { repo } = getServices(c.env.DB);
  const deleted = await repo.deleteEmail(id, user.id);
  return c.json({ success: true, data: deleted });
}

outreachRouter.get("/emails", handleGetEmails);
outreachRouter.get("/job-titles", async (c) => {
  const user = c.get("user");
  const { repo } = getServices(c.env.DB);
  const titles = await repo.getJobTitles(user.id);
  return c.json({ success: true, data: titles });
});
outreachRouter.post("/emails", handleCreateEmail);
outreachRouter.post("/emails/import", handleImportEmails);
outreachRouter.put("/emails/:id", handleUpdateEmail);
outreachRouter.delete("/emails/:id", handleDeleteEmail);

// --- SCRAPE, GENERATE, DISPATCH ---
outreachRouter.post("/scrape", async (c) => {
  const body = await c.req.json();
  const payload = v.parse(ScrapeUrlSchema, body);
  const { scraperService } = getServices(c.env.DB);
  const result = await scraperService.scrapeUrl(payload.url);
  return c.json({ success: true, data: result });
});

outreachRouter.post("/generate", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(GenerateDraftSchema, body);
  const { generatorService } = getServices(c.env.DB);
  const draft = await generatorService.generateDraft(
    payload,
    user.id,
    c.env?.OPENAI_API_KEY,
  );
  return c.json({ success: true, data: draft });
});

outreachRouter.post("/dispatch", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const payload = v.parse(DispatchOutreachSchema, body);
  const { dispatchService } = getServices(c.env.DB);
  const result = await dispatchService.dispatchEmail(payload, user.id);
  return c.json(result);
});

outreachRouter.get("/logs", async (c) => {
  const user = c.get("user");
  const { repo } = getServices(c.env.DB);
  const logs = await repo.getOutreachLogs(user.id);
  return c.json({ success: true, data: logs });
});

// --- SETTINGS ---
outreachRouter.get("/settings", async (c) => {
  const user = c.get("user");
  const { repo } = getServices(c.env.DB);
  const settings = await repo.getSettings(user.id);
  return c.json({ success: true, data: settings });
});

outreachRouter.post("/settings", async (c) => {
  const user = c.get("user");
  const body = await c.req.json();
  const { repo } = getServices(c.env.DB);
  const saved = await repo.saveSettings(user.id, body);
  return c.json({ success: true, data: saved });
});
