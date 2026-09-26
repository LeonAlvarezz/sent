export function dateToISOString(date: Date | string): string {
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
}
