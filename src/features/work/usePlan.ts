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
import type { AbandonedChunk } from '../../planner/learning';
import { learn } from '../../planner/learning';
import { toPlannerAssignments, useWork, type Completion, type WorkAssignment } from './store';

/** A chunk plus whether it is finished — the shape every screen wants. */
export type PlannedChunk = ScheduledChunk & {
  key: string;
  done: boolean;
  /** On the timer right now. */
  running: boolean;
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

/**
 * What the student's history says (v3 §9, §10): median task minutes per mode
 * fills missing estimates now; the learned chunk length and dread factor are
 * computed but only used once LEARNING_ENABLED is on.
 */
function historyFrom(
  completions: Completion[],
  abandoned: AbandonedChunk[],
  assignments: WorkAssignment[],
): History {
  const byMode = new Map<Mode, number[]>();
  // Only finished tasks count; a half-done one would drag the median down.
  for (const task of assignments) {
    const mine = completions.filter((c) => c.assignmentId === task.id);
    if (mine.length === 0) continue;
    const planned = mine.reduce((t, c) => t + c.plannedMinutes, 0);
    if (task.minutes != null && planned < task.minutes) continue;
    const actual = mine.reduce((t, c) => t + c.actualMinutes, 0);
    byMode.set(task.mode, [...(byMode.get(task.mode) ?? []), actual]);
  }
  const learned = learn(completions, abandoned);

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
    learnedChunkMinutes: learned.chunkMinutes,
    learnedDreadedFirstFactor: learned.dreadedFirstFactor,
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
  const abandoned = useWork((state) => state.abandoned);
  const active = useWork((state) => state.active);
  const draft = useDraft();
  const now = useMinuteClock();

  const todayKey = planDateOf(now);

  // What the planner needs besides the clock. Changes only when the student
  // does something.
  const inputs = useMemo(
    () => ({
      assignments: toPlannerAssignments(assignments),
      prefs: prefsFrom(draft),
      history: historyFrom(completions, abandoned, assignments),
      completions,
      active,
    }),
    [assignments, completions, abandoned, active, draft],
  );

  // The plan as it stood when the student last changed something. The
  // structure hold measures drift against this, so drift accumulates: a
  // chained "previous plan" would be re-timed every minute and never drift.
  const [baseline, setBaseline] = useState(() => ({ inputs, plannedAt: now }));
  if (baseline.inputs !== inputs) setBaseline({ inputs, plannedAt: now });
  const basePlan = useMemo(() => {
    const b = baseline.inputs;
    return plan(b.assignments, b.prefs, b.history, baseline.plannedAt, b.completions, b.active);
  }, [baseline]);

  return useMemo(() => {
    const { plan: result } = replan(
      basePlan,
      inputs.assignments,
      inputs.prefs,
      inputs.history,
      now,
      inputs.completions,
      inputs.active,
    );

    // Finished chunks sit where they really happened, keyed by their own record.
    const doneChunks: PlannedChunk[] = result.done.map((chunk) => ({
      ...chunk,
      planDate: planDateOf(chunk.completion.endedAt),
      scheduledStart: chunk.completion.startedAt,
      scheduledEnd: chunk.completion.endedAt,
      pauseAt: null,
      segment: chunk.mode,
      key: chunk.completion.id,
      done: true,
      running: false,
      actualMinutes: chunk.completion.actualMinutes,
    }));
    const runningKey = active
      ? chunkKey({
          assignmentId: active.assignmentId,
          index: completions.filter((c) => c.assignmentId === active.assignmentId).length + 1,
        })
      : null;
    const all: PlannedChunk[] = [
      ...doneChunks,
      ...result.days.flatMap((day) =>
        day.chunks.map((chunk) => ({
          ...chunk,
          key: chunkKey(chunk),
          done: false,
          running: chunkKey(chunk) === runningKey,
          actualMinutes: null,
        })),
      ),
    ].sort((a, b) => a.scheduledStart.getTime() - b.scheduledStart.getTime());

    const today = all.filter((chunk) => chunk.planDate === todayKey);
    const todayPlan = result.days.find((day) => day.planDate === todayKey);
    const doneToday = today.filter((chunk) => chunk.done).length;

    const focusedToday = completions
      .filter((entry) => planDateOf(entry.endedAt) === todayKey)
      .reduce((total, entry) => total + entry.actualMinutes, 0);

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
  }, [basePlan, inputs, completions, active, todayKey, now]);
}
