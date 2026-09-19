/**
 * The plan day.
 *
 * A day in Chunk does not end at midnight. It ends at 03:00 local, so a
 * student still working at 00:30 is on "today" — for the schedule and for the
 * streak alike. Every consumer must agree on this or the scheduler and the
 * streak will disagree about which day a chunk belongs to, which is why the
 * value is computed here, written once at completion, and read everywhere else.
 *
 * Pure: no timezone library, no device APIs. Dates are interpreted in the
 * runtime's local zone, which is the student's own (v1 is single-timezone).
 */

export const DAY_CUTOFF_HOUR = 3;

/** A plan day is identified by its local calendar date, as YYYY-MM-DD. */
export type PlanDate = string;

function pad(n: number): string {
  return n < 10 ? `0${n}` : String(n);
}

/** Format a Date as a local YYYY-MM-DD key, ignoring the clock time. */
export function toDateKey(date: Date): PlanDate {
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`;
}

/** Parse a YYYY-MM-DD key back to local midnight on that date. */
export function fromDateKey(key: PlanDate): Date {
  const [year, month, day] = key.split('-').map(Number);
  return new Date(year, month - 1, day, 0, 0, 0, 0);
}

/**
 * Which plan day an instant belongs to.
 *
 * Anything before the cutoff belongs to the previous calendar date: 00:30 on
 * the 14th is still the 13th's plan day.
 */
export function planDateOf(instant: Date, cutoffHour: number = DAY_CUTOFF_HOUR): PlanDate {
  const shifted = new Date(instant.getTime());
  if (shifted.getHours() < cutoffHour) {
    shifted.setDate(shifted.getDate() - 1);
  }
  return toDateKey(shifted);
}

/** Local midnight on the plan day, the anchor the scheduler lays minutes onto. */
export function startOfPlanDay(key: PlanDate): Date {
  return fromDateKey(key);
}

/** Add whole days to a plan-day key. */
export function addDays(key: PlanDate, days: number): PlanDate {
  const date = fromDateKey(key);
  date.setDate(date.getDate() + days);
  return toDateKey(date);
}

/** Whole plan days from `from` to `to`; negative when `to` is earlier. */
export function daysBetween(from: PlanDate, to: PlanDate): number {
  const ms = fromDateKey(to).getTime() - fromDateKey(from).getTime();
  return Math.round(ms / 86_400_000);
}

/** Every plan day from `from` to `to` inclusive. Empty when `to` precedes `from`. */
export function daysInRange(from: PlanDate, to: PlanDate): PlanDate[] {
  const out: PlanDate[] = [];
  const total = daysBetween(from, to);
  for (let i = 0; i <= total; i++) out.push(addDays(from, i));
  return out;
}

/** Day of week (0 = Sunday) for a plan-day key, for the weekday load factors. */
export function weekdayOf(key: PlanDate): number {
  return fromDateKey(key).getDay();
}
