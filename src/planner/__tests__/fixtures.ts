/**
 * Shared fixtures for the planner tests.
 *
 * Everything is built with local-time Date constructors so the suite behaves
 * the same in any timezone — the planner is explicitly single-timezone and
 * works in the runtime's local zone.
 */

import { DEFAULT_WEEKDAY_FACTORS } from '../constants';
import type { Assignment, History, Prefs } from '../types';

/** Monday 14 September 2026, 16:00 local. */
export const NOW = new Date(2026, 8, 14, 16, 0, 0, 0);

/** Local 18:00 on a date `days` after NOW, the usual "due at end of day". */
export function dueIn(days: number, hour = 18): Date {
  const date = new Date(NOW.getTime());
  date.setDate(date.getDate() + days);
  date.setHours(hour, 0, 0, 0);
  return date;
}

export const prefs = (overrides: Partial<Prefs> = {}): Prefs => ({
  chunkLength: 'mixed',
  availableStart: 16 * 60, // 4 PM
  availableEnd: 22 * 60, // 10 PM
  dailyTargetMinutes: 120,
  startStyle: 'asap',
  weekdayFactors: DEFAULT_WEEKDAY_FACTORS,
  dayCutoffHour: 3,
  // Late enough that the v2 bedtime cutoff never interferes with the older suites.
  bedtime: 23 * 60 + 59,
  ...overrides,
});

let counter = 0;
export const assignment = (overrides: Partial<Assignment> = {}): Assignment => ({
  id: `a${++counter}`,
  classId: 'bio',
  title: 'Read chapter 4',
  dueAt: dueIn(5),
  minutes: 60,
  difficulty: 'medium',
  source: 'typed',
  mode: 'reading',
  firstAction: null,
  ...overrides,
});

/** History that knows nothing, so resolve() falls through to the default. */
export const noHistory: History = { medianMinutes: () => null };

/** History with a median for one class. */
export const historyFor = (classId: string, minutes: number): History => ({
  medianMinutes: (id) => (id === classId ? minutes : null),
});

/** Total planned minutes across every day of a plan. */
export const totalMinutes = (days: { chunks: { plannedMinutes: number }[] }[]): number =>
  days.reduce((sum, day) => sum + day.chunks.reduce((s, c) => s + c.plannedMinutes, 0), 0);
