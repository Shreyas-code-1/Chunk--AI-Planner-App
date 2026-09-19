/**
 * The planner.
 *
 * plan() runs the four steps from docs/chunk-algorithm-spec.md in order:
 * resolve what's missing, split into chunks, spread across the days before each
 * deadline, balance the days, then lay each day on the clock.
 *
 * Pure and cheap — run it on the client whenever a chunk finishes, is skipped,
 * or an assignment is added. Use replan() rather than plan() when a schedule
 * already exists, so the student's day doesn't rearrange itself under them.
 */

import { balance, type PlacedChunk } from './balance';
import { addDays, daysBetween, planDateOf } from '../lib/planDate';
import { scheduleDay } from './schedule';
import { split } from './split';
import { spread } from './spread';
import { triage } from './triage';
import type { Assignment, History, Plan, Prefs } from './types';

export function plan(
  assignments: Assignment[],
  prefs: Prefs,
  history: History,
  now: Date = new Date(),
): Plan {
  const { kept, atRisk } = triage(assignments, prefs, history, now);

  const placed: PlacedChunk[] = [];
  for (const assignment of kept) {
    const chunks = split(assignment, prefs, history);
    const dueDay = planDateOf(assignment.dueAt, prefs.dayCutoffHour);
    const today = planDateOf(now, prefs.dayCutoffHour);

    for (const chunk of spread(assignment, chunks, prefs, now)) {
      placed.push({
        ...chunk,
        classId: assignment.classId,
        dueAt: assignment.dueAt,
        // Pinned only when there is genuinely nowhere else to put it: the
        // last allowed day (the day before it's due) is today or already past.
        // A chunk that merely happens to sit on today can still be moved.
        pinned: daysBetween(today, addDays(dueDay, -1)) <= 0,
      });
    }
  }

  const days = balance(placed, prefs, now).map((day) => scheduleDay(day, prefs, now));
  return { days, atRisk };
}
