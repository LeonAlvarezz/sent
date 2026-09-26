import { BadRequestException } from "@/lib";
import {
  CursorPaginationQuerySchema,
  CursorPropsSchema,
  type CursorMeta,
  type CursorMetaProps,
  type CursorProps,
} from "@z3/types";
import * as v from "valibot";
export { dateToISOString } from "./date";

export function encodeCursor({ id, created_at }: CursorProps) {
  return btoa(JSON.stringify({ id, created_at }));
}

export function decodeCursor(cursor: string): CursorProps {
  try {
    const decoded = atob(cursor);
    const parsed = JSON.parse(decoded);
    const result = v.safeParse(CursorPropsSchema, parsed);
    if (!result.success) {
      throw new BadRequestException({ message: "Invalid cursor" });
    }
    return result.output;
  } catch {
    throw new BadRequestException({ message: "Invalid cursor" });
  }
}

export function getCursorMeta({
  created_at,
  id,
  limit,
  total,
}: CursorMetaProps): CursorMeta {
  return {
    has_more: total > limit,
    limit,
    next_cursor: id && created_at ? encodeCursor({ id, created_at }) : null,
  };
}

export function processCursorResult<T extends CursorProps, U>(
  data: T[],
  limit: number,
  extra?: U[],
): { data: T[]; meta: CursorMeta; extra?: U[] } {
  const has_more = data.length >= limit;
  const last = data.at(-1);
  return {
    data,
    meta: {
      has_more,
      limit,
      next_cursor:
        has_more && last
          ? encodeCursor({ id: last.id, created_at: last.created_at })
          : null,
    },
    extra: extra,
  };
}
