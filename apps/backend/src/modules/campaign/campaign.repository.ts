import { and, desc, eq, inArray, sql } from "drizzle-orm";
import type { Database } from "@/db";
import {
  campaign,
  campaignQueue,
  email,
  emailList,
  pitchProfile,
  senderIdentity,
} from "@/db/schema";
import {
  CAMPAIGN_STATUS,
  QUEUE_ITEM_STATUS,
  EMAIL_STATUS,
  type CampaignWithRelations,
  type CampaignQueueItem,
} from "@z3/types";

export class CampaignRepository {
  constructor(private readonly db: Database) {}

  async getCampaigns(userId: string): Promise<CampaignWithRelations[]> {
    const rows = await this.db
      .select({
        campaign: campaign,
        listName: emailList.name,
        senderEmail: senderIdentity.email,
        senderName: senderIdentity.name,
        pitchProfileName: pitchProfile.name,
      })
      .from(campaign)
      .leftJoin(emailList, eq(campaign.listId, emailList.id))
      .leftJoin(senderIdentity, eq(campaign.senderId, senderIdentity.id))
      .leftJoin(pitchProfile, eq(campaign.pitchProfileId, pitchProfile.id))
      .where(eq(campaign.userId, userId))
      .orderBy(desc(campaign.createdAt));

    return rows.map((r: any) => ({
      ...r.campaign,
      listName:
        r.listName ||
        (r.campaign.targetJobTitle
          ? `Title: ${r.campaign.targetJobTitle}`
          : r.campaign.audienceType === "custom"
            ? "Custom Selection"
            : undefined),
      senderEmail: r.senderEmail || undefined,
      senderName: r.senderName || undefined,
      pitchProfileName: r.pitchProfileName || undefined,
    }));
  }

  async getCampaignById(
    id: number,
    userId: string,
  ): Promise<CampaignWithRelations | null> {
    const rows = await this.db
      .select({
        campaign: campaign,
        listName: emailList.name,
        senderEmail: senderIdentity.email,
        senderName: senderIdentity.name,
        pitchProfileName: pitchProfile.name,
      })
      .from(campaign)
      .leftJoin(emailList, eq(campaign.listId, emailList.id))
      .leftJoin(senderIdentity, eq(campaign.senderId, senderIdentity.id))
      .leftJoin(pitchProfile, eq(campaign.pitchProfileId, pitchProfile.id))
      .where(and(eq(campaign.id, id), eq(campaign.userId, userId)))
      .limit(1);

    if (rows.length === 0) return null;
    const r = rows[0];
    return {
      ...r.campaign,
      listName:
        r.listName ||
        (r.campaign.targetJobTitle
          ? `Title: ${r.campaign.targetJobTitle}`
          : r.campaign.audienceType === "custom"
            ? "Custom Selection"
            : undefined),
      senderEmail: r.senderEmail || undefined,
      senderName: r.senderName || undefined,
      pitchProfileName: r.pitchProfileName || undefined,
    };
  }

  async createCampaign(
    record: typeof campaign.$inferInsert,
  ): Promise<typeof campaign.$inferSelect> {
    const [inserted] = await this.db.insert(campaign).values(record).returning();
    return inserted;
  }

  async insertQueueItems(
    items: Array<typeof campaignQueue.$inferInsert>,
  ): Promise<void> {
    if (items.length === 0) return;
    // D1 bound parameter limit: batch insert in chunks of 10 rows
    const CHUNK_SIZE = 10;
    for (let i = 0; i < items.length; i += CHUNK_SIZE) {
      const chunk = items.slice(i, i + CHUNK_SIZE);
      await this.db.insert(campaignQueue).values(chunk);
    }
  }

  async getQueueItems(
    campaignId: number,
    options?: { status?: string; limit?: number; offset?: number },
  ): Promise<CampaignQueueItem[]> {
    const conditions = [eq(campaignQueue.campaignId, campaignId)];
    if (options?.status) {
      conditions.push(eq(campaignQueue.status, options.status as any));
    }

    return this.db
      .select()
      .from(campaignQueue)
      .where(and(...conditions))
      .limit(options?.limit ?? 50)
      .offset(options?.offset ?? 0)
      .orderBy(campaignQueue.id);
  }

  async countQueueItems(
    campaignId: number,
    status?: string,
  ): Promise<number> {
    const conditions = [eq(campaignQueue.campaignId, campaignId)];
    if (status) {
      conditions.push(eq(campaignQueue.status, status as any));
    }

    const [res] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(campaignQueue)
      .where(and(...conditions));

    return res?.count ?? 0;
  }

  async claimNextPendingItem(
    campaignId: number,
  ): Promise<CampaignQueueItem | null> {
    const pending = await this.db
      .select()
      .from(campaignQueue)
      .where(
        and(
          eq(campaignQueue.campaignId, campaignId),
          eq(campaignQueue.status, QUEUE_ITEM_STATUS.PENDING),
        ),
      )
      .limit(1);

    if (pending.length === 0) return null;

    const item = pending[0];
    await this.db
      .update(campaignQueue)
      .set({ status: QUEUE_ITEM_STATUS.SENDING })
      .where(eq(campaignQueue.id, item.id));

    return { ...item, status: QUEUE_ITEM_STATUS.SENDING };
  }

  async markItemSent(itemId: number, campaignId: number): Promise<void> {
    const now = new Date();
    await this.db
      .update(campaignQueue)
      .set({
        status: QUEUE_ITEM_STATUS.SENT,
        sentAt: now,
        errorMessage: null,
      })
      .where(eq(campaignQueue.id, itemId));

    await this.db
      .update(campaign)
      .set({
        sentCount: sql`${campaign.sentCount} + 1`,
        updatedAt: now,
      })
      .where(eq(campaign.id, campaignId));
  }

  async markItemFailed(
    itemId: number,
    campaignId: number,
    errorMessage: string,
  ): Promise<void> {
    const now = new Date();
    await this.db
      .update(campaignQueue)
      .set({
        status: QUEUE_ITEM_STATUS.FAILED,
        errorMessage,
        retryCount: sql`${campaignQueue.retryCount} + 1`,
      })
      .where(eq(campaignQueue.id, itemId));

    await this.db
      .update(campaign)
      .set({
        failedCount: sql`${campaign.failedCount} + 1`,
        updatedAt: now,
      })
      .where(eq(campaign.id, campaignId));
  }

  async countUnfinishedItems(campaignId: number): Promise<number> {
    const [res] = await this.db
      .select({ count: sql<number>`count(*)` })
      .from(campaignQueue)
      .where(
        and(
          eq(campaignQueue.campaignId, campaignId),
          inArray(campaignQueue.status, [
            QUEUE_ITEM_STATUS.PENDING,
            QUEUE_ITEM_STATUS.SENDING,
          ]),
        ),
      );

    return res?.count ?? 0;
  }

  async finalizeCampaignIfFinished(campaignId: number): Promise<boolean> {
    const unfinished = await this.countUnfinishedItems(campaignId);
    if (unfinished === 0) {
      await this.db
        .update(campaign)
        .set({
          status: CAMPAIGN_STATUS.COMPLETED,
          completedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(campaign.id, campaignId));
      return true;
    }
    return false;
  }

  async updateCampaign(
    campaignId: number,
    userId: string,
    updates: Partial<typeof campaign.$inferInsert>,
  ): Promise<void> {
    await this.db
      .update(campaign)
      .set(updates)
      .where(and(eq(campaign.id, campaignId), eq(campaign.userId, userId)));
  }

  async cancelPendingQueueItems(campaignId: number): Promise<void> {
    await this.db
      .update(campaignQueue)
      .set({
        status: QUEUE_ITEM_STATUS.FAILED,
        errorMessage: "Campaign cancelled by user",
      })
      .where(
        and(
          eq(campaignQueue.campaignId, campaignId),
          eq(campaignQueue.status, QUEUE_ITEM_STATUS.PENDING),
        ),
      );
  }

  async resetFailedQueueItems(campaignId: number): Promise<void> {
    await this.db
      .update(campaignQueue)
      .set({
        status: QUEUE_ITEM_STATUS.PENDING,
        errorMessage: null,
      })
      .where(
        and(
          eq(campaignQueue.campaignId, campaignId),
          eq(campaignQueue.status, QUEUE_ITEM_STATUS.FAILED),
        ),
      );
  }

  // --- Audience and Dependency Lookups ---
  async findSender(senderId: number, userId: string) {
    return this.db.query.senderIdentity.findFirst({
      where: and(
        eq(senderIdentity.id, senderId),
        eq(senderIdentity.userId, userId),
      ),
    });
  }

  async findContactsByIds(ids: number[], userId: string) {
    return this.db
      .select()
      .from(email)
      .where(
        and(
          inArray(email.id, ids),
          eq(email.userId, userId),
          eq(email.status, EMAIL_STATUS.ACTIVE),
        ),
      );
  }

  async findContactsByJobTitle(jobTitle: string, userId: string) {
    return this.db
      .select()
      .from(email)
      .where(
        and(
          eq(email.title, jobTitle),
          eq(email.userId, userId),
          eq(email.status, EMAIL_STATUS.ACTIVE),
        ),
      );
  }

  async findList(listId: number, userId: string) {
    return this.db.query.emailList.findFirst({
      where: and(eq(emailList.id, listId), eq(emailList.userId, userId)),
    });
  }

  async findContactsByListId(listId: number, userId: string) {
    return this.db
      .select()
      .from(email)
      .where(
        and(
          eq(email.listId, listId),
          eq(email.userId, userId),
          eq(email.status, EMAIL_STATUS.ACTIVE),
        ),
      );
  }
}
