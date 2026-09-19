/**
 * Step 5 — re-planning, and the 15-minute dead zone.
 */

import { plan } from '../plan';
import { replan } from '../replan';
import { NOW, assignment, dueIn, noHistory, prefs, totalMinutes } from './fixtures';

const later = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);

const work = () => [
  assignment({ classId: 'bio', minutes: 90, dueAt: dueIn(3) }),
  assignment({ classId: 'eng', minutes: 60, dueAt: dueIn(6) }),
];

const startsByKey = (p: ReturnType<typeof plan>) =>
  new Map(
    p.days.flatMap((day) =>
      day.chunks.map((c) => [`${c.assignmentId}#${c.index}`, c.scheduledStart.getTime()] as const),
    ),
  );

describe('replan', () => {
  it('leaves the schedule alone when nothing would move more than 15 minutes', () => {
    const assignments = work();
    const before = plan(assignments, prefs(), noHistory, NOW);

    // Five minutes pass. The clock has moved; the plan should not.
    const after = replan(before, assignments, prefs(), noHistory, later(5));

    expect(after.moves).toHaveLength(0);
    expect(startsByKey(after.plan)).toEqual(startsByKey(before));
  });

  it('moves the rest of the evening when a chunk runs long, and drops nothing', () => {
    const assignments = work();
    const before = plan(assignments, prefs(), noHistory, NOW);

    // The first chunk ran 50 minutes over.
    const after = replan(before, assignments, prefs(), noHistory, later(50));

    expect(after.moves.length).toBeGreaterThan(0);
    expect(totalMinutes(after.plan.days)).toBe(totalMinutes(before.days));
  });

  it('reports each move rather than applying it silently', () => {
    const assignments = work();
    const before = plan(assignments, prefs(), noHistory, NOW);
    const after = replan(before, assignments, prefs(), noHistory, later(90));

    for (const move of after.moves) {
      expect(move.fromStart).toBeInstanceOf(Date);
      expect(move.toStart).toBeInstanceOf(Date);
      expect(move.fromStart.getTime()).not.toBe(move.toStart.getTime());
      expect(typeof move.changedDay).toBe('boolean');
    }
  });

  it('marks a move that crosses to another day, which is the part worth saying', () => {
    const assignments = work();
    const before = plan(assignments, prefs(), noHistory, NOW);

    // The evening is nearly gone, so work has to shift to another day.
    const after = replan(before, assignments, prefs(), noHistory, later(60 * 5));
    const crossedDay = after.moves.filter((m) => m.changedDay);

    for (const move of crossedDay) {
      expect(move.fromPlanDate).not.toBe(move.toPlanDate);
    }
  });

  it('keeps new work that was not in the previous plan', () => {
    const assignments = work();
    const before = plan(assignments, prefs(), noHistory, NOW);

    const added = [...assignments, assignment({ classId: 'his', minutes: 60, dueAt: dueIn(5) })];
    const after = replan(before, added, prefs(), noHistory, NOW);

    expect(totalMinutes(after.plan.days)).toBeGreaterThan(totalMinutes(before.days));
  });
});
