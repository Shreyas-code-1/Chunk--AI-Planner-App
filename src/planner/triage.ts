/**
 * When they can't finish everything.
 *
 * The naive response to too much work is to cram. The better move is
 * Moore-Hodgson: when the schedule overruns, drop the *largest* assignment so
 * several smaller ones still land on time. It is provably the largest set
 * finishable by their deadlines.
 *
 * This never drops anything by itself. It produces the list, the student is
 * told, and the student decides. A student will never make that call
 * themselves — that is the feature.
 */

import { targetFor } from './balance';
import { addDays, daysBetween, planDateOf, type PlanDate } from '../lib/planDate';
import { resolve } from './resolve';
import type { Assignment, History, Prefs } from './types';

export type Triage = {
  /** The largest set that can be finished on time. */
  kept: Assignment[];
  /** What has to slip for that to be true. Presented as a question, never done silently. */
  atRisk: Assignment[];
};

/** Study minutes available between now and the day before `dueAt`. */
function availableMinutesBefore(dueAt: Date, prefs: Prefs, now: Date): number {
  const today = planDateOf(now, prefs.dayCutoffHour);
  const lastDay = addDays(planDateOf(dueAt, prefs.dayCutoffHour), -1);

  let total = 0;
  for (let day: PlanDate = today; daysBetween(day, lastDay) >= 0; day = addDays(day, 1)) {
    total += targetFor(day, prefs);
  }
  return total;
}

export function triage(assignments: Assignment[], prefs: Prefs, history: History, now: Date): Triage {
  const sized = assignments.map((assignment) => ({
    assignment,
    minutes: resolve(assignment, history).minutes,
  }));
  sized.sort((a, b) => a.assignment.dueAt.getTime() - b.assignment.dueAt.getTime());

  const kept: typeof sized = [];
  const atRisk: Assignment[] = [];
  let total = 0;

  for (const item of sized) {
    kept.push(item);
    total += item.minutes;

    if (total > availableMinutesBefore(item.assignment.dueAt, prefs, now)) {
      // Drop the biggest thing committed so far, not the one that tipped it.
      const biggest = kept.reduce((a, b) => (a.minutes >= b.minutes ? a : b));
      kept.splice(kept.indexOf(biggest), 1);
      total -= biggest.minutes;
      atRisk.push(biggest.assignment);
    }
  }

  return { kept: kept.map((item) => item.assignment), atRisk };
}
