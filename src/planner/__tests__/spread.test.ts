/**
 * Step 3 — spreading, front-loading, and the rule that work never lands on the
 * night it is due.
 */

import { planDateOf, toDateKey } from '../../lib/planDate';
import { availableDays, spread } from '../spread';
import { split } from '../split';
import type { SplitChunk } from '../types';
import { NOW, assignment, dueIn, noHistory, prefs } from './fixtures';

/** n chunks of 30 minutes, without going through split(). */
const chunks = (n: number): SplitChunk[] =>
  Array.from({ length: n }, (_, i) => ({
    assignmentId: 'a',
    index: i + 1,
    title: `Part ${i + 1} of ${n}`,
    plannedMinutes: 30,
  }));

const countByDay = (placed: { planDate: string }[]) => {
  const counts = new Map<string, number>();
  for (const chunk of placed) counts.set(chunk.planDate, (counts.get(chunk.planDate) ?? 0) + 1);
  return [...counts.entries()].sort(([a], [b]) => (a < b ? -1 : 1));
};

describe('spread', () => {
  it('puts one chunk a day when 5 chunks have 5 days', () => {
    const due = dueIn(5);
    const placed = spread(assignment({ dueAt: due }), chunks(5), prefs(), NOW);

    expect(countByDay(placed).map(([, n]) => n)).toEqual([1, 1, 1, 1, 1]);
  });

  it('front-loads the remainder: 5 chunks over 2 days is 3 then 2', () => {
    const placed = spread(assignment({ dueAt: dueIn(2) }), chunks(5), prefs(), NOW);

    // The extra chunk goes on the earlier day, building slack before the
    // deadline rather than after it.
    expect(countByDay(placed).map(([, n]) => n)).toEqual([3, 2]);
  });

  it('never schedules anything on the night it is due', () => {
    for (const days of [1, 2, 3, 5, 9]) {
      const due = dueIn(days);
      const placed = spread(assignment({ dueAt: due }), chunks(4), prefs(), NOW);
      const dueDay = planDateOf(due, 3);

      expect(placed.some((chunk) => chunk.planDate === dueDay)).toBe(false);
    }
  });

  it('puts everything today when the work is due tomorrow', () => {
    const placed = spread(assignment({ dueAt: dueIn(1) }), chunks(3), prefs(), NOW);
    expect(countByDay(placed)).toEqual([[toDateKey(NOW), 3]]);
  });

  it('puts everything today when the work is already due', () => {
    const placed = spread(assignment({ dueAt: dueIn(0) }), chunks(2), prefs(), NOW);
    expect(countByDay(placed)).toEqual([[toDateKey(NOW), 2]]);
  });

  describe('startStyle narrows the window from the front', () => {
    const due = dueIn(10);

    it('"asap" uses every day up to the day before', () => {
      expect(availableDays(assignment({ dueAt: due }), prefs({ startStyle: 'asap' }), NOW))
        .toHaveLength(10);
    });

    it('"a few days before" starts 3 days out', () => {
      const days = availableDays(assignment({ dueAt: due }), prefs({ startStyle: 'few_days' }), NOW);
      expect(days).toHaveLength(3);
    });

    it('"the day before" uses exactly one day, and it is not the due date', () => {
      const days = availableDays(
        assignment({ dueAt: due }),
        prefs({ startStyle: 'day_before' }),
        NOW,
      );

      expect(days).toHaveLength(1);
      expect(days[0]).not.toBe(planDateOf(due, 3));
    });

    it('never starts in the past, however wide the window', () => {
      const soon = dueIn(2);
      const days = availableDays(
        assignment({ dueAt: soon }),
        prefs({ startStyle: 'few_days' }),
        NOW,
      );

      expect(days[0]).toBe(toDateKey(NOW));
    });
  });

  it('keeps every chunk: nothing is dropped on the way through', () => {
    const assignmentUnderTest = assignment({ minutes: 150, dueAt: dueIn(4) });
    const cut = split(assignmentUnderTest, prefs(), noHistory);
    const placed = spread(assignmentUnderTest, cut, prefs(), NOW);

    expect(placed).toHaveLength(cut.length);
    expect(new Set(placed.map((c) => c.index)).size).toBe(cut.length);
  });
});
