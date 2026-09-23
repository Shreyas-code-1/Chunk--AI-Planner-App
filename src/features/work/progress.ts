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
    const day = planDateOf(entry.at);
    map.set(day, (map.get(day) ?? 0) + entry.minutes);
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
      const day = planDateOf(entry.at);
      return day >= monday && day < end;
    })
    .reduce((total, entry) => total + entry.minutes, 0);
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
    map.set(name, (map.get(name) ?? 0) + entry.minutes);
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
    const done = completions.filter((c) => c.assignmentId === a.id && c.at <= a.dueAt);
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
