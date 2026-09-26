import * as v from "valibot";

export enum EMAIL_STATUS {
  ACTIVE = "active",
  REPLIED = "replied",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
}

export enum OUTREACH_STATUS {
  SENT = "sent",
  DELIVERED = "delivered",
  REPLIED = "replied",
  BOUNCED = "bounced",
}

export enum FOLLOW_UP_ACTION {
  ALERT = "alert",
  AUTO_SEND = "auto_send",
}

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

// SENDER IDENTITY
export const SenderIdentitySchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  name: v.string(),
  email: v.pipe(v.string(), v.email()),
  host: v.string(),
  port: v.pipe(v.number(), v.integer()),
  secure: v.boolean(),
  username: v.string(),
  isDefault: v.boolean(),
  createdAt: v.union([v.date(), v.string()]),
  updatedAt: v.union([v.date(), v.string()]),
});

export type SenderIdentity = v.InferOutput<typeof SenderIdentitySchema>;

export const CreateSenderIdentitySchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  email: v.pipe(v.string(), v.email("Valid email is required")),
  host: v.pipe(v.string(), v.minLength(1, "SMTP host is required")),
  port: v.pipe(v.number(), v.integer()),
  secure: v.optional(v.boolean(), false),
  username: v.pipe(v.string(), v.minLength(1, "Username is required")),
  password: v.pipe(v.string(), v.minLength(1, "Password is required")),
  isDefault: v.optional(v.boolean(), false),
});

export type CreateSenderIdentity = v.InferInput<typeof CreateSenderIdentitySchema>;

export const UpdateSenderIdentitySchema = v.partial(CreateSenderIdentitySchema);
export type UpdateSenderIdentity = v.InferOutput<typeof UpdateSenderIdentitySchema>;

// PITCH PROFILE
export const PitchProfileSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  name: v.string(),
  targetUrl: v.optional(v.nullable(v.string())),
  valueProposition: v.string(),
  toneInstructions: v.optional(v.nullable(v.string())),
  examples: v.optional(v.nullable(v.string())),
  createdAt: v.union([v.date(), v.string()]),
  updatedAt: v.union([v.date(), v.string()]),
});

export type PitchProfile = v.InferOutput<typeof PitchProfileSchema>;

export const CreatePitchProfileSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  targetUrl: v.optional(v.nullable(v.string())),
  valueProposition: v.pipe(v.string(), v.minLength(1, "Value proposition is required")),
  toneInstructions: v.optional(v.nullable(v.string())),
  examples: v.optional(v.nullable(v.string())),
});

export type CreatePitchProfile = v.InferInput<typeof CreatePitchProfileSchema>;
export const UpdatePitchProfileSchema = v.partial(CreatePitchProfileSchema);
export type UpdatePitchProfile = v.InferInput<typeof UpdatePitchProfileSchema>;

// EMAIL LIST
export const EmailListSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  name: v.string(),
  description: v.optional(v.nullable(v.string())),
  emailCount: v.optional(v.number(), 0),
  createdAt: v.union([v.date(), v.string()]),
  updatedAt: v.union([v.date(), v.string()]),
});

export type EmailList = v.InferOutput<typeof EmailListSchema>;

export const CreateEmailListSchema = v.object({
  name: v.pipe(v.string(), v.minLength(1, "Name is required")),
  description: v.optional(v.nullable(v.string())),
});

export type CreateEmailList = v.InferInput<typeof CreateEmailListSchema>;
export const UpdateEmailListSchema = v.partial(CreateEmailListSchema);
export type UpdateEmailList = v.InferInput<typeof UpdateEmailListSchema>;

// EMAIL
export const EmailSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  listId: v.optional(v.nullable(v.number())),
  email: v.pipe(v.string(), v.email()),
  firstName: v.optional(v.nullable(v.string())),
  lastName: v.optional(v.nullable(v.string())),
  domainUrl: v.optional(v.nullable(v.string())),
  title: v.optional(v.nullable(v.string())),
  personLinkedin: v.optional(v.nullable(v.string())),
  companyName: v.optional(v.nullable(v.string())),
  country: v.optional(v.nullable(v.string())),
  type: v.optional(v.nullable(v.string())),
  companyLinkedin: v.optional(v.nullable(v.string())),
  status: v.enum(EMAIL_STATUS),
  attributes: v.record(v.string(), v.any()),
  createdAt: v.union([v.date(), v.string()]),
  updatedAt: v.union([v.date(), v.string()]),
});

export type Email = v.InferOutput<typeof EmailSchema>;

export const CreateEmailSchema = v.object({
  listId: v.optional(v.nullable(v.number())),
  email: v.pipe(v.string(), v.email("Valid email is required")),
  firstName: v.optional(v.nullable(v.string())),
  lastName: v.optional(v.nullable(v.string())),
  domainUrl: v.optional(v.nullable(v.string())),
  title: v.optional(v.nullable(v.string())),
  personLinkedin: v.optional(v.nullable(v.string())),
  companyName: v.optional(v.nullable(v.string())),
  country: v.optional(v.nullable(v.string())),
  type: v.optional(v.nullable(v.string())),
  companyLinkedin: v.optional(v.nullable(v.string())),
  status: v.optional(v.enum(EMAIL_STATUS), EMAIL_STATUS.ACTIVE),
  attributes: v.optional(v.record(v.string(), v.any()), {}),
});

export type CreateEmail = v.InferInput<typeof CreateEmailSchema>;
export const UpdateEmailSchema = v.partial(CreateEmailSchema);
export type UpdateEmail = v.InferInput<typeof UpdateEmailSchema>;

export const ImportEmailsPayloadSchema = v.object({
  listId: v.optional(v.nullable(v.number())),
  emails: v.array(
    v.object({
      email: v.pipe(v.string(), v.email()),
      firstName: v.optional(v.nullable(v.string())),
      lastName: v.optional(v.nullable(v.string())),
      domainUrl: v.optional(v.nullable(v.string())),
      title: v.optional(v.nullable(v.string())),
      personLinkedin: v.optional(v.nullable(v.string())),
      companyName: v.optional(v.nullable(v.string())),
      country: v.optional(v.nullable(v.string())),
      type: v.optional(v.nullable(v.string())),
      companyLinkedin: v.optional(v.nullable(v.string())),
      attributes: v.optional(v.record(v.string(), v.any()), {}),
    })
  ),
});

export type ImportEmailsPayload = v.InferOutput<typeof ImportEmailsPayloadSchema>;

// OUTREACH LOG
export const OutreachLogSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  emailId: v.optional(v.nullable(v.number())),
  senderId: v.pipe(v.number(), v.integer()),
  pitchProfileId: v.optional(v.nullable(v.number())),
  recipientEmail: v.pipe(v.string(), v.email()),
  subject: v.string(),
  body: v.string(),
  status: v.enum(OUTREACH_STATUS),
  followUpDate: v.optional(v.nullable(v.string())),
  followUpAction: v.optional(v.nullable(v.enum(FOLLOW_UP_ACTION))),
  sentAt: v.union([v.date(), v.string()]),
  createdAt: v.union([v.date(), v.string()]),
});

export type OutreachLog = v.InferOutput<typeof OutreachLogSchema>;

// COPILOT / QUICK OUTREACH ACTIONS
export const ScrapeUrlSchema = v.object({
  url: v.pipe(v.string(), v.minLength(1, "URL is required")),
});

export type ScrapeUrl = v.InferOutput<typeof ScrapeUrlSchema>;

export const ScrapeResultSchema = v.object({
  url: v.string(),
  title: v.string(),
  siteName: v.optional(v.string()),
  description: v.string(),
  h1: v.string(),
  textSnippet: v.string(),
  candidateEmails: v.array(v.string()),
});

export type ScrapeResult = v.InferOutput<typeof ScrapeResultSchema>;

export const GenerateDraftSchema = v.object({
  targetUrl: v.optional(v.string()),
  pageContext: v.optional(v.string()),
  recipientName: v.optional(v.string()),
  recipientEmail: v.optional(v.string()),
  pitchProfileId: v.optional(v.nullable(v.number())),
  customAngle: v.optional(v.string()),
  toneModifier: v.optional(v.string()),
});

export type GenerateDraft = v.InferOutput<typeof GenerateDraftSchema>;

export const GeneratedDraftSchema = v.object({
  subject: v.string(),
  body: v.string(),
  isFallback: v.boolean(),
  fallbackReason: v.optional(v.string()),
});

export type GeneratedDraft = v.InferOutput<typeof GeneratedDraftSchema>;

export const DispatchOutreachSchema = v.object({
  senderId: v.pipe(v.number(), v.integer()),
  recipientEmail: v.pipe(v.string(), v.email("Valid email required")),
  recipientName: v.optional(v.string()),
  listId: v.optional(v.nullable(v.number())),
  subject: v.pipe(v.string(), v.minLength(1, "Subject is required")),
  body: v.pipe(v.string(), v.minLength(1, "Body is required")),
  pitchProfileId: v.optional(v.nullable(v.number())),
  followUpDate: v.optional(v.nullable(v.string())),
  followUpAction: v.optional(v.nullable(v.enum(FOLLOW_UP_ACTION))),
});

export type DispatchOutreach = v.InferOutput<typeof DispatchOutreachSchema>;

// AI & SETTINGS
export const OutreachSettingsSchema = v.object({
  openaiApiKey: v.optional(v.string()),
  anthropicApiKey: v.optional(v.string()),
  preferredProvider: v.optional(v.union([v.literal("openai"), v.literal("anthropic")]), "openai"),
  defaultDelayMinSeconds: v.optional(v.number(), 15),
  defaultDelayMaxSeconds: v.optional(v.number(), 45),
});

export type OutreachSettings = v.InferOutput<typeof OutreachSettingsSchema>;

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
