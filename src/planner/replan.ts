/**
 * Step 5 — re-planning.
 *
 * Re-planning is just running the planner again; it's cheap enough to do on
 * every change. The work here is deciding what to *keep*.
 *
 * Clock times are never kept: they always show the live schedule (v3 §8). What
 * is kept is the *structure* — the order of the evening and which day each
 * chunk is on. If the only thing that changed is the clock, and it has drifted
 * less than 15 minutes from the plan, the old structure stays and is simply
 * re-timed. A schedule that reshuffles itself over five minutes is one nobody
 * trusts. A change the student made (new work, a dread tap) always re-plans.
 *
 * The moves that do happen are returned rather than applied silently, because
 * naming the tradeoff is the product: "That ran 20 minutes over. I moved
 * History to tomorrow — it's not due until Monday."
 */

import { addDays, daysBetween, planDateOf } from '../lib/planDate';
import type { BalancedDay } from './balance';
import { REPLAN_MIN_SHIFT_MINUTES } from './constants';
import { dayLiveOf, plan } from './plan';
import { scheduleDay, type HeldSegment } from './schedule';
import { chunkKey } from './types';
import type {
  Assignment,
  CompletedChunk,
  DayLive,
  History,
  Plan,
  Prefs,
  RunningChunk,
  ScheduledChunk,
} from './types';

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

const chunksOf = (p: Plan) => p.days.flatMap((day) => day.chunks);

/** Which chunks exist and how long they are — everything but where they sit. */
const contents = (chunks: ScheduledChunk[]) =>
  chunks
    .map((c) => `${chunkKey(c)}=${c.plannedMinutes}`)
    .sort()
    .join(',');

/** Where each chunk sits: its day and its place in that day. */
const structure = (p: Plan) =>
  p.days.map((day) => `${day.planDate}:${day.chunks.map(chunkKey).join(',')}`).join('|');

/** Consecutive runs of one segment, as the scheduler's held order. */
function heldOf(chunks: ScheduledChunk[]): HeldSegment[] {
  const held: HeldSegment[] = [];
  for (const chunk of chunks) {
    const last = held[held.length - 1];
    if (last && last.kind === chunk.segment) last.keys.push(chunkKey(chunk));
    else held.push({ kind: chunk.segment, keys: [chunkKey(chunk)] });
  }
  return held;
}

/** The previous plan's structure, re-timed to now — or null if it shouldn't be kept. */
function keepStructure(
  current: Plan,
  fresh: Plan,
  prefs: Prefs,
  now: Date,
  live: DayLive,
): Plan | null {
  // Finishing or starting a chunk changes the contents, so the plan being
  // held is always one made from the same completions as this one.
  const kept = current;

  if (contents(chunksOf(kept)) !== contents(chunksOf(fresh))) return null; // the student changed something
  if (structure(kept) === structure(fresh)) return null; // nothing to protect

  // How far the clock has drifted from the plan the student was looking at.
  const today = planDateOf(now, prefs.dayCutoffHour);
  const was = kept.days.find((d) => d.planDate === today)?.chunks[0];
  const is = fresh.days.find((d) => d.planDate === today)?.chunks[0];
  if (!was || !is) return null;
  const drift = Math.abs(is.scheduledStart.getTime() - was.scheduledStart.getTime()) / 60_000;
  if (drift >= REPLAN_MIN_SHIFT_MINUTES) return null;

  const days = kept.days.map((day) => {
    const balanced: BalancedDay = {
      planDate: day.planDate,
      chunks: day.chunks.map((c) => ({
        ...c,
        pinned: daysBetween(today, addDays(planDateOf(c.dueAt, prefs.dayCutoffHour), -1)) <= 0,
      })),
      loadMinutes: day.loadMinutes,
      targetMinutes: day.targetMinutes,
      overTargetReason: day.overTargetReason,
    };
    return scheduleDay(balanced, prefs, now, live, heldOf(day.chunks)).day;
  });
  return { ...fresh, days, deferrals: current.deferrals };
}

export function replan(
  current: Plan,
  assignments: Assignment[],
  prefs: Prefs,
  history: History,
  now: Date = new Date(),
  completed: CompletedChunk[] = [],
  running: RunningChunk | null = null,
): Replan {
  const fresh = plan(assignments, prefs, history, now, completed, running);
  const live = dayLiveOf(completed, running, now, prefs);
  const next = keepStructure(current, fresh, prefs, now, live) ?? fresh;

  const previous = new Map(chunksOf(current).map((c) => [chunkKey(c), c]));
  const moves: Move[] = [];
  for (const chunk of chunksOf(next)) {
    const before = previous.get(chunkKey(chunk));
    if (!before) continue; // new work, nothing to report
    const changedDay = before.planDate !== chunk.planDate;
    const shift =
      Math.abs(chunk.scheduledStart.getTime() - before.scheduledStart.getTime()) / 60_000;
    if (!changedDay && shift < REPLAN_MIN_SHIFT_MINUTES) continue;
    moves.push({
      chunk,
      fromPlanDate: before.planDate,
      toPlanDate: chunk.planDate,
      fromStart: before.scheduledStart,
      toStart: chunk.scheduledStart,
      changedDay,
    });
  }

  return { plan: next, moves };
}
