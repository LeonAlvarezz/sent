import * as v from "valibot";

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
