import { Hono } from "hono";
import { createDb } from "@/db";
import { OutreachRepository } from "./outreach.repository";
import { SenderService } from "./sender.service";
import { PitchProfileService } from "./pitch-profile.service";
import { EmailService } from "./email.service";
import { ScraperService } from "./scraper.service";
import { GeneratorService } from "./generator.service";
import { DispatchService } from "./dispatch.service";
import { OutreachService } from "./outreach.service";
import { OutreachController } from "./outreach.controller";
import { campaignRouter } from "@/modules/campaign/campaign.hono";
import { requireAdminOrSuperAdmin } from "@/lib/permissions";

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

function getController(dbBinding: D1Database): OutreachController {
  const db = createDb(dbBinding);
  const repo = new OutreachRepository(db);

  const senderService = new SenderService(repo);
  const pitchProfileService = new PitchProfileService(repo);
  const emailService = new EmailService(repo);
  const scraperService = new ScraperService();
  const generatorService = new GeneratorService(repo);
  const dispatchService = new DispatchService(repo);
  const outreachService = new OutreachService(repo);

  return new OutreachController(
    senderService,
    pitchProfileService,
    emailService,
    scraperService,
    generatorService,
    dispatchService,
    outreachService,
  );
}

// --- SENDERS ---
outreachRouter.get("/senders", (c) => getController(c.env.DB).listSenders(c));
outreachRouter.post("/senders", (c) => getController(c.env.DB).createSender(c));
outreachRouter.post("/senders/test", (c) =>
  getController(c.env.DB).testSender(c),
);
outreachRouter.put("/senders/:id", (c) =>
  getController(c.env.DB).updateSender(c),
);
outreachRouter.delete("/senders/:id", (c) =>
  getController(c.env.DB).deleteSender(c),
);

// --- PITCH PROFILES ---
outreachRouter.get("/pitch-profiles", (c) =>
  getController(c.env.DB).listPitchProfiles(c),
);
outreachRouter.get("/pitch-profiles/:id", (c) =>
  getController(c.env.DB).getPitchProfile(c),
);
outreachRouter.post("/pitch-profiles", (c) =>
  getController(c.env.DB).createPitchProfile(c),
);
outreachRouter.put("/pitch-profiles/:id", (c) =>
  getController(c.env.DB).updatePitchProfile(c),
);
outreachRouter.delete("/pitch-profiles/:id", (c) =>
  getController(c.env.DB).deletePitchProfile(c),
);

// --- EMAIL LISTS ---
outreachRouter.get("/lists", (c) =>
  getController(c.env.DB).listEmailLists(c),
);
outreachRouter.post("/lists", (c) =>
  getController(c.env.DB).createEmailList(c),
);
outreachRouter.delete("/lists/:id", (c) =>
  getController(c.env.DB).deleteEmailList(c),
);

// --- EMAILS ---
outreachRouter.get("/emails", (c) => getController(c.env.DB).listEmails(c));
outreachRouter.get("/job-titles", (c) =>
  getController(c.env.DB).listJobTitles(c),
);
outreachRouter.post("/emails", (c) => getController(c.env.DB).createEmail(c));
outreachRouter.post("/emails/import", (c) =>
  getController(c.env.DB).importEmails(c),
);
outreachRouter.put("/emails/:id", (c) =>
  getController(c.env.DB).updateEmail(c),
);
outreachRouter.delete("/emails/:id", (c) =>
  getController(c.env.DB).deleteEmail(c),
);

// --- SCRAPE, GENERATE, DISPATCH, LOGS ---
outreachRouter.get("/ai-status", (c) =>
  getController(c.env.DB).getAiStatus(c),
);
outreachRouter.post("/scrape", requireAdminOrSuperAdmin, (c) =>
  getController(c.env.DB).scrapeUrl(c),
);
outreachRouter.post("/generate", requireAdminOrSuperAdmin, (c) =>
  getController(c.env.DB).generateDraft(c),
);
outreachRouter.post("/dispatch", requireAdminOrSuperAdmin, (c) =>
  getController(c.env.DB).dispatchEmail(c),
);
outreachRouter.get("/logs", requireAdminOrSuperAdmin, (c) =>
  getController(c.env.DB).listLogs(c),
);

// --- SETTINGS ---
outreachRouter.get("/settings", (c) =>
  getController(c.env.DB).getSettings(c),
);
outreachRouter.post("/settings", (c) =>
  getController(c.env.DB).saveSettings(c),
);
