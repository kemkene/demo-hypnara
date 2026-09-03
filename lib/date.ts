/**
 * Utility functions for timezone handling (Asia/Ho_Chi_Minh - UTC+7)
 * and deterministic calendar arithmetic.
 */

export const VIETNAM_TIMEZONE = 'Asia/Ho_Chi_Minh';

/**
 * Returns today's date string in YYYY-MM-DD format in Vietnam timezone (UTC+7).
 */
export function todayStr(tz: string = VIETNAM_TIMEZONE): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: tz }).format(new Date());
}

/**
 * Pure calendar arithmetic to add or subtract days from a YYYY-MM-DD string.
 * Uses UTC internally to avoid daylight saving or local timezone shift anomalies.
 */
export function addDays(dateStr: string, days: number): string {
  const parts = dateStr.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) {
    throw new Error(`Invalid date string for addDays: ${dateStr}`);
  }
  const [y, m, d] = parts;
  const date = new Date(Date.UTC(y, m - 1, d));
  date.setUTCDate(date.getUTCDate() + days);
  return date.toISOString().slice(0, 10);
}

/**
 * Returns yesterday's date string in YYYY-MM-DD format in Vietnam timezone.
 */
export function yesterdayStr(tz: string = VIETNAM_TIMEZONE): string {
  return addDays(todayStr(tz), -1);
}

/**
 * Validates whether a date string is formatted as YYYY-MM-DD and is not in the future.
 */
export function isValidDateStr(s: any, maxDateStr: string = todayStr()): boolean {
  if (typeof s !== 'string') return false;
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  
  // Verify date validity (e.g. not 2026-02-31)
  const [y, m, d] = s.split('-').map(Number);
  const date = new Date(Date.UTC(y, m - 1, d));
  if (
    date.getUTCFullYear() !== y ||
    date.getUTCMonth() !== m - 1 ||
    date.getUTCDate() !== d
  ) {
    return false;
  }

  return s <= maxDateStr;
}

/**
 * Calculates continuous habit streak from a set of recorded dates.
 * If today is logged, streak starts from today and counts backwards.
 * If today is not yet logged, streak starts from yesterday and counts backwards.
 * Stops at the first missing consecutive day.
 */
export function calculateStreak(dates: Set<string>, today: string = todayStr()): number {
  if (dates.size === 0) return 0;

  let streak = 0;
  let checkStr = today;

  if (!dates.has(checkStr)) {
    checkStr = addDays(checkStr, -1);
  }

  while (dates.has(checkStr)) {
    streak++;
    checkStr = addDays(checkStr, -1);
  }

  return streak;
}
