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
import { chunkKey } from './types';
import type {
  DoneChunk,
  Assignment,
  DayPlan,
  Deferral,
  History,
  Plan,
  Prefs,
  UrgentTriage,
} from './types';

export function plan(
  assignments: Assignment[],
  prefs: Prefs,
  history: History,
  now: Date = new Date(),
  /** Keys (chunkKey) of chunks already finished. They take no time tonight. */
  done: ReadonlySet<string> = new Set(),
): Plan {
  const today = planDateOf(now, prefs.dayCutoffHour);

  const placed: PlacedChunk[] = [];
  const finished: DoneChunk[] = [];
  const remainingMinutes = new Map<string, number>();
  for (const assignment of assignments) {
    const chunks = split(assignment, prefs, history);
    const dueDay = planDateOf(assignment.dueAt, prefs.dayCutoffHour);
    const { dread } = resolve(assignment, history);
    const extra = {
      classId: assignment.classId,
      dueAt: assignment.dueAt,
      mode: assignment.mode,
      dread,
      firstAction: firstActionFor(assignment.mode, assignment.firstAction),
    };

    // Chunk identity comes from the full split, so finishing one never
    // renumbers the rest. Only what's left gets a day and a time.
    const left = chunks.filter((chunk) => !done.has(chunkKey(chunk)));
    for (const chunk of chunks)
      if (done.has(chunkKey(chunk))) finished.push({ ...chunk, ...extra });
    remainingMinutes.set(
      assignment.id,
      left.reduce((t, c) => t + c.plannedMinutes, 0),
    );

    for (const chunk of spread(assignment, left, prefs, now)) {
      placed.push({
        ...chunk,
        classId: assignment.classId,
        dueAt: assignment.dueAt,
        mode: assignment.mode,
        dread,
        firstAction: firstActionFor(assignment.mode, assignment.firstAction),
        // Pinned only when there is genuinely nowhere else to put it: the
        // last allowed day (the day before it's due) is today or already past.
        // A chunk that merely happens to sit on today can still be moved.
        pinned: daysBetween(today, addDays(dueDay, -1)) <= 0,
      });
    }
  }

  // Triage names what is at risk, but nothing leaves the plan until the
  // student decides: dropping it here would make it silently vanish.
  const { atRisk: sized } = triage(
    assignments.map((a) => ({ ...a, minutes: remainingMinutes.get(a.id) ?? 0 })),
    prefs,
    history,
    now,
  );
  const atRisk = assignments.filter((a) => sized.some((s) => s.id === a.id));

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

  return { days, atRisk, deferrals, urgentTriage, needsSubmitOrder, done: finished };
}
