/**
 * Numbers for 5.1 PROGRESS and 5.2 PROFILE, derived from completions and the
 * plan. Pure, so it can be tested without React.
 *
 * TODO(batch 6): completions are memory-only, so "last week" and the streak
 * only know about this session.
 */

import { addDays, planDateOf, weekdayOf, type PlanDate } from '../../lib/planDate';
import type { Completion, WorkAssignment } from './store';

/** Badge rules. The board names four; the thresholds below are ours. */
export const BADGE_RULES = {
  weekStreakDays: 7,
  onTimeCount: 10,
  /** PROVISIONAL: the board names "Deep work" but not what earns it. */
  deepWorkMinutes: 50,
} as const;

export type Badge = { key: 'first' | 'week' | 'onTime' | 'deep'; label: string; earned: boolean };

export type WeekDay = { planDate: PlanDate; minutes: number; isToday: boolean; isFuture: boolean };

/** Monday of the week containing `today`. */
export function weekStart(today: PlanDate): PlanDate {
  const offset = (weekdayOf(today) + 6) % 7; // getDay is Sunday-first
  return addDays(today, -offset);
}

export function minutesByDay(completions: Completion[]): Map<PlanDate, number> {
  const map = new Map<PlanDate, number>();
  for (const entry of completions) {
    const day = planDateOf(entry.endedAt);
    map.set(day, (map.get(day) ?? 0) + entry.actualMinutes);
  }
  return map;
}

export function week(completions: Completion[], today: PlanDate): WeekDay[] {
  const byDay = minutesByDay(completions);
  const monday = weekStart(today);
  return Array.from({ length: 7 }, (_, i) => {
    const planDate = addDays(monday, i);
    return {
      planDate,
      minutes: byDay.get(planDate) ?? 0,
      isToday: planDate === today,
      isFuture: planDate > today,
    };
  });
}

export function weekTotal(completions: Completion[], monday: PlanDate): number {
  const end = addDays(monday, 7);
  return completions
    .filter((entry) => {
      const day = planDateOf(entry.endedAt);
      return day >= monday && day < end;
    })
    .reduce((total, entry) => total + entry.actualMinutes, 0);
}

/** Focused minutes per class name. */
export function minutesByClass(
  completions: Completion[],
  assignments: WorkAssignment[],
): Map<string, number> {
  const classOf = new Map(assignments.map((a) => [a.id, a.className ?? 'Other']));
  const map = new Map<string, number>();
  for (const entry of completions) {
    const name = classOf.get(entry.assignmentId) ?? 'Other';
    map.set(name, (map.get(name) ?? 0) + entry.actualMinutes);
  }
  return map;
}

/** Assignments whose every chunk was done before the due date. */
export function onTimeCount(
  assignments: WorkAssignment[],
  completions: Completion[],
  chunkCounts: Map<string, number>,
): number {
  return assignments.filter((a) => {
    const total = chunkCounts.get(a.id) ?? 0;
    const done = completions.filter((c) => c.assignmentId === a.id && c.endedAt <= a.dueAt);
    return total > 0 && done.length >= total;
  }).length;
}

export function badges(input: {
  allTimeChunks: number;
  streak: number;
  onTime: number;
  longestMinutes: number;
}): Badge[] {
  return [
    { key: 'first', label: 'First chunk', earned: input.allTimeChunks > 0 },
    { key: 'week', label: 'Week streak', earned: input.streak >= BADGE_RULES.weekStreakDays },
    { key: 'onTime', label: 'On time ×10', earned: input.onTime >= BADGE_RULES.onTimeCount },
    {
      key: 'deep',
      label: 'Deep work',
      earned: input.longestMinutes >= BADGE_RULES.deepWorkMinutes,
    },
  ];
}

/** "6 hr 20", "45 min", "2 hr". */
export function hoursLabel(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes}`;
}

/** "2:35" — the board's per-class and goal format. */
export function clockLabel(total: number): string {
  return `${Math.floor(total / 60)}:${String(total % 60).padStart(2, '0')}`;
}

/** All focused minutes ever recorded. */
export function focusedMinutes(completions: Completion[]): number {
  return completions.reduce((total, entry) => total + entry.actualMinutes, 0);
}

/** v3 5.1's big line: "61 hr 40 min", "2 hr", "45 min". */
export function durationLabel(total: number): string {
  const hours = Math.floor(total / 60);
  const minutes = total % 60;
  if (hours === 0) return `${minutes} min`;
  return minutes === 0 ? `${hours} hr` : `${hours} hr ${minutes} min`;
}

/** v3 5.2's Focused tile: whole hours once there is one, else minutes. */
export function hoursShortLabel(total: number): string {
  return total >= 60 ? `${Math.floor(total / 60)} hr` : `${total} min`;
}

export type MonthBar = { key: string; label: string; hours: number; isCurrent: boolean };

const MONTH = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];

/** Focused hours for the last `count` months, oldest first, ending with this one. */
export function hoursByMonth(completions: Completion[], today: PlanDate, count = 5): MonthBar[] {
  const [year, month] = today.split('-').map(Number);
  const minutes = new Map<string, number>();
  for (const entry of completions) {
    const key = planDateOf(entry.endedAt).slice(0, 7);
    minutes.set(key, (minutes.get(key) ?? 0) + entry.actualMinutes);
  }
  return Array.from({ length: count }, (_, i) => {
    const offset = month - 1 - (count - 1 - i);
    const y = year + Math.floor(offset / 12);
    const m = ((offset % 12) + 12) % 12;
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    return {
      key,
      label: MONTH[m],
      hours: Math.round(((minutes.get(key) ?? 0) / 60) * 10) / 10,
      isCurrent: i === count - 1,
    };
  });
}

/**
 * Assignments finished before their due date, out of those that are either
 * finished or past due — v3 5.1's "57 of 65" and 5.2's "Finished on time".
 */
export function onTimeSummary(
  assignments: WorkAssignment[],
  completions: Completion[],
  chunkCounts: Map<string, number>,
  now: Date,
): { onTime: number; total: number } {
  let onTime = 0;
  let total = 0;
  for (const a of assignments) {
    const chunks = chunkCounts.get(a.id) ?? 0;
    const done = completions.filter((c) => c.assignmentId === a.id);
    const finished = chunks > 0 && done.length >= chunks;
    if (!finished && a.dueAt > now) continue;
    total += 1;
    if (finished && done.every((c) => c.endedAt <= a.dueAt)) onTime += 1;
  }
  return { onTime, total };
}
