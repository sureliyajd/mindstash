/**
 * Parse a date string from the backend as UTC.
 *
 * The backend stores timezone-naive UTC datetimes and serializes them
 * without a 'Z' suffix. Without correction, `new Date(str)` treats
 * them as local time, causing the displayed time to be wrong for
 * users outside UTC.
 */
export function parseUTCDate(dateStr: string | null | undefined): Date | null {
  if (!dateStr) return null;
  // Already has timezone info — use as-is
  if (dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr)) {
    return new Date(dateStr);
  }
  return new Date(dateStr + 'Z');
}
