import * as v from "valibot";

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
