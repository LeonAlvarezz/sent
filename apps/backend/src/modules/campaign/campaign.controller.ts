import type { Context } from "hono";
import * as v from "valibot";
import { CampaignService } from "./campaign.service";
import { CampaignRunnerService } from "./campaign-runner.service";
import type { CampaignEnv } from "./campaign.hono";
import { CAMPAIGN_STATUS, CreateCampaignSchema } from "@z3/types";
import { BadRequestException } from "@/lib";

export class CampaignController {
  constructor(
    private readonly service: CampaignService,
    private readonly runner: CampaignRunnerService,
  ) {}

  listCampaigns = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const campaigns = await this.service.getCampaigns(user.id);
    return c.json({ success: true, data: campaigns });
  };

  getCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const campaign = await this.service.getCampaign(id, user.id);
    return c.json({ success: true, data: campaign });
  };

  createCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CreateCampaignSchema, body);

    const newCampaign = await this.service.createCampaign(payload, user.id);

    // If autoStart, trigger initial batch execution in background
    if (payload.autoStart) {
      c.executionCtx?.waitUntil?.(
        this.runner.processBatch(newCampaign.id, user.id, 5),
      );
    }

    return c.json(
      {
        success: true,
        data: newCampaign,
        message: `Campaign "${newCampaign.name}" created with ${newCampaign.totalCount} emails queued`,
      },
      201,
    );
  };

  getQueueItems = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const status = c.req.query("status") || undefined;
    const limit = c.req.query("limit") ? Number(c.req.query("limit")) : 50;
    const offset = c.req.query("offset") ? Number(c.req.query("offset")) : 0;

    const result = await this.service.getQueueItems(id, user.id, {
      status,
      limit,
      offset,
    });

    return c.json({ success: true, data: result.items, total: result.total });
  };

  startCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const updated = await this.service.updateCampaignStatus(
      id,
      user.id,
      CAMPAIGN_STATUS.RUNNING,
    );

    c.executionCtx?.waitUntil?.(this.runner.processBatch(id, user.id, 5));

    return c.json({
      success: true,
      data: updated,
      message: "Campaign started",
    });
  };

  pauseCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const updated = await this.service.updateCampaignStatus(
      id,
      user.id,
      CAMPAIGN_STATUS.PAUSED,
    );

    return c.json({ success: true, data: updated, message: "Campaign paused" });
  };

  resumeCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const updated = await this.service.updateCampaignStatus(
      id,
      user.id,
      CAMPAIGN_STATUS.RUNNING,
    );

    c.executionCtx?.waitUntil?.(this.runner.processBatch(id, user.id, 5));

    return c.json({
      success: true,
      data: updated,
      message: "Campaign resumed",
    });
  };

  cancelCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const updated = await this.service.updateCampaignStatus(
      id,
      user.id,
      CAMPAIGN_STATUS.CANCELLED,
    );

    return c.json({
      success: true,
      data: updated,
      message: "Campaign cancelled",
    });
  };

  retryCampaign = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const updated = await this.service.retryFailedItems(id, user.id);

    c.executionCtx?.waitUntil?.(this.runner.processBatch(id, user.id, 5));

    return c.json({
      success: true,
      data: updated,
      message: "Retrying failed emails",
    });
  };

  tickBatch = async (c: Context<CampaignEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id)) {
      throw new BadRequestException({ message: "Invalid campaign ID" });
    }

    const batchSize = c.req.query("batchSize")
      ? Number(c.req.query("batchSize"))
      : 3;

    const result = await this.runner.processBatch(id, user.id, batchSize);
    return c.json({ success: true, data: result });
  };
}
