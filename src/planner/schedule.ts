/**
 * Lay each day's chunks onto the clock.
 */

import { BREAK_MINUTES, CHUNKS_BETWEEN_BREAKS } from './constants';
import { planDateOf, startOfPlanDay, type PlanDate } from '../lib/planDate';
import type { BalancedDay, PlacedChunk } from './balance';
import type { DayPlan, Prefs, ScheduledChunk } from './types';

/**
 * Interleave classes without disturbing deadline order.
 *
 * Three Biology chunks back to back makes the evening feel like one long slog,
 * and interleaving different material beats blocking one subject. But urgency
 * outranks variety: chunks are grouped into deadline tiers first, and the
 * shuffling only ever happens inside a tier, so nothing overtakes something due
 * sooner.
 */
function interleaveClasses(chunks: PlacedChunk[]): PlacedChunk[] {
  const tiers = new Map<number, PlacedChunk[]>();
  for (const chunk of chunks) {
    const key = chunk.dueAt.getTime();
    const tier = tiers.get(key);
    if (tier) tier.push(chunk);
    else tiers.set(key, [chunk]);
  }

  const out: PlacedChunk[] = [];
  for (const key of [...tiers.keys()].sort((a, b) => a - b)) {
    out.push(...roundRobinByClass(tiers.get(key) ?? []));
  }
  return out;
}

/** Deal one chunk from each class in turn, shortest class queue first. */
function roundRobinByClass(chunks: PlacedChunk[]): PlacedChunk[] {
  const queues = new Map<string, PlacedChunk[]>();
  for (const chunk of chunks) {
    const key = chunk.classId ?? '(none)';
    const queue = queues.get(key);
    if (queue) queue.push(chunk);
    else queues.set(key, [chunk]);
  }
  // Within a class, shortest first — an early completion is worth more than an
  // early start on something long.
  for (const queue of queues.values()) {
    queue.sort((a, b) => a.plannedMinutes - b.plannedMinutes);
  }

  const out: PlacedChunk[] = [];
  const order = [...queues.keys()];
  let placed = 0;
  while (placed < chunks.length) {
    for (const key of order) {
      const next = queues.get(key)?.shift();
      if (next) {
        out.push(next);
        placed++;
      }
    }
  }
  return out;
}

/**
 * The minute of the day this plan day starts from.
 *
 * Today starts from now if the student is already past their usual start time —
 * a plan that schedules work for an hour that has passed is worse than useless.
 */
function firstSlotMinutes(planDate: PlanDate, prefs: Prefs, now: Date): number {
  if (planDate !== planDateOf(now, prefs.dayCutoffHour)) return prefs.availableStart;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  return Math.max(prefs.availableStart, nowMinutes);
}

export function scheduleDay(day: BalancedDay, prefs: Prefs, now: Date): DayPlan {
  const ordered = interleaveClasses(day.chunks);
  const dayStart = startOfPlanDay(day.planDate).getTime();

  let slot = firstSlotMinutes(day.planDate, prefs, now);
  let sinceBreak = 0;

  const chunks: ScheduledChunk[] = ordered.map((chunk) => {
    if (sinceBreak >= CHUNKS_BETWEEN_BREAKS) {
      slot += BREAK_MINUTES;
      sinceBreak = 0;
    }
    const scheduledStart = new Date(dayStart + slot * 60_000);
    slot += chunk.plannedMinutes;
    sinceBreak++;

    return {
      assignmentId: chunk.assignmentId,
      index: chunk.index,
      title: chunk.title,
      plannedMinutes: chunk.plannedMinutes,
      planDate: chunk.planDate,
      classId: chunk.classId,
      dueAt: chunk.dueAt,
      scheduledStart,
    };
  });

  return {
    planDate: day.planDate,
    chunks,
    loadMinutes: day.loadMinutes,
    targetMinutes: day.targetMinutes,
    overTargetReason: day.overTargetReason,
  };
}
