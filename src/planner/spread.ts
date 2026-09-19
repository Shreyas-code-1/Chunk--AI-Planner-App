/**
 * Step 3 — spread one assignment's chunks across the days before it is due.
 *
 * This is the core of the product. Greedy scheduling crams everything into the
 * next few days and leaves the rest empty, which is exactly the feeling the app
 * exists to remove.
 */

import { START_STYLE_WINDOW_DAYS } from './constants';
import { addDays, daysBetween, daysInRange, planDateOf, type PlanDate } from '../lib/planDate';
import type { Assignment, Prefs, SplitChunk } from './types';

export type DayAssignedChunk = SplitChunk & { planDate: PlanDate };

/**
 * The days this assignment may occupy.
 *
 * Two rules shape it:
 *  - Work always lands a day early. Nothing is ever scheduled for the night a
 *    thing is due, so a lost day is a buffer rather than an emergency.
 *  - startStyle narrows the window from the front (screen 2.6c). It can never
 *    widen it past the day-early rule.
 */
export function availableDays(assignment: Assignment, prefs: Prefs, now: Date): PlanDate[] {
  const today = planDateOf(now, prefs.dayCutoffHour);
  const dueDay = planDateOf(assignment.dueAt, prefs.dayCutoffHour);
  const lastDay = addDays(dueDay, -1);

  if (daysBetween(today, lastDay) < 0) return []; // due today or tomorrow

  const window = START_STYLE_WINDOW_DAYS[prefs.startStyle];
  const earliest =
    window === 'all'
      ? today
      : // Start at most `window` days before the due date, but never in the past.
        maxDay(today, addDays(dueDay, -window));

  return daysInRange(earliest, lastDay);
}

function maxDay(a: PlanDate, b: PlanDate): PlanDate {
  return daysBetween(a, b) > 0 ? b : a;
}

/**
 * Distribute chunks across the available days, front-loaded.
 *
 * When they don't divide evenly the extra chunks go on the earlier days, so a
 * 5-chunk assignment over 4 days becomes 2/1/1/1 rather than 1/1/1/2. That
 * builds slack before the deadline instead of after it.
 *
 * When there are no days left — the assignment is due today or tomorrow — every
 * chunk lands today. That is the one case where the plan is allowed to be
 * crowded, and the day-balancer is not permitted to move it.
 */
export function spread(
  assignment: Assignment,
  chunks: SplitChunk[],
  prefs: Prefs,
  now: Date,
): DayAssignedChunk[] {
  const days = availableDays(assignment, prefs, now);

  if (days.length === 0) {
    const today = planDateOf(now, prefs.dayCutoffHour);
    return chunks.map((chunk) => ({ ...chunk, planDate: today }));
  }

  const base = Math.floor(chunks.length / days.length);
  const remainder = chunks.length % days.length;

  const out: DayAssignedChunk[] = [];
  let next = 0;
  days.forEach((planDate, dayIndex) => {
    // The first `remainder` days carry one extra chunk — the front-loading.
    const take = base + (dayIndex < remainder ? 1 : 0);
    for (let i = 0; i < take && next < chunks.length; i++, next++) {
      out.push({ ...chunks[next], planDate });
    }
  });

  return out;
}
