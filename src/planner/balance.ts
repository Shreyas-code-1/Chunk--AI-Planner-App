/**
 * Step 4 — level the load across days.
 *
 * Spreading each assignment on its own can still pile up: four assignments each
 * putting a chunk on Thursday makes Thursday awful. So move work off the heavy
 * days, most-slack first.
 */

import { addDays, daysBetween, planDateOf, weekdayOf, type PlanDate } from '../lib/planDate';
import type { DayAssignedChunk } from './spread';
import type { Difficulty, Mode, Prefs, SplitChunk } from './types';

/** A chunk that knows its deadline, which is what decides what may move. */
export type PlacedChunk = DayAssignedChunk & {
  classId: string | null;
  dueAt: Date;
  /** Due today or tomorrow: pinned, because there is nowhere else to put it. */
  pinned: boolean;
  mode: Mode;
  difficulty: Difficulty;
  /** Already resolved: the student's own line, or the mode's default. */
  firstAction: string;
};

export type BalancedDay = {
  planDate: PlanDate;
  chunks: PlacedChunk[];
  loadMinutes: number;
  targetMinutes: number;
  overTargetReason: string | null;
};

const load = (chunks: PlacedChunk[]): number =>
  chunks.reduce((total, chunk) => total + chunk.plannedMinutes, 0);

/** This day's ceiling: the daily target scaled by its weekday factor (2.6b). */
export function targetFor(planDate: PlanDate, prefs: Prefs): number {
  const factor = prefs.weekdayFactors[weekdayOf(planDate)] ?? 1;
  return Math.round(prefs.dailyTargetMinutes * factor);
}

function groupByDay(chunks: PlacedChunk[], prefs: Prefs): Map<PlanDate, PlacedChunk[]> {
  const days = new Map<PlanDate, PlacedChunk[]>();
  for (const chunk of chunks) {
    const bucket = days.get(chunk.planDate);
    if (bucket) bucket.push(chunk);
    else days.set(chunk.planDate, [chunk]);
  }
  // Days the student has no work on simply don't exist here, which is what
  // makes them invisible to the streak.
  return new Map([...days.entries()].sort(([a], [b]) => (a < b ? -1 : 1)));
}

/**
 * Explain an overloaded day in the student's terms.
 *
 * A day over target after balancing is allowed — deadlines force it — but the
 * screen has to say why. Silence makes the plan feel arbitrary.
 */
function explainOverload(chunks: PlacedChunk[], prefs: Prefs): string {
  const soonest = chunks.reduce((a, b) => (a.dueAt <= b.dueAt ? a : b));
  const dueDay = planDateOf(soonest.dueAt, prefs.dayCutoffHour);
  const distinctDeadlines = new Set(chunks.map((c) => planDateOf(c.dueAt, prefs.dayCutoffHour)));
  return distinctDeadlines.size > 1
    ? `${distinctDeadlines.size} things are due soon, the first on ${dueDay}`
    : `everything here is due ${dueDay}`;
}

export function balance(placed: PlacedChunk[], prefs: Prefs, now: Date): BalancedDay[] {
  const days = groupByDay(placed, prefs);
  const today = planDateOf(now, prefs.dayCutoffHour);

  const loadOf = (day: PlanDate) => load(days.get(day) ?? []);

  for (const [day, chunks] of days) {
    let guard = chunks.length; // each chunk may move at most once per pass
    while (loadOf(day) > targetFor(day, prefs) && guard-- > 0) {
      const movable = (days.get(day) ?? []).filter((c) => !c.pinned);
      if (movable.length === 0) break;

      // Most slack first: the chunk whose deadline is furthest away.
      const chunk = movable.reduce((a, b) => (a.dueAt >= b.dueAt ? a : b));
      const target = lightestDayFor(chunk, days, prefs, today);
      if (!target || loadOf(target) >= loadOf(day)) break; // nowhere better

      days.set(day, (days.get(day) ?? []).filter((c) => c !== chunk));
      days.set(target, [...(days.get(target) ?? []), { ...chunk, planDate: target }]);
    }
  }

  return [...days.entries()]
    .filter(([, chunks]) => chunks.length > 0)
    .map(([planDate, chunks]) => {
      const loadMinutes = load(chunks);
      const targetMinutes = targetFor(planDate, prefs);
      return {
        planDate,
        chunks,
        loadMinutes,
        targetMinutes,
        overTargetReason:
          loadMinutes > targetMinutes ? explainOverload(chunks, prefs) : null,
      };
    });
}

/**
 * The lightest day this chunk could move to: on or after today, and always
 * before its own due date — the day-early rule survives balancing.
 */
function lightestDayFor(
  chunk: PlacedChunk,
  days: Map<PlanDate, PlacedChunk[]>,
  prefs: Prefs,
  today: PlanDate,
): PlanDate | null {
  const lastAllowed = addDays(planDateOf(chunk.dueAt, prefs.dayCutoffHour), -1);

  const candidates: PlanDate[] = [];
  for (let day = today; daysBetween(day, lastAllowed) >= 0; day = addDays(day, 1)) {
    if (day !== chunk.planDate) candidates.push(day);
  }
  if (candidates.length === 0) return null;

  // Compare against each day's own ceiling, so a "light" Sunday with a 1.3
  // factor really is the roomier choice.
  return candidates.reduce((best, day) =>
    load(days.get(day) ?? []) - targetFor(day, prefs) <
    load(days.get(best) ?? []) - targetFor(best, prefs)
      ? day
      : best,
  );
}

/** Re-export so callers can build PlacedChunks without importing three modules. */
export type { SplitChunk };
