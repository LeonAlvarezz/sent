import * as v from "valibot";

export enum CAMPAIGN_STATUS {
  DRAFT = "draft",
  QUEUED = "queued",
  RUNNING = "running",
  PAUSED = "paused",
  COMPLETED = "completed",
  CANCELLED = "cancelled",
}

export enum QUEUE_ITEM_STATUS {
  PENDING = "pending",
  SENDING = "sending",
  SENT = "sent",
  FAILED = "failed",
}

// CAMPAIGN & QUEUE
export const JobTitleItemSchema = v.object({
  title: v.string(),
  count: v.number(),
});

export type JobTitleItem = v.InferOutput<typeof JobTitleItemSchema>;

export const CampaignSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  listId: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  audienceType: v.optional(v.nullable(v.string())),
  targetJobTitle: v.optional(v.nullable(v.string())),
  senderId: v.pipe(v.number(), v.integer()),
  pitchProfileId: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  name: v.string(),
  subject: v.string(),
  body: v.string(),
  status: v.enum(CAMPAIGN_STATUS),
  delayMinSeconds: v.number(),
  delayMaxSeconds: v.number(),
  totalCount: v.number(),
  sentCount: v.number(),
  failedCount: v.number(),
  startedAt: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  completedAt: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  createdAt: v.union([v.date(), v.string()]),
  updatedAt: v.union([v.date(), v.string()]),
});

export type Campaign = v.InferOutput<typeof CampaignSchema>;

export const CreateCampaignSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Campaign name is required")),
  listId: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  emailIds: v.optional(v.array(v.pipe(v.number(), v.integer()))),
  jobTitle: v.optional(v.nullable(v.string())),
  audienceType: v.optional(v.nullable(v.string())),
  senderId: v.pipe(v.number(), v.integer()),
  pitchProfileId: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  subject: v.pipe(v.string(), v.minLength(1, "Subject is required")),
  body: v.pipe(v.string(), v.minLength(1, "Body is required")),
  delayMinSeconds: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 15),
  delayMaxSeconds: v.optional(v.pipe(v.number(), v.integer(), v.minValue(1)), 45),
  autoStart: v.optional(v.boolean(), true),
});

export type CreateCampaign = v.InferInput<typeof CreateCampaignSchema>;

export const CampaignQueueItemSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  campaignId: v.pipe(v.number(), v.integer()),
  emailId: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  recipientEmail: v.pipe(v.string(), v.email()),
  recipientName: v.optional(v.nullable(v.string())),
  renderedSubject: v.string(),
  renderedBody: v.string(),
  status: v.enum(QUEUE_ITEM_STATUS),
  errorMessage: v.optional(v.nullable(v.string())),
  retryCount: v.number(),
  sentAt: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  createdAt: v.union([v.date(), v.string()]),
});

export type CampaignQueueItem = v.InferOutput<typeof CampaignQueueItemSchema>;

export type CampaignWithRelations = Campaign & {
  listName?: string;
  senderEmail?: string;
  senderName?: string;
  pitchProfileName?: string;
};
