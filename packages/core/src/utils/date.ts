export function dateToISOString(date: Date) {
  return date instanceof Date
    ? date.toISOString()
    : new Date(date).toISOString();
}
