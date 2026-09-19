/**
 * End to end: the invariants that must hold no matter what the steps do
 * individually.
 *
 * These are the ones worth breaking the build over. A student with nine hours
 * of work should look at their phone and not feel buried — these are the rules
 * that make that true.
 */

import { MAX_CHUNK_MINUTES } from '../constants';
import { plan } from '../plan';
import { planDateOf, toDateKey } from '../../lib/planDate';
import { NOW, assignment, dueIn, historyFor, noHistory, prefs } from './fixtures';

const allChunks = (p: ReturnType<typeof plan>) => p.days.flatMap((day) => day.chunks);

describe('plan', () => {
  it('plans an assignment with a duration but no difficulty', () => {
    const p = plan([assignment({ minutes: 90, difficulty: null })], prefs(), noHistory, NOW);
    expect(allChunks(p).length).toBeGreaterThan(0);
  });

  it('plans an assignment with a difficulty but no duration', () => {
    const p = plan(
      [assignment({ minutes: null, difficulty: 'hard' })],
      prefs(),
      historyFor('bio', 80),
      NOW,
    );
    expect(allChunks(p).length).toBeGreaterThan(0);
  });

  it('plans an assignment with neither, using the class median', () => {
    const p = plan(
      [assignment({ classId: 'eng', minutes: null, difficulty: null })],
      prefs(),
      historyFor('eng', 60),
      NOW,
    );
    expect(allChunks(p).length).toBeGreaterThan(0);
  });

  it('never schedules work on the night something is due', () => {
    const assignments = [
      assignment({ minutes: 120, dueAt: dueIn(2) }),
      assignment({ minutes: 200, dueAt: dueIn(5) }),
      assignment({ minutes: 90, dueAt: dueIn(8) }),
    ];

    const p = plan(assignments, prefs(), noHistory, NOW);

    for (const chunk of allChunks(p)) {
      expect(chunk.planDate).not.toBe(planDateOf(chunk.dueAt, 3));
    }
  });

  it('spreads a week of work instead of cramming it into today', () => {
    const assignments = Array.from({ length: 4 }, (_, i) =>
      assignment({ minutes: 120, dueAt: dueIn(6), classId: `c${i}` }),
    );

    const p = plan(assignments, prefs(), noHistory, NOW);
    const today = p.days.find((d) => d.planDate === toDateKey(NOW));

    expect(p.days.length).toBeGreaterThan(3);
    expect(today?.loadMinutes ?? 0).toBeLessThanOrEqual(480 / 2);
  });

  it('keeps every chunk under the one-sitting ceiling', () => {
    const p = plan(
      [assignment({ minutes: 600, dueAt: dueIn(7) })],
      prefs({ chunkLength: 'long' }),
      noHistory,
      NOW,
    );

    for (const chunk of allChunks(p)) {
      expect(chunk.plannedMinutes).toBeLessThanOrEqual(MAX_CHUNK_MINUTES);
    }
  });

  it('orders each day by deadline', () => {
    const p = plan(
      [
        assignment({ classId: 'bio', minutes: 60, dueAt: dueIn(2) }),
        assignment({ classId: 'eng', minutes: 60, dueAt: dueIn(3) }),
      ],
      prefs(),
      noHistory,
      NOW,
    );

    for (const day of p.days) {
      const deadlines = day.chunks.map((c) => c.dueAt.getTime());
      expect([...deadlines]).toEqual([...deadlines].sort((a, b) => a - b));
    }
  });

  it('runs each day’s chunks in start order, without overlaps', () => {
    const p = plan(
      [assignment({ minutes: 180, dueAt: dueIn(2) })],
      prefs(),
      noHistory,
      NOW,
    );

    for (const day of p.days) {
      for (let i = 1; i < day.chunks.length; i++) {
        const previous = day.chunks[i - 1];
        const endsAt = previous.scheduledStart.getTime() + previous.plannedMinutes * 60_000;
        expect(day.chunks[i].scheduledStart.getTime()).toBeGreaterThanOrEqual(endsAt);
      }
    }
  });

  it('asks about the largest assignment rather than cramming, when nothing fits', () => {
    const assignments = [
      assignment({ title: 'History essay', minutes: 400, dueAt: dueIn(2) }),
      assignment({ title: 'Bio reading', minutes: 50, dueAt: dueIn(2) }),
      assignment({ title: 'Alg set', minutes: 50, dueAt: dueIn(2) }),
    ];

    const p = plan(assignments, prefs(), noHistory, NOW);

    expect(p.atRisk.map((a) => a.title)).toEqual(['History essay']);
    // The work that is still achievable is still planned.
    expect(allChunks(p).length).toBeGreaterThan(0);
    for (const chunk of allChunks(p)) {
      expect(chunk.assignmentId).not.toBe(p.atRisk[0].id);
    }
  });

  it('emits no days at all when there is no work', () => {
    const p = plan([], prefs(), noHistory, NOW);

    expect(p.days).toEqual([]);
    expect(p.atRisk).toEqual([]);
  });

  it('is deterministic: the same input plans the same way twice', () => {
    const assignments = [
      assignment({ classId: 'bio', minutes: 120, dueAt: dueIn(4) }),
      assignment({ classId: 'eng', minutes: 90, dueAt: dueIn(6) }),
    ];

    const a = plan(assignments, prefs(), noHistory, NOW);
    const b = plan(assignments, prefs(), noHistory, NOW);

    expect(JSON.stringify(a)).toBe(JSON.stringify(b));
  });
});
