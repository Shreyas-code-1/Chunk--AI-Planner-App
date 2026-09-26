/**
 * Step 1 — fill in what's missing.
 *
 * Only the due date is required. A student who types a title and a date gets a
 * plan; one who fills in every field gets a better one. Nothing here blocks.
 */

import { DEFAULT_ASSIGNMENT_MINUTES, DEFAULT_DREAD } from './constants';
import type { Assignment, Dread, History } from './types';

export type Resolved = {
  minutes: number;
  dread: Dread;
  /** Where the duration came from, so the UI can be honest about a guess. */
  minutesSource: 'student' | 'mode-history' | 'default';
};

export function resolve(assignment: Assignment, history: History): Resolved {
  let minutes = assignment.minutes;
  let minutesSource: Resolved['minutesSource'] = 'student';

  if (minutes == null) {
    minutes = history.medianTaskMinutes(assignment.mode);
    minutesSource = 'mode-history';
  }
  if (minutes == null) {
    minutes = DEFAULT_ASSIGNMENT_MINUTES;
    minutesSource = 'default';
  }

  return { minutes, minutesSource, dread: assignment.dread ?? DEFAULT_DREAD };
}
