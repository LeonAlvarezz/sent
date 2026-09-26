import { Hono } from "hono";
import { createDb } from "@/db";
import { CampaignRepository } from "./campaign.repository";
import { CampaignService } from "./campaign.service";
import { CampaignRunnerService } from "./campaign-runner.service";
import { CampaignController } from "./campaign.controller";
import { OutreachRepository } from "@/modules/outreach/outreach.repository";
import { DispatchService } from "@/modules/outreach/dispatch.service";

export type CampaignEnv = {
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

export const campaignRouter = new Hono<CampaignEnv>();

function getController(dbBinding: D1Database): CampaignController {
  const db = createDb(dbBinding);
  const repo = new CampaignRepository(db);
  const service = new CampaignService(repo);
  const outreachRepo = new OutreachRepository(db);
  const dispatchService = new DispatchService(outreachRepo);
  const runner = new CampaignRunnerService(repo, dispatchService);
  return new CampaignController(service, runner);
}

campaignRouter.get("/", (c) => getController(c.env.DB).listCampaigns(c));
campaignRouter.post("/", (c) => getController(c.env.DB).createCampaign(c));
campaignRouter.get("/:id", (c) => getController(c.env.DB).getCampaign(c));
campaignRouter.get("/:id/items", (c) =>
  getController(c.env.DB).getQueueItems(c),
);
campaignRouter.post("/:id/start", (c) =>
  getController(c.env.DB).startCampaign(c),
);
campaignRouter.post("/:id/pause", (c) =>
  getController(c.env.DB).pauseCampaign(c),
);
campaignRouter.post("/:id/resume", (c) =>
  getController(c.env.DB).resumeCampaign(c),
);
campaignRouter.post("/:id/cancel", (c) =>
  getController(c.env.DB).cancelCampaign(c),
);
campaignRouter.post("/:id/retry", (c) =>
  getController(c.env.DB).retryCampaign(c),
);
campaignRouter.post("/:id/tick", (c) => getController(c.env.DB).tickBatch(c));
