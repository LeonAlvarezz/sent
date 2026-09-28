import * as v from "valibot";

export enum SEO_PARTNER_STATUS {
  NOT_STARTED = "not_started",
  OUTREACHED = "outreached",
  OVERBUDGET = "overbudget",
  IN_PROGRESS = "in_progress",
  ACCEPTED = "accepted",
  REJECTED = "rejected",
  DO_NOT_CONTACT = "do_not_contact",
}

export const SeoPartnerSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
  userId: v.string(),
  website: v.string(),
  url: v.string(),
  contactEmail: v.optional(v.nullable(v.pipe(v.string(), v.email()))),
  dr: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  backlinks: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  backlinkFor: v.optional(v.nullable(v.string())),
  outreachStatus: v.enum(SEO_PARTNER_STATUS),
  outreachDate: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  followUpDate: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  quotedPrice: v.optional(v.nullable(v.string())),
  notes: v.optional(v.nullable(v.string())),
  attributes: v.record(v.string(), v.any()),
  createdAt: v.union([v.date(), v.string()]),
  updatedAt: v.union([v.date(), v.string()]),
});

export type SeoPartner = v.InferOutput<typeof SeoPartnerSchema>;

export const CreateSeoPartnerSchema = v.object({
  website: v.pipe(v.string(), v.minLength(1, "Website name is required")),
  url: v.pipe(v.string(), v.minLength(1, "URL is required")),
  contactEmail: v.optional(v.nullable(v.union([v.pipe(v.string(), v.email()), v.literal("")]))),
  dr: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  backlinks: v.optional(v.nullable(v.pipe(v.number(), v.integer()))),
  backlinkFor: v.optional(v.nullable(v.string())),
  outreachStatus: v.optional(v.enum(SEO_PARTNER_STATUS), SEO_PARTNER_STATUS.NOT_STARTED),
  outreachDate: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  followUpDate: v.optional(v.nullable(v.union([v.date(), v.string()]))),
  quotedPrice: v.optional(v.nullable(v.string())),
  notes: v.optional(v.nullable(v.string())),
  attributes: v.optional(v.record(v.string(), v.any()), {}),
});

export type CreateSeoPartner = v.InferInput<typeof CreateSeoPartnerSchema>;
export const UpdateSeoPartnerSchema = v.partial(CreateSeoPartnerSchema);
export type UpdateSeoPartner = v.InferInput<typeof UpdateSeoPartnerSchema>;

export const ImportSeoPartnersPayloadSchema = v.object({
  partners: v.array(
    v.object({
      website: v.pipe(v.string(), v.minLength(1, "Website name is required")),
      url: v.pipe(v.string(), v.minLength(1, "URL is required")),
      contactEmail: v.optional(v.nullable(v.string())),
      dr: v.optional(v.nullable(v.number())),
      backlinks: v.optional(v.nullable(v.number())),
      backlinkFor: v.optional(v.nullable(v.string())),
      outreachStatus: v.optional(v.enum(SEO_PARTNER_STATUS), SEO_PARTNER_STATUS.NOT_STARTED),
      outreachDate: v.optional(v.nullable(v.union([v.date(), v.string()]))),
      followUpDate: v.optional(v.nullable(v.union([v.date(), v.string()]))),
      quotedPrice: v.optional(v.nullable(v.string())),
      notes: v.optional(v.nullable(v.string())),
      attributes: v.optional(v.record(v.string(), v.any()), {}),
    })
  ),
});

export type ImportSeoPartnersPayload = v.InferInput<typeof ImportSeoPartnersPayloadSchema>;

export const ListSeoPartnersQuerySchema = v.object({
  search: v.optional(v.string()),
  status: v.optional(v.enum(SEO_PARTNER_STATUS)),
  backlinkFor: v.optional(v.string()),
  minDr: v.optional(v.number()),
  maxDr: v.optional(v.number()),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
  sortBy: v.optional(v.union([v.literal("website"), v.literal("dr"), v.literal("backlinks"), v.literal("outreachDate"), v.literal("createdAt")])),
  sortOrder: v.optional(v.union([v.literal("asc"), v.literal("desc")])),
});

export type ListSeoPartnersQuery = v.InferInput<typeof ListSeoPartnersQuerySchema>;
