/**
 * Step 1 — only the due date is required.
 *
 * The spec's first three test cases all say the same thing: the planner must
 * not depend on any one signal.
 */

import { DEFAULT_ASSIGNMENT_MINUTES } from '../constants';
import { resolve } from '../resolve';
import { assignment, historyFor, noHistory } from './fixtures';

describe('resolve', () => {
  it('plans from a duration with no difficulty', () => {
    const result = resolve(assignment({ minutes: 90, difficulty: null }), noHistory);

    expect(result.minutes).toBe(90);
    expect(result.difficulty).toBe('hard'); // > 60 minutes
    expect(result.minutesSource).toBe('student');
  });

  it('plans from a difficulty with no duration, using the class median', () => {
    const result = resolve(
      assignment({ classId: 'bio', minutes: null, difficulty: 'easy' }),
      historyFor('bio', 50),
    );

    expect(result.minutes).toBe(50);
    expect(result.difficulty).toBe('easy'); // the student's word wins over the guess
    expect(result.minutesSource).toBe('class-history');
  });

  it('plans with neither, falling back to the class median', () => {
    const result = resolve(
      assignment({ classId: 'eng', minutes: null, difficulty: null }),
      historyFor('eng', 30),
    );

    expect(result.minutes).toBe(30);
    expect(result.difficulty).toBe('medium');
    expect(result.minutesSource).toBe('class-history');
  });

  it('falls back to the global default when the class has no history either', () => {
    const result = resolve(assignment({ minutes: null, difficulty: null }), noHistory);

    expect(result.minutes).toBe(DEFAULT_ASSIGNMENT_MINUTES);
    expect(result.minutesSource).toBe('default');
  });

  it('infers difficulty from size at the boundaries', () => {
    const at = (minutes: number) =>
      resolve(assignment({ minutes, difficulty: null }), noHistory).difficulty;

    expect(at(20)).toBe('easy'); // < 25
    expect(at(25)).toBe('medium'); // inclusive lower edge of medium
    expect(at(60)).toBe('medium'); // inclusive upper edge of medium
    expect(at(61)).toBe('hard'); // > 60
  });
});
