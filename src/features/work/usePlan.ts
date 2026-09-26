/**
 * The plan the app renders.
 *
 * One place where the pure planner meets the two stores, so no screen calls
 * `plan()` itself and no screen decides what "today" means. Everything below
 * is derived — nothing is stored twice.
 *
 * The planner takes `now` as an argument and never reads the clock, so this
 * keeps a clock that ticks once a minute. Every tick re-plans, so times are
 * live: finish early and everything after moves earlier (v3 §8). The previous
 * plan is kept so `replan` can hold the evening's order steady against small
 * drift — times move, the structure doesn't.
 */

import { useEffect, useMemo, useState } from 'react';

import { plan, replan } from '../../planner';
import { chunkKey } from '../../planner/types';
import {
  DEFAULT_WEEKDAY_FACTORS,
  LEARNING_MIN_SAMPLES,
  WEEKDAY_FACTORS,
} from '../../planner/constants';
import type {
  Break,
  DayPlan,
  Deferral,
  History,
  Mode,
  Prefs,
  ScheduledChunk,
  UrgentTriage,
  WeekdayFactors,
} from '../../planner/types';
import { DAY_CUTOFF_HOUR, planDateOf } from '../../lib/planDate';
import { BEST_TIMES, useDraft } from '../onboarding/draft';
import { toPlannerAssignments, useWork, type Completion, type WorkAssignment } from './store';

/** A chunk plus whether it is finished — the shape every screen wants. */
export type PlannedChunk = ScheduledChunk & {
  key: string;
  done: boolean;
  /** Finished chunks only: how long it really took ("22m (said 25)"). */
  actualMinutes: number | null;
};

export type ClassProgress = {
  className: string;
  total: number;
  done: number;
  /** 0..100, rounded, as the board prints it. */
  percent: number;
};

export type PlanView = {
  /** Every chunk the planner produced, in schedule order. */
  all: PlannedChunk[];
  today: PlannedChunk[];
  days: DayPlan[];
  /** The first unfinished chunk today; what 3.1's UP NEXT card shows. */
  upNext: PlannedChunk | null;
  doneToday: number;
  plannedToday: number;
  /** Minutes actually focused today, from completions, not from the plan. */
  focusedToday: number;
  allTimeChunks: number;
  classes: ClassProgress[];
  atRiskTitles: string[];
  /** Today's "Done at" (v3 §8). Null when nothing is left today. */
  finishAtToday: Date | null;
  /** Engine v2 outputs. TODO(design): none of these has a frame yet. */
  breaksToday: Break[];
  bedtimeOverrunToday: DayPlan['bedtimeOverrun'];
  deferrals: Deferral[];
  urgentTriage: UrgentTriage | null;
  needsSubmitOrder: string[];
};

/**
 * The student's answers as the planner wants them.
 *
 * 2.7 stores a load per weekday starting Monday; the planner indexes by
 * `Date#getDay`, which starts Sunday. The rotation below is that difference
 * and nothing else — getting it wrong silently plans Sunday's work onto
 * Monday.
 */
function prefsFrom(draft: ReturnType<typeof useDraft.getState>): Prefs {
  const start = BEST_TIMES[draft.bestTime]?.minutes ?? BEST_TIMES[2].minutes;
  const weekLoad = draft.weekLoad;

  const factors = (
    weekLoad.length === 7
      ? ([
          WEEKDAY_FACTORS[weekLoad[6]],
          WEEKDAY_FACTORS[weekLoad[0]],
          WEEKDAY_FACTORS[weekLoad[1]],
          WEEKDAY_FACTORS[weekLoad[2]],
          WEEKDAY_FACTORS[weekLoad[3]],
          WEEKDAY_FACTORS[weekLoad[4]],
          WEEKDAY_FACTORS[weekLoad[5]],
        ] as const)
      : DEFAULT_WEEKDAY_FACTORS
  ) as WeekdayFactors;

  return {
    chunkLength: draft.chunkLength,
    availableStart: start,
    // The planner needs a window, and 2.6 only asks when you like to start.
    // The end is that start plus the day's target, floored at the target so a
    // late starter still has somewhere to put the work.
    availableEnd: Math.min(24 * 60, start + Math.max(draft.dailyMinutes, 120) + 120),
    dailyTargetMinutes: draft.dailyMinutes,
    startStyle: draft.startStyle,
    weekdayFactors: factors,
    dayCutoffHour: DAY_CUTOFF_HOUR,
    // TODO(design): onboarding has no bedtime question yet; DEFAULT_BEDTIME applies.
    bedtime: null,
  };
}

/** Median task minutes per mode, once there are enough to trust (v3 §9, §10). */
function historyFrom(completions: Completion[], assignments: WorkAssignment[]): History {
  const perTask = new Map<string, number>();
  for (const entry of completions)
    perTask.set(entry.assignmentId, (perTask.get(entry.assignmentId) ?? 0) + entry.minutes);
  const byMode = new Map<Mode, number[]>();
  // Only finished tasks count; a half-done one would drag the median down.
  for (const task of assignments) {
    const minutes = perTask.get(task.id);
    if (minutes == null || (task.minutes != null && minutes < task.minutes)) continue;
    byMode.set(task.mode, [...(byMode.get(task.mode) ?? []), minutes]);
  }

  return {
    medianTaskMinutes(mode) {
      const list = byMode.get(mode);
      if (!list || list.length < LEARNING_MIN_SAMPLES) return null;
      const sorted = [...list].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
        : sorted[middle];
    },
  };
}

/** The current time, re-rendering once a minute on the minute. */
function useMinuteClock(): Date {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;
    const tick = () => setNow(new Date());
    const align = setTimeout(
      () => {
        tick();
        interval = setInterval(tick, 60_000);
      },
      60_000 - (Date.now() % 60_000),
    );
    return () => {
      clearTimeout(align);
      if (interval) clearInterval(interval);
    };
  }, []);
  return now;
}

export function usePlan(): PlanView {
  const assignments = useWork((state) => state.assignments);
  const completions = useWork((state) => state.completions);
  const draft = useDraft();
  const now = useMinuteClock();

  const todayKey = planDateOf(now);

  // What the planner needs besides the clock. Changes only when the student
  // does something.
  const inputs = useMemo(() => {
    const modeOf = new Map(assignments.map((entry) => [entry.id, entry.mode]));
    const finishedToday = completions
      .filter((entry) => modeOf.has(entry.assignmentId))
      .map((entry) => ({
        endedAt: entry.at,
        minutes: entry.minutes,
        mode: modeOf.get(entry.assignmentId) as Mode,
      }));
    return {
      assignments: toPlannerAssignments(assignments),
      prefs: prefsFrom(draft),
      history: historyFrom(completions, assignments),
      done: new Set(completions.map((entry) => entry.chunkKey)),
      live: { finishedToday },
    };
  }, [assignments, completions, draft]);

  // The plan as it stood when the student last changed something. The
  // structure hold measures drift against this, so drift accumulates: a
  // chained "previous plan" would be re-timed every minute and never drift.
  const [baseline, setBaseline] = useState(() => ({ inputs, plannedAt: now }));
  if (baseline.inputs !== inputs) setBaseline({ inputs, plannedAt: now });
  const basePlan = useMemo(
    () =>
      plan(
        baseline.inputs.assignments,
        baseline.inputs.prefs,
        baseline.inputs.history,
        baseline.plannedAt,
        baseline.inputs.done,
        baseline.inputs.live,
      ),
    [baseline],
  );

  return useMemo(() => {
    const { plan: result } = replan(
      basePlan,
      inputs.assignments,
      inputs.prefs,
      inputs.history,
      now,
      inputs.done,
      inputs.live,
    );

    // Finished chunks sit where they really happened: ended when finished,
    // started their actual length before that.
    const byKey = new Map(completions.map((entry) => [entry.chunkKey, entry]));
    const doneChunks: PlannedChunk[] = result.done.map((chunk) => {
      const entry = byKey.get(chunkKey(chunk));
      const end = entry?.at ?? now;
      const actual = entry?.minutes ?? chunk.plannedMinutes;
      return {
        ...chunk,
        planDate: planDateOf(end),
        scheduledStart: new Date(end.getTime() - actual * 60_000),
        scheduledEnd: end,
        pauseAt: null,
        segment: chunk.mode,
        key: chunkKey(chunk),
        done: true,
        actualMinutes: actual,
      };
    });
    const all: PlannedChunk[] = [
      ...doneChunks,
      ...result.days.flatMap((day) =>
        day.chunks.map((chunk) => ({
          ...chunk,
          key: chunkKey(chunk),
          done: false,
          actualMinutes: null,
        })),
      ),
    ].sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    const today = all.filter((chunk) => chunk.planDate === todayKey);
    const todayPlan = result.days.find((day) => day.planDate === todayKey);
    const doneToday = today.filter((chunk) => chunk.done).length;

    const focusedToday = completions
      .filter((entry) => planDateOf(entry.at) === todayKey)
      .reduce((total, entry) => total + entry.minutes, 0);

    const byClass = new Map<string, { total: number; done: number }>();
    for (const chunk of all) {
      const className = chunk.classId ?? 'Other';
      const row = byClass.get(className) ?? { total: 0, done: 0 };
      row.total += 1;
      if (chunk.done) row.done += 1;
      byClass.set(className, row);
    }

    return {
      all,
      today,
      days: result.days,
      upNext: today.find((chunk) => !chunk.done) ?? null,
      doneToday,
      plannedToday: today.length,
      focusedToday,
      allTimeChunks: completions.length,
      classes: [...byClass.entries()].map(([className, row]) => ({
        className,
        total: row.total,
        done: row.done,
        percent: row.total === 0 ? 0 : Math.round((row.done / row.total) * 100),
      })),
      atRiskTitles: result.atRisk.map((entry) => entry.title),
      finishAtToday: todayPlan?.finishAt ?? null,
      breaksToday: todayPlan?.breaks ?? [],
      bedtimeOverrunToday: todayPlan?.bedtimeOverrun ?? null,
      deferrals: result.deferrals,
      urgentTriage: result.urgentTriage,
      needsSubmitOrder: result.needsSubmitOrder,
    };
  }, [basePlan, inputs, completions, todayKey, now]);
}
