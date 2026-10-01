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
  PAUSE_OVER_MINUTES,
} from './constants';
import { addDays, daysBetween, planDateOf, startOfPlanDay, type PlanDate } from '../lib/planDate';
import type { BalancedDay, PlacedChunk } from './balance';
import { chunkKey } from './types';
import type {
  Break,
  DayPlan,
  FinishedToday,
  DayLive,
  Mode,
  Prefs,
  ScheduledChunk,
  UrgentTriage,
} from './types';

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

/** Minutes from the plan day's midnight; after-midnight times run past 1440. */
function minutesInto(planDate: PlanDate, date: Date): number {
  return (date.getTime() - startOfPlanDay(planDate).getTime()) / 60_000;
}

/**
 * Today starts from now if the usual start time has already passed — or if
 * the student has already been working today: someone mid-session at 2 PM
 * isn't told to wait until their usual 4 PM.
 */
function firstSlotMinutes(
  planDate: PlanDate,
  prefs: Prefs,
  now: Date,
  workedToday: boolean,
): number {
  if (planDate !== planDateOf(now, prefs.dayCutoffHour)) return prefs.availableStart;
  const nowMinutes = Math.floor(minutesInto(planDate, now));
  return workedToday ? nowMinutes : Math.max(prefs.availableStart, nowMinutes);
}

/** Where the evening already stands: work since the last breaks, and the last chunk's end. */
type Seam = {
  sinceBreak: number;
  sinceLong: number;
  lastEnd: number | null;
  lastMode: Mode | null;
  /** A running chunk can't be delayed by a break; the seam only resets counters. */
  anchored: boolean;
  /** The running chunk ends at the later of its planned end and this. */
  activeEnd: number | null;
};

const FRESH: Seam = {
  sinceBreak: 0,
  sinceLong: 0,
  lastEnd: null,
  lastMode: null,
  anchored: false,
  activeEnd: null,
};

/** Read today's finished chunks back to the last real break (v3 §6, §8). */
function seamOf(planDate: PlanDate, finished: FinishedToday[], before: number): Seam {
  const done = finished
    .map((f) => ({ end: minutesInto(planDate, f.endedAt), minutes: f.minutes, mode: f.mode }))
    .filter((f) => f.end <= before)
    .sort((a, b) => a.end - b.end);
  if (done.length === 0) return FRESH;

  const last = done[done.length - 1];
  const seam = { ...FRESH, lastEnd: last.end, lastMode: last.mode };
  let short = true;
  let long = true;
  for (let i = done.length - 1; i >= 0 && (short || long); i--) {
    if (short) seam.sinceBreak += done[i].minutes;
    if (long) seam.sinceLong += done[i].minutes;
    const gap = i > 0 ? done[i].end - done[i].minutes - done[i - 1].end : Infinity;
    short = short && gap < SHORT_BREAK_MINUTES;
    long = long && gap < LONG_BREAK_MINUTES;
  }
  return seam;
}

type Layout = {
  chunks: { chunk: PlacedChunk; slot: number; end: number; segment: Segment['kind'] }[];
  breaks: { slot: number; minutes: number }[];
  end: number;
};

function layout(segments: Segment[], start: number, seam: Seam = FRESH): Layout {
  const out: Layout = { chunks: [], breaks: [], end: start };
  const all = segments.flatMap((s) => s.chunks.map((chunk, i) => ({ chunk, segment: s, i })));

  let slot = start;
  let { sinceBreak, sinceLong } = seam;

  // The break owed after what was already finished today. If the student has
  // already taken that long, nothing is owed.
  if (seam.lastEnd != null && all.length > 0) {
    const gap = start - seam.lastEnd;
    let owed = 0;
    if (sinceLong >= LONG_BREAK_AFTER - BREAK_SNAP_MINUTES) owed = LONG_BREAK_MINUTES;
    else if (
      all[0].chunk.mode !== seam.lastMode ||
      sinceBreak >= IN_BATCH_BREAK_EVERY - BREAK_SNAP_MINUTES
    )
      owed = SHORT_BREAK_MINUTES;

    if (!seam.anchored && gap < owed) {
      out.breaks.push({ slot: seam.lastEnd, minutes: owed });
      slot = seam.lastEnd + owed;
      sinceBreak = 0;
      if (owed === LONG_BREAK_MINUTES) sinceLong = 0;
    } else {
      if (gap >= SHORT_BREAK_MINUTES) sinceBreak = 0;
      if (gap >= LONG_BREAK_MINUTES) sinceLong = 0;
    }
  }

  all.forEach(({ chunk, segment, i }, n) => {
    const planned = slot + chunk.plannedMinutes;
    // A running chunk that overruns pushes everything after it (v3 §8).
    const end = n === 0 && seam.activeEnd != null ? Math.max(planned, seam.activeEnd) : planned;
    out.chunks.push({ chunk, slot, end, segment: segment.kind });
    sinceBreak += end - slot;
    sinceLong += end - slot;
    slot = end;
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

/** A day's order from an earlier plan, kept by the re-plan structure hold. */
export type HeldSegment = { kind: Segment['kind']; keys: string[] };

export function scheduleDay(
  day: BalancedDay,
  prefs: Prefs,
  now: Date,
  live: DayLive = {},
  held: HeldSegment[] | null = null,
): DayResult {
  const isToday = day.planDate === planDateOf(now, prefs.dayCutoffHour);
  const running = isToday ? (live.active ?? null) : null;
  const active = running
    ? (day.chunks.find(
        (c) => c.assignmentId === running.assignmentId && c.index === running.index,
      ) ?? null)
    : null;

  const start =
    running && active
      ? minutesInto(day.planDate, running.startedAt)
      : firstSlotMinutes(day.planDate, prefs, now, (live.finishedToday ?? []).length > 0);
  const seam: Seam = isToday
    ? {
        ...seamOf(day.planDate, live.finishedToday ?? [], start),
        anchored: active != null,
        activeEnd: active ? minutesInto(day.planDate, now) : null,
      }
    : FRESH;

  const bedtime = bedtimeOf(prefs);
  const cutoff = bedtime - BEDTIME_MARGIN_MINUTES;

  let chunks = [...day.chunks];
  const anyDueToday = chunks.some((c) => isDueToday(c, day.planDate, prefs));
  // 15% of the evening, which is the smaller of the day's target and the
  // bedtime window. Work within the target is never deferred for it (v3 Q12).
  const evening = Math.min(day.targetMinutes, Math.max(0, cutoff - start));
  const buffer = anyDueToday ? 0 : Math.round(evening * BUFFER_FRACTION);
  const limit = anyDueToday || sum(chunks) <= day.targetMinutes ? cutoff : cutoff - buffer;

  const fromHeld = (list: PlacedChunk[]): Segment[] | null => {
    if (!held) return null;
    const byKey = new Map(list.map((c) => [chunkKey(c), c]));
    const segments = held.map((h) => ({
      kind: h.kind,
      chunks: h.keys.map((k) => byKey.get(k)).filter((c): c is PlacedChunk => c != null),
    }));
    const count = segments.reduce((t, seg) => t + seg.chunks.length, 0);
    return count === list.length ? segments.filter((seg) => seg.chunks.length > 0) : null;
  };

  // The running chunk goes first whatever the rules say: it has started. It
  // leads its own segment, so it keeps that segment's breaks.
  const arrange = (list: PlacedChunk[]): Segment[] => {
    const base = fromHeld(list) ?? orderDay(list, day.planDate, prefs);
    const home = active ? base.find((seg) => seg.chunks.includes(active)) : undefined;
    if (!active || !home) return base;
    const lead = { ...home, chunks: [active, ...home.chunks.filter((c) => c !== active)] };
    return [lead, ...base.filter((seg) => seg !== home)];
  };
  // A held structure never moves work off the day or suggests letting it go.
  const holding = fromHeld(chunks) != null;

  let segments = arrange(chunks);
  let result = layout(segments, start, seam);

  // 1. Defer movable work, latest deadline first. Work due tomorrow goes
  // last of all: it breaks the day-early rule and lands on its due day, which
  // beats pushing tonight past bedtime. Only work due today may bend bedtime.
  const deferred: PlacedChunk[] = [];
  while (!holding && result.end > limit) {
    const free = chunks.filter((c) => c !== active && !mustBeTonight(c, day.planDate, prefs));
    const movable =
      free.length > 0
        ? free
        : chunks.filter((c) => c !== active && !isDueToday(c, day.planDate, prefs));
    if (movable.length === 0) break;
    const latest = movable.reduce((a, b) =>
      b.dueAt > a.dueAt || (b.dueAt.getTime() === a.dueAt.getTime() && b.index > a.index) ? b : a,
    );
    chunks = chunks.filter((c) => c !== latest);
    deferred.push(latest);
    segments = arrange(chunks);
    result = layout(segments, start, seam);
  }

  // 2. Must-do-tonight work that still doesn't fit: suggest letting the
  // largest go. The suggestion is reported; the work stays on the plan, last,
  // until the student answers — it never silently disappears.
  let urgentTriage: UrgentTriage | null = null;
  const hardLimit = bedtime + BEDTIME_BEND_MAX_MINUTES;
  if (!holding && result.end > hardLimit) {
    const needMinutes = sum(chunks);
    const everything = chunks;
    const letGo: string[] = [];
    const keep = (c: PlacedChunk) => c === active || !letGo.includes(c.assignmentId);
    while (result.end > hardLimit && chunks.some((c) => c !== active)) {
      const perTask = new Map<string, number>();
      for (const c of chunks)
        if (c !== active)
          perTask.set(c.assignmentId, (perTask.get(c.assignmentId) ?? 0) + c.plannedMinutes);
      const [largest] = [...perTask.entries()].reduce((a, b) => (b[1] > a[1] ? b : a));
      letGo.push(largest);
      chunks = everything.filter(keep);
      segments = arrange(chunks);
      result = layout(segments, start, seam);
    }
    // Only the running chunk is left (e.g. a late-night session): there is
    // nothing to suggest letting go, so there is no triage to report.
    if (letGo.length > 0) {
      urgentTriage = {
        planDate: day.planDate,
        needMinutes,
        haveMinutes: Math.max(0, bedtime - start),
        letGo,
      };

      const suggested = everything.filter((c) => !keep(c)).sort(byAssignmentThenIndex);
      chunks = everything;
      segments = [
        ...arrange(everything.filter(keep)),
        {
          kind: isDueToday(suggested[0], day.planDate, prefs) ? 'dueToday' : suggested[0].mode,
          chunks: suggested,
        },
      ];
      result = layout(segments, start, seam);
    }
  }

  const dayStart = startOfPlanDay(day.planDate).getTime();
  const at = (slot: number) => new Date(dayStart + slot * 60_000);

  const scheduled: ScheduledChunk[] = result.chunks.map(({ chunk, slot, end, segment }) => ({
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
    scheduledEnd: at(end),
    pauseAt: chunk.plannedMinutes > PAUSE_OVER_MINUTES ? at(slot + chunk.plannedMinutes / 2) : null,
  }));

  const breaks: Break[] = result.breaks.map((b) => ({
    start: at(b.slot),
    end: at(b.slot + b.minutes),
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

  // The buffer never carries "done at" past the cutoff; only the work itself can.
  const finish = Math.max(result.end, Math.min(result.end + buffer, cutoff));

  const loadMinutes = sum(chunks);
  return {
    day: {
      planDate: day.planDate,
      chunks: scheduled,
      loadMinutes,
      targetMinutes: day.targetMinutes,
      overTargetReason: loadMinutes > day.targetMinutes ? day.overTargetReason : null,
      breaks,
      workEnd: at(result.end),
      bufferMinutes: finish - result.end,
      finishAt: at(finish),
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
