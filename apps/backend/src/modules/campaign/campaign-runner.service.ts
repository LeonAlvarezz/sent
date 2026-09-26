import { CampaignRepository } from "./campaign.repository";
import { DispatchService } from "@/modules/outreach/dispatch.service";
import { CAMPAIGN_STATUS, QUEUE_ITEM_STATUS } from "@z3/types";

export class CampaignRunnerService {
  constructor(
    private readonly campaignRepo: CampaignRepository,
    private readonly dispatchService: DispatchService,
  ) {}

  /**
   * Process a single batch chunk of queued emails for a campaign.
   * Can be invoked by HTTP tick, background execution, or cron.
   */
  async processBatch(
    campaignId: number,
    userId: string,
    batchSize = 3,
  ): Promise<{
    processed: number;
    sent: number;
    failed: number;
    remaining: number;
    status: string;
  }> {
    const cmp = await this.campaignRepo.getCampaignById(campaignId, userId);
    if (!cmp) {
      throw new Error(`Campaign #${campaignId} not found`);
    }

    if (cmp.status !== CAMPAIGN_STATUS.RUNNING) {
      return {
        processed: 0,
        sent: 0,
        failed: 0,
        remaining: cmp.totalCount - (cmp.sentCount + cmp.failedCount),
        status: cmp.status,
      };
    }

    let processed = 0;
    let sent = 0;
    let failed = 0;

    for (let i = 0; i < batchSize; i++) {
      // 1. Claim next pending item atomically
      const item = await this.campaignRepo.claimNextPendingItem(campaignId);
      if (!item) {
        // No more pending items
        break;
      }

      processed++;

      // 2. Dispatch the email via SMTP
      try {
        await this.dispatchService.dispatchEmail(
          {
            senderId: cmp.senderId,
            recipientEmail: item.recipientEmail,
            recipientName: item.recipientName || undefined,
            subject: item.renderedSubject,
            body: item.renderedBody,
            listId: cmp.listId || undefined,
            pitchProfileId: cmp.pitchProfileId || undefined,
          },
          userId,
        );

        // 3. Mark sent
        await this.campaignRepo.markItemSent(item.id, campaignId);
        sent++;
      } catch (err: any) {
        // 4. Mark failed
        const errMsg = err?.message || "Failed to dispatch email";
        await this.campaignRepo.markItemFailed(item.id, campaignId, errMsg);
        failed++;
      }

      // 5. Throttling jitter delay between sends (if more items remain to process in this batch)
      if (i < batchSize - 1) {
        const min = cmp.delayMinSeconds ?? 15;
        const max = cmp.delayMaxSeconds ?? 45;
        const jitter = Math.floor(Math.random() * (max - min + 1)) + min;
        // In local/worker environment, sleep briefly (capped at 5s per chunk iteration to prevent timeout)
        const sleepTime = Math.min(jitter, 3) * 1000;
        await new Promise((resolve) => setTimeout(resolve, sleepTime));
      }
    }

    // Check if campaign is now complete
    await this.campaignRepo.finalizeCampaignIfFinished(campaignId);

    // Refresh updated campaign stats
    const updatedCmp = await this.campaignRepo.getCampaignById(campaignId, userId);
    const remaining = updatedCmp
      ? updatedCmp.totalCount - (updatedCmp.sentCount + updatedCmp.failedCount)
      : 0;

    return {
      processed,
      sent,
      failed,
      remaining: Math.max(0, remaining),
      status: updatedCmp?.status || cmp.status,
    };
  }
}
