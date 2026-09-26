import type { Color } from "@z3/admin-core";
import type { EMAIL_STATUS, SEO_PARTNER_STATUS } from "@z3/types";

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
};
