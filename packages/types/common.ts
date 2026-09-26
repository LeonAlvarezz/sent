import * as v from "valibot";
export type SortOrder = "asc" | "desc";

export const NumberIdSchema = v.object({
  id: v.pipe(v.number(), v.integer()),
});

export const CursorPropsSchema = v.object({
  id: v.union([v.string(), v.number()]),
  created_at: v.pipe(v.string(), v.isoTimestamp()),
});

export const CursorPaginationQuerySchema = v.object({
  cursor: v.optional(v.nullable(v.string())),
  limit: v.optional(
    v.pipe(
      v.unknown(),
      v.transform((val) => (val ? Number(val) : 20)),
      v.number(),
      v.integer(),
      v.minValue(1),
      v.maxValue(100),
    ),
    20,
  ),
  order: v.optional(v.union([v.literal("asc"), v.literal("desc")]), "desc"),
});

export const CursorMetaPropsSchema = v.object({
  ...v.partial(CursorPropsSchema).entries,
  total: v.number(),
  limit: v.optional(
    v.pipe(
      v.unknown(),
      v.transform((val) => (val != null ? Number(val) : 10)),
      v.number(),
    ),
    10,
  ),
});

export const CursorMetaSchema = v.object({
  next_cursor: v.optional(v.nullable(v.string())),
  has_more: v.boolean(),
  limit: v.optional(
    v.pipe(
      v.unknown(),
      v.transform((val) => (val != null ? Number(val) : 10)),
      v.number(),
    ),
    10,
  ),
});

export type CursorMeta = v.InferOutput<typeof CursorMetaSchema>;

export type CursorMetaProps = v.InferOutput<typeof CursorMetaPropsSchema>;

export type BaseCursorPaginationQuery = v.InferOutput<
  typeof CursorPaginationQuerySchema
>;
export type CursorProps = v.InferOutput<typeof CursorPropsSchema>;
export type CursorPaginationQuery<TFilter = unknown> =
  BaseCursorPaginationQuery & TFilter;

/**
 * Wraps a Valibot object schema in a safe search validator that never crashes.
 * If invalid search query parameters are provided (e.g. typos like order=dessc),
 * invalid keys are automatically stripped while preserving valid ones and falling
 * back to schema defaults.
 */
export function safeValidateSearch<T>(
  schema: v.BaseSchema<unknown, T, v.BaseIssue<unknown>>,
  fallback?: Partial<T>,
) {
  return (rawSearch: Record<string, unknown>): T => {
    const result = v.safeParse(schema, rawSearch);
    if (result.success) {
      return result.output;
    }

    // Try sanitizing: set invalid keys identified in issues to undefined
    const sanitized: Record<string, unknown> = { ...rawSearch };
    for (const issue of result.issues) {
      if (issue.path && issue.path.length > 0) {
        const key = issue.path[0].key;
        if (typeof key === "string" || typeof key === "number") {
          sanitized[key] = undefined;
        }
      }
    }

    const reResult = v.safeParse(schema, sanitized);
    if (reResult.success) {
      const output = { ...(reResult.output as Record<string, unknown>) };
      for (const key of Object.keys(rawSearch)) {
        if (!(key in output)) {
          output[key] = undefined;
        }
      }
      return output as T;
    }

    // If still failing, parse empty object or fallback
    const emptyResult = v.safeParse(schema, fallback ?? {});
    if (emptyResult.success) {
      const output = { ...(emptyResult.output as Record<string, unknown>) };
      for (const key of Object.keys(rawSearch)) {
        if (!(key in output)) {
          output[key] = undefined;
        }
      }
      return output as T;
    }

    return (fallback ?? {}) as T;
  };
}
