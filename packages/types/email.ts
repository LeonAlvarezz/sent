import * as v from "valibot";
import { PaginationMetaSchema, PaginationPropsSchema } from "./common";

export enum EMAIL_STATUS {
  ACTIVE = "active",
  REPLIED = "replied",
  UNSUBSCRIBED = "unsubscribed",
  BOUNCED = "bounced",
}

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
    }),
  ),
});

export type ImportEmailsPayload = v.InferOutput<
  typeof ImportEmailsPayloadSchema
>;

export const ListEmailsQuerySchema = v.object({
  ...PaginationPropsSchema.entries,
  listId: v.optional(v.number()),
  search: v.optional(v.string()),
  title: v.optional(v.string()),
  limit: v.optional(v.number()),
  offset: v.optional(v.number()),
});

export type ListEmailsQuery = v.InferOutput<typeof ListEmailsQuerySchema>;

export const EmailsListResponseSchema = v.object({
  emails: v.array(EmailSchema),
  meta: PaginationMetaSchema,
});

export type EmailsListResponse = v.InferOutput<typeof EmailsListResponseSchema>;
