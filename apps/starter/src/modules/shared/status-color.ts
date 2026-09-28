import type { Color } from "@z3/admin-core";
import type {
  CAMPAIGN_STATUS,
  EMAIL_STATUS,
  OUTREACH_STATUS,
  SEO_PARTNER_STATUS,
} from "@z3/types";

export const EmailStatusColor: Record<EMAIL_STATUS, Color> = {
  active: "emerald",
  replied: "sky",
  bounced: "rose",
  unsubscribed: "stone",
};

export const SeoPartnerStatusColor: Record<SEO_PARTNER_STATUS, Color> = {
  not_started: "stone",
  outreached: "amber",
  overbudget: "red",
  in_progress: "sky",
  accepted: "emerald",
  rejected: "rose",
  do_not_contact: "zinc",
};

export const CampaignStatusColor: Record<CAMPAIGN_STATUS, Color> = {
  draft: "stone",
  queued: "amber",
  running: "sky",
  paused: "purple",
  completed: "emerald",
  cancelled: "rose",
};

export const OutreachStatusColor: Record<OUTREACH_STATUS, Color> = {
  sent: "sky",
  delivered: "emerald",
  replied: "amber",
  bounced: "rose",
};

