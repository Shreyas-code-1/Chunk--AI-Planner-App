/**
 * Step 1 — fill in what's missing.
 *
 * Only the due date is required. A student who types a title and a date gets a
 * plan; one who fills in every field gets a better one. Nothing here blocks.
 */

import { DEFAULT_ASSIGNMENT_MINUTES } from './constants';
import type { Assignment, Difficulty, History } from './types';

export type Resolved = {
  minutes: number;
  difficulty: Difficulty;
  /** Where the duration came from, so the UI can be honest about a guess. */
  minutesSource: 'student' | 'class-history' | 'default';
};

/** Difficulty inferred from size, when the student didn't say. */
function difficultyFromMinutes(minutes: number): Difficulty {
  if (minutes > 60) return 'hard';
  if (minutes < 25) return 'easy';
  return 'medium';
}

export function resolve(assignment: Assignment, history: History): Resolved {
  let minutes = assignment.minutes;
  let minutesSource: Resolved['minutesSource'] = 'student';

  if (minutes == null) {
    minutes = history.medianMinutes(assignment.classId);
    minutesSource = 'class-history';
  }
  if (minutes == null) {
    minutes = DEFAULT_ASSIGNMENT_MINUTES;
    minutesSource = 'default';
  }

  return {
    minutes,
    minutesSource,
    difficulty: assignment.difficulty ?? difficultyFromMinutes(minutes),
  };
}
