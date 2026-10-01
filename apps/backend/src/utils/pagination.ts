import type { PaginationMeta, PaginationProps } from "@z3/types";

export function getMeta(
  filter: PaginationProps,
  total_count: number,
): PaginationMeta {
  return {
    total_count,
    page: filter.page,
    page_size: filter.page_size,
    page_count: Math.ceil(total_count / filter.page_size),
  };
}
