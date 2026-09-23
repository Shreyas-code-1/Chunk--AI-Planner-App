/**
 * Step 5 — re-planning.
 *
 * Re-planning is just running the planner again; it's cheap enough to do on
 * every change. The work here is deciding what to *keep*.
 *
 * One rule: if a re-plan would move a chunk by less than 15 minutes, don't. A
 * schedule that rearranges itself constantly is one nobody trusts.
 *
 * The moves that do happen are returned rather than applied silently, because
 * naming the tradeoff is the product: "That ran 20 minutes over. I moved
 * History to tomorrow — it's not due until Monday."
 */

import { REPLAN_MIN_SHIFT_MINUTES } from './constants';
import { plan } from './plan';
import type { Assignment, History, Plan, Prefs, ScheduledChunk } from './types';

export type Move = {
  chunk: ScheduledChunk;
  fromPlanDate: string;
  toPlanDate: string;
  fromStart: Date;
  toStart: Date;
  /** True when the chunk changed day, not just time — the part worth saying aloud. */
  changedDay: boolean;
};

export type Replan = {
  plan: Plan;
  moves: Move[];
};

const keyOf = (chunk: { assignmentId: string; index: number }) =>
  `${chunk.assignmentId}#${chunk.index}`;

function indexByKey(plan: Plan): Map<string, ScheduledChunk> {
  const map = new Map<string, ScheduledChunk>();
  for (const day of plan.days) {
    for (const chunk of day.chunks) map.set(keyOf(chunk), chunk);
  }
  return map;
}

export function replan(
  current: Plan,
  assignments: Assignment[],
  prefs: Prefs,
  history: History,
  now: Date = new Date(),
): Replan {
  const fresh = plan(assignments, prefs, history, now);
  const previous = indexByKey(current);
  const moves: Move[] = [];

  const days = fresh.days.map((day) => ({
    ...day,
    chunks: day.chunks.map((chunk) => {
      const before = previous.get(keyOf(chunk));
      if (!before) return chunk; // new work, nothing to preserve

      const sameDay = before.planDate === chunk.planDate;
      const shiftMinutes =
        Math.abs(chunk.scheduledStart.getTime() - before.scheduledStart.getTime()) / 60_000;

      // Small drift on the same day isn't worth unsettling the plan for.
      if (sameDay && shiftMinutes < REPLAN_MIN_SHIFT_MINUTES) {
        return { ...chunk, scheduledStart: before.scheduledStart };
      }

      moves.push({
        chunk,
        fromPlanDate: before.planDate,
        toPlanDate: chunk.planDate,
        fromStart: before.scheduledStart,
        toStart: chunk.scheduledStart,
        changedDay: !sameDay,
      });
      return chunk;
    }),
  }));

  return { plan: { ...fresh, days }, moves };
}
