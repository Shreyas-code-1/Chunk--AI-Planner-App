/**
 * Step 1 — only the due date is required.
 *
 * The planner must not depend on any one signal. Missing estimates fall back
 * to the student's median for the mode (v3 §10), then to a default.
 */

import { DEFAULT_ASSIGNMENT_MINUTES, DEFAULT_DREAD } from '../constants';
import { resolve } from '../resolve';
import { assignment, historyFor, noHistory } from './fixtures';

describe('resolve', () => {
  it('uses the student duration and dread when given', () => {
    const result = resolve(assignment({ minutes: 90, dread: 'dreading' }), noHistory);
    expect(result).toEqual({ minutes: 90, dread: 'dreading', minutesSource: 'student' });
  });

  it('defaults dread when the student has not said', () => {
    expect(resolve(assignment({ dread: null }), noHistory).dread).toBe(DEFAULT_DREAD);
  });

  it('fills a missing duration from the median for the mode, not the class', () => {
    const result = resolve(
      assignment({ classId: 'bio', mode: 'writing', minutes: null }),
      historyFor('writing', 50),
    );
    expect(result.minutes).toBe(50);
    expect(result.minutesSource).toBe('mode-history');
  });

  it('falls back to the global default when the mode has no history either', () => {
    const result = resolve(assignment({ minutes: null }), noHistory);
    expect(result.minutes).toBe(DEFAULT_ASSIGNMENT_MINUTES);
    expect(result.minutesSource).toBe('default');
  });
});
