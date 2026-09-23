/**
 * The planner.
 *
 * plan() runs the steps from docs/chunk-algorithm-spec.md in order — resolve
 * what's missing, split into chunks, spread across the days before each
 * deadline, balance the days — then lays each day on the clock with the
 * engine v2 rules (docs/scheduling-engine-v2.md). Work that doesn't fit before
 * bedtime rolls to the next day, and the move is reported.
 *
 * Pure and cheap — run it on the client whenever a chunk finishes, is skipped,
 * or an assignment is added. Use replan() rather than plan() when a schedule
 * already exists, so the student's day doesn't rearrange itself under them.
 */

import { balance, targetFor, type BalancedDay, type PlacedChunk } from './balance';
import { addDays, daysBetween, planDateOf } from '../lib/planDate';
import { firstActionFor } from './mode';
import { resolve } from './resolve';
import { scheduleDay } from './schedule';
import { split } from './split';
import { spread } from './spread';
import { triage } from './triage';
import type { Assignment, DayPlan, Deferral, History, Plan, Prefs, UrgentTriage } from './types';

export function plan(
  assignments: Assignment[],
  prefs: Prefs,
  history: History,
  now: Date = new Date(),
): Plan {
  const { kept, atRisk } = triage(assignments, prefs, history, now);
  const today = planDateOf(now, prefs.dayCutoffHour);

  const placed: PlacedChunk[] = [];
  for (const assignment of kept) {
    const chunks = split(assignment, prefs, history);
    const dueDay = planDateOf(assignment.dueAt, prefs.dayCutoffHour);
    const { difficulty } = resolve(assignment, history);

    for (const chunk of spread(assignment, chunks, prefs, now)) {
      placed.push({
        ...chunk,
        classId: assignment.classId,
        dueAt: assignment.dueAt,
        mode: assignment.mode,
        difficulty,
        firstAction: firstActionFor(assignment.mode, assignment.firstAction),
        // Pinned only when there is genuinely nowhere else to put it: the
        // last allowed day (the day before it's due) is today or already past.
        // A chunk that merely happens to sit on today can still be moved.
        pinned: daysBetween(today, addDays(dueDay, -1)) <= 0,
      });
    }
  }

  // Lay days on the clock in order, rolling anything past the bedtime cutoff
  // onto the next day, which may not have existed until now.
  const pending = new Map(balance(placed, prefs, now).map((day) => [day.planDate, day]));
  const days: DayPlan[] = [];
  const deferrals: Deferral[] = [];
  let urgentTriage: UrgentTriage | null = null;
  let needsSubmitOrder: string[] = [];

  while (pending.size > 0) {
    const planDate = [...pending.keys()].sort()[0];
    const day = pending.get(planDate) as BalancedDay;
    pending.delete(planDate);

    const result = scheduleDay(day, prefs, now);
    if (result.day.chunks.length > 0) days.push(result.day);
    if (planDate === today) {
      urgentTriage = result.urgentTriage;
      needsSubmitOrder = result.needsSubmitOrder;
    }

    if (result.deferred.length > 0) {
      const next = addDays(planDate, 1);
      const moved = result.deferred.map((chunk) => ({
        ...chunk,
        planDate: next,
      }));
      const existing = pending.get(next);
      const chunks = [...(existing?.chunks ?? []), ...moved];
      pending.set(next, {
        planDate: next,
        chunks,
        loadMinutes: chunks.reduce((t, c) => t + c.plannedMinutes, 0),
        targetMinutes: existing?.targetMinutes ?? targetFor(next, prefs),
        overTargetReason: existing?.overTargetReason ?? null,
      });
      for (const id of new Set(result.deferred.map((c) => c.assignmentId))) {
        const chunk = result.deferred.find((c) => c.assignmentId === id) as PlacedChunk;
        deferrals.push({
          assignmentId: id,
          fromPlanDate: planDate,
          toPlanDate: next,
          dueAt: chunk.dueAt,
        });
      }
    }
  }

  return { days, atRisk, deferrals, urgentTriage, needsSubmitOrder };
}
