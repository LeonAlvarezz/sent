/**
 * Converts a string into a URL-friendly slug.
 */
export function slugify(text: string): string {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, "-") // Replace spaces with -
    .replace(/&/g, "-and-") // Replace & with 'and'
    .replace(/[^\w-]+/g, "") // Remove all non-word chars
    .replace(/--+/g, "-"); // Replace multiple - with single -
}

/**
 * Capitalizes the first letter of a string.
 */
export function capitalize(text: string): string {
  if (!text) return "";
  return text.charAt(0).toUpperCase() + text.slice(1);
}

/**
 * Truncates a string to a given max length, appending a suffix if truncated.
 */
export function truncate(text: string, maxLength: number, suffix = "..."): string {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength).trimEnd() + suffix;
}

/**
 * Counts the number of words in a string based on whitespace delimiters.
 */
export function countWords(text: string): number {
  if (!text || typeof text !== "string") return 0;
  const trimmed = text.trim();
  if (!trimmed) return 0;
  const matches = trimmed.match(/\S+/g);
  return matches ? matches.length : 0;
}

/**
 * Trims a string down to a maximum word count, removing words beyond the limit.
 */
export function trimToWordCount(text: string, maxWords: number): string {
  if (!text || typeof text !== "string" || maxWords <= 0) return "";
  const matches = Array.from(text.matchAll(/\S+/g));
  if (matches.length <= maxWords) return text;
  const lastAllowedMatch = matches[maxWords - 1];
  const cutIndex = lastAllowedMatch.index + lastAllowedMatch[0].length;
  return text.slice(0, cutIndex);
}

