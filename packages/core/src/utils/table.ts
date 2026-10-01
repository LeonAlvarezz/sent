export interface AutoColumnSizeOptions {
  /** Minimum column width in pixels (default: 80) */
  min?: number;
  /** Maximum column width in pixels (default: 400) */
  max?: number;
  /** Approximate pixel width per character (default: 8) */
  charWidth?: number;
  /** Total horizontal padding to add (cell padding, badges, icons) (default: 48) */
  padding?: number;
  /** Optional header title to ensure column is at least wide enough for header */
  header?: string;
}

/**
 * Calculates a dynamic column size based on the longest string value in the dataset.
 * Prevents magic numbers and guessing while preserving fixed table column stability.
 */
export function getAutoColumnSize<T>(
  data: T[] | undefined | null,
  accessor: (item: T) => unknown,
  options?: AutoColumnSizeOptions,
): number {
  const {
    min = 80,
    max = 400,
    charWidth = 8,
    padding = 48,
    header,
  } = options ?? {};

  let maxChars = header ? header.length : 0;

  if (Array.isArray(data) && data.length > 0) {
    for (const item of data) {
      if (!item) continue;
      const rawVal = accessor(item);
      if (rawVal != null) {
        const len = String(rawVal).length;
        if (len > maxChars) maxChars = len;
      }
    }
  }

  const calculated = Math.round(maxChars * charWidth + padding);
  return Math.min(max, Math.max(min, calculated));
}
