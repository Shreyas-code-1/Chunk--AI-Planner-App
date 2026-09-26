/**
 * Lay one day's chunks onto the clock (engine v3 §5–§6).
 *
 * Order: anything due today first; else one opener; then work due tomorrow,
 * then later work, each tier batched by mode with the most-dreaded task second
 * in its batch. Breaks go at batch boundaries, every ~25 minutes inside a long
 * batch, and a long one after ~90 minutes of work. Nothing runs
 * past bedtime minus the margin: movable work is handed back to be deferred,
 * and must-do-tonight work may bend past bedtime once, with the overrun
 * reported.
 */

import {
  BEDTIME_BEND_MAX_MINUTES,
  BEDTIME_MARGIN_MINUTES,
  BREAK_SNAP_MINUTES,
  BUFFER_FRACTION,
  DEFAULT_BEDTIME,
  DREAD_RANK,
  IN_BATCH_BREAK_EVERY,
  IN_BATCH_BREAK_MIN_BATCH,
  LONG_BREAK_AFTER,
  LONG_BREAK_MINUTES,
  MODE_TIE_ORDER,
  SHORT_BREAK_MINUTES,
  OPENER_MAX_MINUTES,
} from './constants';
import { addDays, daysBetween, planDateOf, startOfPlanDay, type PlanDate } from '../lib/planDate';
import type { BalancedDay, PlacedChunk } from './balance';
import type { Break, DayPlan, Mode, Prefs, ScheduledChunk, UrgentTriage } from './types';

type Segment = { kind: ScheduledChunk['segment']; chunks: PlacedChunk[] };

export type DayResult = {
  day: DayPlan;
  /** Movable chunks that didn't fit before the cutoff, for the next day. */
  deferred: PlacedChunk[];
  urgentTriage: UrgentTriage | null;
  /** Due-today assignments whose deadlines tie. */
  needsSubmitOrder: string[];
};

const sum = (chunks: PlacedChunk[]) => chunks.reduce((t, c) => t + c.plannedMinutes, 0);
const dueDayOf = (chunk: PlacedChunk, prefs: Prefs) => planDateOf(chunk.dueAt, prefs.dayCutoffHour);

/** Due today, or on a day already past. Batching and the opener don't apply. */
function isDueToday(chunk: PlacedChunk, planDate: PlanDate, prefs: Prefs): boolean {
  return daysBetween(planDate, dueDayOf(chunk, prefs)) <= 0;
}

/** Has to be done tonight: the day before it's due is this day or already past. */
function mustBeTonight(chunk: PlacedChunk, planDate: PlanDate, prefs: Prefs): boolean {
  return chunk.pinned || daysBetween(planDate, addDays(dueDayOf(chunk, prefs), -1)) <= 0;
}

/** Keeps an assignment's chunks together and in order. */
function byAssignmentThenIndex(a: PlacedChunk, b: PlacedChunk): number {
  if (a.assignmentId !== b.assignmentId) return a.assignmentId < b.assignmentId ? -1 : 1;
  return a.index - b.index;
}

/** Tasks in a batch, earliest due then shortest (v3 §5f), chunks kept together. */
function tasksInOrder(chunks: PlacedChunk[]): PlacedChunk[][] {
  const tasks = new Map<string, PlacedChunk[]>();
  for (const chunk of [...chunks].sort(byAssignmentThenIndex))
    tasks.set(chunk.assignmentId, [...(tasks.get(chunk.assignmentId) ?? []), chunk]);
  return [...tasks.values()].sort(
    (a, b) =>
      a[0].dueAt.getTime() - b[0].dueAt.getTime() ||
      sum(a) - sum(b) ||
      byAssignmentThenIndex(a[0], b[0]),
  );
}

/**
 * The most-dreaded task goes second: first meets the most resistance, last is
 * what gets dropped when the evening runs long (v3 §5e). Only when dread
 * actually differs within the batch.
 */
function dreadSecond(tasks: PlacedChunk[][]): PlacedChunk[][] {
  if (tasks.length < 2) return tasks;
  const ranks = tasks.map((t) => DREAD_RANK[t[0].dread]);
  const top = Math.max(...ranks);
  if (ranks.every((r) => r === top)) return tasks;
  const most = ranks.indexOf(top);
  const rest = tasks.filter((_, i) => i !== most);
  return [rest[0], tasks[most], ...rest.slice(1)];
}

/** Plan-day tiers: due today (or overdue), due tomorrow, later (v3 §5a–c). */
function tierOf(chunk: PlacedChunk, planDate: PlanDate, prefs: Prefs): 0 | 1 | 2 {
  const days = daysBetween(planDate, dueDayOf(chunk, prefs));
  return days <= 0 ? 0 : days === 1 ? 1 : 2;
}

/**
 * The opener: one first chunk of 20 minutes or less, not dreaded, lowest dread, then
 * shortest, then soonest due (v3 Q5). Only an assignment's first chunk
 * qualifies — it is the one sized as a commitment.
 */
function pickOpener(chunks: PlacedChunk[]): PlacedChunk | null {
  // A dreaded task is never the quick win, however short.
  const candidates = chunks.filter(
    (c) => c.index === 1 && c.plannedMinutes <= OPENER_MAX_MINUTES && c.dread !== 'dreading',
  );
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) =>
      DREAD_RANK[a.dread] - DREAD_RANK[b.dread] ||
      a.plannedMinutes - b.plannedMinutes ||
      a.dueAt.getTime() - b.dueAt.getTime() ||
      byAssignmentThenIndex(a, b),
  )[0];
}

export function orderDay(chunks: PlacedChunk[], planDate: PlanDate, prefs: Prefs): Segment[] {
  const tier = (n: number) => chunks.filter((c) => tierOf(c, planDate, prefs) === n);
  const dueToday = tier(0).sort(
    (a, b) => a.dueAt.getTime() - b.dueAt.getTime() || byAssignmentThenIndex(a, b),
  );

  const segments: Segment[] = [];
  if (dueToday.length > 0) segments.push({ kind: 'dueToday', chunks: dueToday });

  // Exactly one opener, and none at all when something is due today.
  const opener = dueToday.length === 0 ? pickOpener(chunks) : null;
  if (opener) segments.push({ kind: 'opener', chunks: [opener] });

  // Due tomorrow, then later. Batches by mode inside a tier, never across one.
  for (const n of [1, 2]) {
    const batches = new Map<Mode, PlacedChunk[]>();
    for (const chunk of tier(n).filter((c) => c !== opener))
      batches.set(chunk.mode, [...(batches.get(chunk.mode) ?? []), chunk]);

    const soonest = (batch: PlacedChunk[]) => Math.min(...batch.map((c) => c.dueAt.getTime()));
    const ordered = [...batches.entries()].sort(
      ([modeA, a], [modeB, b]) =>
        soonest(a) - soonest(b) || MODE_TIE_ORDER.indexOf(modeA) - MODE_TIE_ORDER.indexOf(modeB),
    );
    for (const [mode, batch] of ordered)
      segments.push({ kind: mode, chunks: dreadSecond(tasksInOrder(batch)).flat() });
  }
  return segments;
}

/** Minutes from the plan day's midnight, before noon read as after midnight. */
function bedtimeOf(prefs: Prefs): number {
  const bedtime = prefs.bedtime ?? DEFAULT_BEDTIME;
  return bedtime < 12 * 60 ? bedtime + 24 * 60 : bedtime;
}

/** Today starts from now if the usual start time has already passed. */
function firstSlotMinutes(planDate: PlanDate, prefs: Prefs, now: Date): number {
  if (planDate !== planDateOf(now, prefs.dayCutoffHour)) return prefs.availableStart;
  const nowMinutes = now.getHours() * 60 + now.getMinutes();
  // After midnight but before the cutoff hour still belongs to the previous plan day.
  const sinceMidnight = now.getHours() < prefs.dayCutoffHour ? nowMinutes + 24 * 60 : nowMinutes;
  return Math.max(prefs.availableStart, sinceMidnight);
}

type Layout = {
  chunks: { chunk: PlacedChunk; slot: number; segment: Segment['kind'] }[];
  breaks: { slot: number; minutes: number }[];
  end: number;
};

function layout(segments: Segment[], start: number): Layout {
  const out: Layout = { chunks: [], breaks: [], end: start };
  const all = segments.flatMap((s) => s.chunks.map((chunk, i) => ({ chunk, segment: s, i })));

  let slot = start;
  let sinceBreak = 0;
  let sinceLong = 0;

  all.forEach(({ chunk, segment, i }, n) => {
    out.chunks.push({ chunk, slot, segment: segment.kind });
    slot += chunk.plannedMinutes;
    sinceBreak += chunk.plannedMinutes;
    sinceLong += chunk.plannedMinutes;
    if (n === all.length - 1) return;

    const lastInSegment = i === segment.chunks.length - 1;
    let minutes = 0;
    if (sinceLong >= LONG_BREAK_AFTER - BREAK_SNAP_MINUTES) {
      minutes = LONG_BREAK_MINUTES;
    } else if (lastInSegment) {
      // No break straight after the opener — it is the run-up, not a block.
      if (segment.kind !== 'opener') minutes = SHORT_BREAK_MINUTES;
    } else if (
      sum(segment.chunks) > IN_BATCH_BREAK_MIN_BATCH &&
      sinceBreak >= IN_BATCH_BREAK_EVERY - BREAK_SNAP_MINUTES
    ) {
      minutes = SHORT_BREAK_MINUTES;
    }

    if (minutes > 0) {
      out.breaks.push({ slot, minutes });
      slot += minutes;
      sinceBreak = 0;
      if (minutes === LONG_BREAK_MINUTES) sinceLong = 0;
    }
  });

  out.end = slot;
  return out;
}

export function scheduleDay(day: BalancedDay, prefs: Prefs, now: Date): DayResult {
  const start = firstSlotMinutes(day.planDate, prefs, now);
  const bedtime = bedtimeOf(prefs);
  const cutoff = bedtime - BEDTIME_MARGIN_MINUTES;

  let chunks = [...day.chunks];
  const anyDueToday = chunks.some((c) => isDueToday(c, day.planDate, prefs));
  // The buffer is spent when something is due today.
  const limit = anyDueToday ? cutoff : start + Math.max(0, cutoff - start) * (1 - BUFFER_FRACTION);

  let segments = orderDay(chunks, day.planDate, prefs);
  let result = layout(segments, start);

  // 1. Defer movable work, latest deadline first. Work due tomorrow goes
  // last of all: it breaks the day-early rule and lands on its due day, which
  // beats pushing tonight past bedtime. Only work due today may bend bedtime.
  const deferred: PlacedChunk[] = [];
  while (result.end > limit) {
    const free = chunks.filter((c) => !mustBeTonight(c, day.planDate, prefs));
    const movable =
      free.length > 0 ? free : chunks.filter((c) => !isDueToday(c, day.planDate, prefs));
    if (movable.length === 0) break;
    const latest = movable.reduce((a, b) =>
      b.dueAt > a.dueAt || (b.dueAt.getTime() === a.dueAt.getTime() && b.index > a.index) ? b : a,
    );
    chunks = chunks.filter((c) => c !== latest);
    deferred.push(latest);
    segments = orderDay(chunks, day.planDate, prefs);
    result = layout(segments, start);
  }

  // 2. Must-do-tonight work that still doesn't fit: suggest letting the
  // largest go. The suggestion is reported; the work stays on the plan, last,
  // until the student answers — it never silently disappears.
  let urgentTriage: UrgentTriage | null = null;
  const hardLimit = bedtime + BEDTIME_BEND_MAX_MINUTES;
  if (result.end > hardLimit) {
    const needMinutes = sum(chunks);
    const everything = chunks;
    const letGo: string[] = [];
    while (result.end > hardLimit && chunks.length > 0) {
      const perTask = new Map<string, number>();
      for (const c of chunks)
        perTask.set(c.assignmentId, (perTask.get(c.assignmentId) ?? 0) + c.plannedMinutes);
      const [largest] = [...perTask.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
      letGo.push(largest);
      chunks = chunks.filter((c) => c.assignmentId !== largest);
      segments = orderDay(chunks, day.planDate, prefs);
      result = layout(segments, start);
    }
    urgentTriage = {
      planDate: day.planDate,
      needMinutes,
      haveMinutes: Math.max(0, bedtime - start),
      letGo,
    };

    const suggested = everything
      .filter((c) => letGo.includes(c.assignmentId))
      .sort(byAssignmentThenIndex);
    chunks = everything;
    segments = [
      ...orderDay(
        everything.filter((c) => !letGo.includes(c.assignmentId)),
        day.planDate,
        prefs,
      ),
      {
        kind: isDueToday(suggested[0], day.planDate, prefs) ? 'dueToday' : suggested[0].mode,
        chunks: suggested,
      },
    ];
    result = layout(segments, start);
  }

  const dayStart = startOfPlanDay(day.planDate).getTime();
  const at = (slot: number) => new Date(dayStart + slot * 60_000);

  const scheduled: ScheduledChunk[] = result.chunks.map(({ chunk, slot, segment }) => ({
    assignmentId: chunk.assignmentId,
    index: chunk.index,
    title: chunk.title,
    plannedMinutes: chunk.plannedMinutes,
    planDate: day.planDate,
    classId: chunk.classId,
    dueAt: chunk.dueAt,
    mode: chunk.mode,
    dread: chunk.dread,
    firstAction: chunk.firstAction,
    segment,
    scheduledStart: at(slot),
  }));

  const breaks: Break[] = result.breaks.map((b) => ({
    start: at(b.slot),
    minutes: b.minutes,
    kind: b.minutes === LONG_BREAK_MINUTES ? 'long' : 'short',
  }));

  const dueTodayTasks = new Map<string, number>();
  for (const c of chunks) {
    if (isDueToday(c, day.planDate, prefs)) dueTodayTasks.set(c.assignmentId, c.dueAt.getTime());
  }
  const needsSubmitOrder = [...dueTodayTasks.entries()]
    .filter(([id, time]) =>
      [...dueTodayTasks.entries()].some(([other, t]) => other !== id && t === time),
    )
    .map(([id]) => id);

  const loadMinutes = sum(chunks);
  return {
    day: {
      planDate: day.planDate,
      chunks: scheduled,
      loadMinutes,
      targetMinutes: day.targetMinutes,
      overTargetReason: loadMinutes > day.targetMinutes ? day.overTargetReason : null,
      breaks,
      bedtimeOverrun:
        result.end > cutoff
          ? {
              minutesPastCutoff: result.end - cutoff,
              minutesPastBedtime: Math.max(0, result.end - bedtime),
            }
          : null,
    },
    deferred,
    urgentTriage,
    needsSubmitOrder,
  };
}
