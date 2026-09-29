import { CampaignRepository } from "./campaign.repository";
import {
  CAMPAIGN_STATUS,
  QUEUE_ITEM_STATUS,
  type CreateCampaign,
  type CampaignWithRelations,
  type CampaignQueueItem,
} from "@z3/types";
import { BadRequestException, NotFoundException } from "@/lib";

export interface RecipientTokenData {
  firstName?: string | null;
  lastName?: string | null;
  companyName?: string | null;
  title?: string | null;
  email: string;
  domainUrl?: string | null;
  attributes?: unknown;
}

export interface SenderTokenData {
  name?: string | null;
  email?: string | null;
}

export class CampaignService {
  constructor(private readonly repo: CampaignRepository) {}

  /**
   * Replaces template variables: {{first_name}}, {{company_name}}, {{sender_name}}, etc.
   */
  static renderTemplate(
    template: string,
    recipient: RecipientTokenData,
    sender?: SenderTokenData | null,
  ): string {
    let result = template;
    const senderName =
      sender?.name ||
      (recipient as any).senderName ||
      (recipient as any).sender_name ||
      "";
    const senderEmail =
      sender?.email ||
      (recipient as any).senderEmail ||
      (recipient as any).sender_email ||
      "";

    const tokens: Record<string, string> = {
      first_name: recipient.firstName || "",
      last_name: recipient.lastName || "",
      company_name: recipient.companyName || "",
      title: recipient.title || "",
      email: recipient.email || "",
      domain_url: recipient.domainUrl || "",
      sender_name: senderName,
      sender: senderName,
      sender_email: senderEmail,
    };

    if (recipient.attributes && typeof recipient.attributes === "object") {
      for (const [key, val] of Object.entries(
        recipient.attributes as Record<string, unknown>,
      )) {
        if (typeof val === "string" || typeof val === "number") {
          tokens[key] = String(val);
        }
      }
    }

    for (const [key, val] of Object.entries(tokens)) {
      const regex = new RegExp(`\\{\\{\\s*${key}\\s*\\}\\}`, "gi");
      result = result.replace(regex, val);
    }

    return result;
  }

  renderTemplate(
    template: string,
    recipient: RecipientTokenData,
    sender?: SenderTokenData | null,
  ): string {
    return CampaignService.renderTemplate(template, recipient, sender);
  }

  async resolveAudienceRecipients(data: CreateCampaign, userId: string) {
    const sender = await this.repo.findSender(data.senderId, userId);
    if (!sender) {
      throw new NotFoundException({ message: "Sender mailbox not found" });
    }

    let recipients: any[] = [];
    let audienceType = data.audienceType || "custom";
    let targetJobTitle: string | null = data.jobTitle || null;
    let targetListName: string | undefined;

    if (data.emailIds && data.emailIds.length > 0) {
      recipients = await this.repo.findContactsByIds(data.emailIds, userId);
      audienceType = "custom";
      targetListName = `Custom (${recipients.length} recipients)`;
    } else if (data.jobTitle && data.jobTitle.trim().length > 0) {
      const trimmedJob = data.jobTitle.trim();
      recipients = await this.repo.findContactsByJobTitle(trimmedJob, userId);
      audienceType = "job_title";
      targetJobTitle = trimmedJob;
      targetListName = `Title: ${targetJobTitle}`;
    } else if (data.listId) {
      const targetList = await this.repo.findList(data.listId, userId);
      if (!targetList) {
        throw new NotFoundException({
          message: "Target audience list not found",
        });
      }
      recipients = await this.repo.findContactsByListId(data.listId, userId);
      audienceType = "list";
      targetListName = targetList.name;
    } else {
      throw new BadRequestException({
        message:
          "Please specify target recipients (by job title, custom selection, or audience list)",
      });
    }

    if (recipients.length === 0) {
      throw new BadRequestException({
        message: "No active contacts found for the selected audience to send to",
      });
    }

    return {
      sender,
      recipients,
      audienceType,
      targetJobTitle,
      targetListName,
    };
  }

  async getCampaigns(userId: string): Promise<CampaignWithRelations[]> {
    return this.repo.getCampaigns(userId);
  }

  async getCampaign(
    id: number,
    userId: string,
  ): Promise<CampaignWithRelations> {
    const cmp = await this.repo.getCampaignById(id, userId);
    if (!cmp) {
      throw new NotFoundException({ message: "Campaign not found" });
    }
    return cmp;
  }

  async createCampaign(
    data: CreateCampaign,
    userId: string,
  ): Promise<CampaignWithRelations> {
    const { sender, recipients, audienceType, targetJobTitle, targetListName } =
      await this.resolveAudienceRecipients(data, userId);

    const initialStatus = data.autoStart
      ? CAMPAIGN_STATUS.RUNNING
      : CAMPAIGN_STATUS.QUEUED;

    const createdCampaign = await this.repo.createCampaign({
      userId,
      listId: data.listId || null,
      audienceType,
      targetJobTitle,
      senderId: data.senderId,
      pitchProfileId: data.pitchProfileId || null,
      name: data.name,
      subject: data.subject,
      body: data.body,
      status: initialStatus,
      delayMinSeconds: data.delayMinSeconds ?? 15,
      delayMaxSeconds: data.delayMaxSeconds ?? 45,
      totalCount: recipients.length,
      sentCount: 0,
      failedCount: 0,
      startedAt: data.autoStart ? new Date() : null,
    });

    const queueRows = recipients.map((r: any) => ({
      campaignId: createdCampaign.id,
      emailId: r.id,
      recipientEmail: r.email,
      recipientName: [r.firstName, r.lastName].filter(Boolean).join(" ") || null,
      renderedSubject: this.renderTemplate(data.subject, r, sender),
      renderedBody: this.renderTemplate(data.body, r, sender),
      status: QUEUE_ITEM_STATUS.PENDING,
      retryCount: 0,
    }));

    await this.repo.insertQueueItems(queueRows);

    return {
      ...createdCampaign,
      listName: targetListName,
      senderEmail: sender.email,
      senderName: sender.name,
    };
  }

  async getQueueItems(
    campaignId: number,
    userId: string,
    options?: { status?: string; limit?: number; offset?: number },
  ): Promise<{ items: CampaignQueueItem[]; total: number }> {
    await this.getCampaign(campaignId, userId);

    const [items, total] = await Promise.all([
      this.repo.getQueueItems(campaignId, options),
      this.repo.countQueueItems(campaignId, options?.status),
    ]);

    return { items, total };
  }

  async updateCampaignStatus(
    campaignId: number,
    userId: string,
    status: CAMPAIGN_STATUS,
  ): Promise<CampaignWithRelations> {
    const existing = await this.getCampaign(campaignId, userId);

    const updates: Record<string, any> = {
      status,
      updatedAt: new Date(),
    };

    if (status === CAMPAIGN_STATUS.RUNNING && !existing.startedAt) {
      updates.startedAt = new Date();
    }
    if (
      status === CAMPAIGN_STATUS.COMPLETED ||
      status === CAMPAIGN_STATUS.CANCELLED
    ) {
      updates.completedAt = new Date();
    }

    await this.repo.updateCampaign(campaignId, userId, updates);

    if (status === CAMPAIGN_STATUS.CANCELLED) {
      await this.repo.cancelPendingQueueItems(campaignId);
    }

    return this.getCampaign(campaignId, userId);
  }

  async retryFailedItems(
    campaignId: number,
    userId: string,
  ): Promise<CampaignWithRelations> {
    await this.getCampaign(campaignId, userId);

    await this.repo.resetFailedQueueItems(campaignId);
    await this.repo.updateCampaign(campaignId, userId, {
      status: CAMPAIGN_STATUS.RUNNING,
      failedCount: 0,
      completedAt: null,
      updatedAt: new Date(),
    });

    return this.getCampaign(campaignId, userId);
  }
}
