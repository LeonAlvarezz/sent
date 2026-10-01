import * as v from "valibot";

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
  siteName: v.optional(v.string()),
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
  preferredProvider: v.optional(
    v.union([v.literal("openai"), v.literal("anthropic")]),
    "openai",
  ),
  defaultDelayMinSeconds: v.optional(v.number(), 15),
  defaultDelayMaxSeconds: v.optional(v.number(), 45),
});

export type OutreachSettings = v.InferOutput<typeof OutreachSettingsSchema>;
