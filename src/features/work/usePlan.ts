/**
 * The plan the app renders.
 *
 * One place where the pure planner meets the two stores, so no screen calls
 * `plan()` itself and no screen decides what "today" means. Everything below
 * is derived — nothing is stored twice.
 *
 * The planner takes `now` as an argument and never reads the clock, so this
 * passes one in. That also means the result is only as fresh as the render;
 * a session that runs past midnight re-derives on the next navigation, which
 * is the same behaviour the 03:00 cutoff already implies.
 */

import { useMemo } from 'react';

import { plan } from '../../planner';
import {
  DEFAULT_WEEKDAY_FACTORS,
  MIN_SAMPLES_FOR_MEDIAN,
  WEEKDAY_FACTORS,
} from '../../planner/constants';
import type {
  Break,
  DayPlan,
  Deferral,
  History,
  Prefs,
  ScheduledChunk,
  UrgentTriage,
  WeekdayFactors,
} from '../../planner/types';
import { DAY_CUTOFF_HOUR, planDateOf } from '../../lib/planDate';
import { BEST_TIMES, useDraft } from '../onboarding/draft';
import { toPlannerAssignments, useWork, type Completion } from './store';

/** A chunk plus whether it is finished — the shape every screen wants. */
export type PlannedChunk = ScheduledChunk & {
  key: string;
  done: boolean;
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
  /** Engine v2 outputs. TODO(design): none of these has a frame yet. */
  breaksToday: Break[];
  bedtimeOverrunToday: DayPlan['bedtimeOverrun'];
  deferrals: Deferral[];
  urgentTriage: UrgentTriage | null;
  needsSubmitOrder: string[];
};

const chunkKey = (chunk: { assignmentId: string; index: number }) =>
  `${chunk.assignmentId}:${chunk.index}`;

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

/** Median completed minutes per class, once there are enough to trust. */
function historyFrom(completions: Completion[], classOf: Map<string, string | null>): History {
  const byClass = new Map<string | null, number[]>();
  for (const entry of completions) {
    const className = classOf.get(entry.assignmentId) ?? null;
    const list = byClass.get(className) ?? [];
    list.push(entry.minutes);
    byClass.set(className, list);
  }

  return {
    medianMinutes(classId) {
      const list = byClass.get(classId);
      if (!list || list.length < MIN_SAMPLES_FOR_MEDIAN) return null;
      const sorted = [...list].sort((a, b) => a - b);
      const middle = Math.floor(sorted.length / 2);
      return sorted.length % 2 === 0
        ? Math.round((sorted[middle - 1] + sorted[middle]) / 2)
        : sorted[middle];
    },
  };
}

export function usePlan(now: Date = new Date()): PlanView {
  const assignments = useWork((state) => state.assignments);
  const completions = useWork((state) => state.completions);
  const draft = useDraft();

  // `now` is a new Date on every render, so the memo keys on the plan day
  // rather than the instant. Re-deriving once a day is the point; re-deriving
  // sixty times a second is not.
  const todayKey = planDateOf(now);

  return useMemo(() => {
    const classOf = new Map(assignments.map((entry) => [entry.id, entry.className]));
    const finished = new Set(completions.map((entry) => entry.chunkKey));

    const result = plan(
      toPlannerAssignments(assignments),
      prefsFrom(draft),
      historyFrom(completions, classOf),
      now,
    );

    const all: PlannedChunk[] = result.days.flatMap((day) =>
      day.chunks.map((chunk) => ({
        ...chunk,
        key: chunkKey(chunk),
        done: finished.has(chunkKey(chunk)),
      })),
    );

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
      breaksToday: todayPlan?.breaks ?? [],
      bedtimeOverrunToday: todayPlan?.bedtimeOverrun ?? null,
      deferrals: result.deferrals,
      urgentTriage: result.urgentTriage,
      needsSubmitOrder: result.needsSubmitOrder,
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [assignments, completions, draft, todayKey]);
}
