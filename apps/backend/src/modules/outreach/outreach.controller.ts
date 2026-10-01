import type { Context } from "hono";
import * as v from "valibot";
import { BadRequestException } from "@/lib";
import type { OutreachEnv } from "./outreach.hono";
import { SenderService } from "./sender.service";
import { PitchProfileService } from "./pitch-profile.service";
import { EmailService } from "./email.service";
import { ScraperService } from "./scraper.service";
import { GeneratorService } from "./generator.service";
import { DispatchService } from "./dispatch.service";
import { OutreachService } from "./outreach.service";
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
  type EmailsListResponse,
} from "@z3/types";
import { getMeta } from "@/utils/pagination";

export class OutreachController {
  constructor(
    private readonly senderService: SenderService,
    private readonly pitchProfileService: PitchProfileService,
    private readonly emailService: EmailService,
    private readonly scraperService: ScraperService,
    private readonly generatorService: GeneratorService,
    private readonly dispatchService: DispatchService,
    private readonly outreachService: OutreachService,
  ) {}

  // --- SENDERS ---
  listSenders = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const senders = await this.senderService.getSenders(user.id);
    return c.json({ success: true, data: senders });
  };

  createSender = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CreateSenderIdentitySchema, body);
    const sender = await this.senderService.createSender(payload, user.id);
    return c.json(
      { success: true, data: sender, message: "Sender created" },
      201,
    );
  };

  testSender = async (c: Context<OutreachEnv>) => {
    const body = await c.req.json();
    const payload = v.parse(CreateSenderIdentitySchema, body);
    const result = await this.senderService.testConnection(payload);
    return c.json({ success: true, message: result.message });
  };

  updateSender = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid sender ID" });
    const body = await c.req.json();
    const payload = v.parse(UpdateSenderIdentitySchema, body);
    const updated = await this.senderService.updateSender(id, payload, user.id);
    return c.json({ success: true, data: updated });
  };

  deleteSender = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid sender ID" });
    const deleted = await this.senderService.deleteSender(id, user.id);
    return c.json({ success: true, data: deleted });
  };

  // --- PITCH PROFILES ---
  listPitchProfiles = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const profiles = await this.pitchProfileService.getPitchProfiles(user.id);
    return c.json({ success: true, data: profiles });
  };

  getPitchProfile = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid profile ID" });
    const profile = await this.pitchProfileService.getPitchProfile(id, user.id);
    return c.json({ success: true, data: profile });
  };

  createPitchProfile = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CreatePitchProfileSchema, body);
    const profile = await this.pitchProfileService.createPitchProfile(
      payload,
      user.id,
    );
    return c.json(
      { success: true, data: profile, message: "Profile created" },
      201,
    );
  };

  updatePitchProfile = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid profile ID" });
    const body = await c.req.json();
    const payload = v.parse(UpdatePitchProfileSchema, body);
    const updated = await this.pitchProfileService.updatePitchProfile(
      id,
      payload,
      user.id,
    );
    return c.json({ success: true, data: updated });
  };

  deletePitchProfile = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid profile ID" });
    const deleted = await this.pitchProfileService.deletePitchProfile(
      id,
      user.id,
    );
    return c.json({ success: true, data: deleted });
  };

  // --- EMAIL LISTS ---
  listEmailLists = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const lists = await this.emailService.getEmailLists(user.id);
    return c.json({ success: true, data: lists });
  };

  createEmailList = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CreateEmailListSchema, body);
    const list = await this.emailService.createEmailList(payload, user.id);
    return c.json({ success: true, data: list, message: "List created" }, 201);
  };

  deleteEmailList = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid list ID" });
    const deleted = await this.emailService.deleteEmailList(id, user.id);
    return c.json({ success: true, data: deleted });
  };

  // --- EMAILS ---
  listEmails = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const listId = c.req.query("listId")
      ? Number(c.req.query("listId"))
      : undefined;
    const search = c.req.query("search") || undefined;
    const title = c.req.query("title") || undefined;
    const page = c.req.query("page")
      ? Math.max(1, Number(c.req.query("page")))
      : 1;
    const page_size = c.req.query("page_size")
      ? Math.max(1, Number(c.req.query("page_size")))
      : 10;

    const [emails, total] = await Promise.all([
      this.emailService.getEmails(user.id, {
        listId,
        search,
        page,
        page_size,
        title,
      }),
      this.emailService.getEmailsCount(user.id, {
        listId,
        search,
        title,
      }),
    ]);

    return c.json({
      emails,
      meta: getMeta({ page, page_size }, total),
    });
  };

  createEmail = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(CreateEmailSchema, body);
    const newEmail = await this.emailService.createEmail(payload, user.id);
    return c.json(
      { success: true, data: newEmail, message: "Email created" },
      201,
    );
  };

  importEmails = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(ImportEmailsPayloadSchema, body);
    const inserted = await this.emailService.batchInsertEmails(
      payload.emails,
      user.id,
      payload.listId,
    );
    return c.json({
      success: true,
      data: inserted,
      message: `Imported ${inserted.length} emails successfully`,
    });
  };

  updateEmail = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid email ID" });
    const body = await c.req.json();
    const payload = v.parse(UpdateEmailSchema, body);
    const updated = await this.emailService.updateEmail(id, payload, user.id);
    return c.json({ success: true, data: updated });
  };

  deleteEmail = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const id = Number(c.req.param("id"));
    if (isNaN(id))
      throw new BadRequestException({ message: "Invalid email ID" });
    const deleted = await this.emailService.deleteEmail(id, user.id);
    return c.json({ success: true, data: deleted });
  };

  listJobTitles = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const titles = await this.emailService.getJobTitles(user.id);
    return c.json({ success: true, data: titles });
  };

  // --- SCRAPE, GENERATE, DISPATCH, LOGS ---
  getAiStatus = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const status = await this.outreachService.getAiStatus(
      user.id,
      c.env?.OPENAI_API_KEY,
    );
    return c.json({ success: true, data: status });
  };

  scrapeUrl = async (c: Context<OutreachEnv>) => {
    const body = await c.req.json();
    const payload = v.parse(ScrapeUrlSchema, body);
    const result = await this.scraperService.scrapeUrl(payload.url);
    return c.json({ success: true, data: result });
  };

  generateDraft = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(GenerateDraftSchema, body);
    const draft = await this.generatorService.generateDraft(
      payload,
      user.id,
      c.env?.OPENAI_API_KEY,
    );
    return c.json({ success: true, data: draft });
  };

  dispatchEmail = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const payload = v.parse(DispatchOutreachSchema, body);
    const result = await this.dispatchService.dispatchEmail(payload, user.id);
    return c.json(result);
  };

  listLogs = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const logs = await this.outreachService.getLogs(user.id);
    return c.json({ success: true, data: logs });
  };

  // --- SETTINGS ---
  getSettings = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const settings = await this.outreachService.getSettings(user.id);
    return c.json({ success: true, data: settings });
  };

  saveSettings = async (c: Context<OutreachEnv>) => {
    const user = c.get("user");
    const body = await c.req.json();
    const saved = await this.outreachService.saveSettings(user.id, body);
    return c.json({ success: true, data: saved });
  };
}
