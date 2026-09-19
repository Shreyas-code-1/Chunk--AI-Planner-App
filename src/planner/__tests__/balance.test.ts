/**
 * Step 4 — levelling the days.
 */

import { balance, targetFor, type PlacedChunk } from '../balance';
import { toDateKey } from '../../lib/planDate';
import { NOW, dueIn, prefs } from './fixtures';

const day = (offset: number) => {
  const date = new Date(NOW.getTime());
  date.setDate(date.getDate() + offset);
  return toDateKey(date);
};

let seq = 0;
const placed = (overrides: Partial<PlacedChunk> = {}): PlacedChunk => ({
  assignmentId: `a${seq}`,
  index: ++seq,
  title: 'Part',
  plannedMinutes: 30,
  planDate: day(0),
  classId: 'bio',
  dueAt: dueIn(6),
  pinned: false,
  ...overrides,
});

const loadOn = (days: { planDate: string; loadMinutes: number }[], key: string) =>
  days.find((d) => d.planDate === key)?.loadMinutes ?? 0;

describe('balance', () => {
  it('moves the least urgent work off an overloaded day', () => {
    // Thursday: four assignments each landing a chunk there, 240 minutes
    // against a 120-minute target.
    const thursday = day(3);
    const chunks = [
      placed({ planDate: thursday, plannedMinutes: 60, dueAt: dueIn(4), classId: 'bio' }),
      placed({ planDate: thursday, plannedMinutes: 60, dueAt: dueIn(4), classId: 'alg' }),
      placed({ planDate: thursday, plannedMinutes: 60, dueAt: dueIn(9), classId: 'eng' }),
      placed({ planDate: thursday, plannedMinutes: 60, dueAt: dueIn(9), classId: 'his' }),
    ];

    const days = balance(chunks, prefs(), NOW);

    expect(loadOn(days, thursday)).toBeLessThan(240);
    // The two due soonest stay put; the slack ones are what moved.
    const stillThursday = days.find((d) => d.planDate === thursday)?.chunks ?? [];
    for (const chunk of stillThursday) {
      expect(chunk.dueAt.getTime()).toBe(dueIn(4).getTime());
    }
  });

  it('never moves a chunk to or past its own due date', () => {
    const chunks = Array.from({ length: 6 }, () =>
      placed({ planDate: day(1), plannedMinutes: 40, dueAt: dueIn(3) }),
    );

    const days = balance(chunks, prefs(), NOW);

    for (const d of days) {
      for (const chunk of d.chunks) {
        expect(d.planDate < toDateKey(chunk.dueAt)).toBe(true);
      }
    }
  });

  it('leaves a day over target when deadlines force it, and says why', () => {
    // Four hours of work, all due the day after tomorrow: it cannot fit under
    // a two-hour ceiling and there is nowhere to move it.
    const chunks = Array.from({ length: 8 }, () =>
      placed({ planDate: day(0), plannedMinutes: 30, dueAt: dueIn(1), pinned: true }),
    );

    const days = balance(chunks, prefs(), NOW);
    const today = days.find((d) => d.planDate === day(0));

    expect(today?.loadMinutes).toBe(240);
    expect(today?.overTargetReason).toEqual(expect.stringContaining('due'));
  });

  it('reports no reason on a day that fits', () => {
    const days = balance([placed({ plannedMinutes: 30 })], prefs(), NOW);
    expect(days[0].overTargetReason).toBeNull();
  });

  it('drops days with no work rather than emitting empty ones', () => {
    // Days with nothing on them are not plan days, which is what makes them
    // invisible to the streak.
    const days = balance([placed({ planDate: day(2) })], prefs(), NOW);

    expect(days).toHaveLength(1);
    expect(days[0].planDate).toBe(day(2));
  });

  it('never loses or duplicates a chunk', () => {
    const chunks = Array.from({ length: 10 }, (_, i) =>
      placed({ planDate: day(i % 2), plannedMinutes: 45, dueAt: dueIn(8) }),
    );

    const days = balance(chunks, prefs(), NOW);
    const indexes = days.flatMap((d) => d.chunks.map((c) => c.index));

    expect(indexes).toHaveLength(10);
    expect(new Set(indexes).size).toBe(10);
  });

  describe('weekday factors scale each day’s ceiling', () => {
    it('gives a "light" day more room and a "busy" day less', () => {
      const busySunday = prefs({ weekdayFactors: [0.4, 1, 1, 1, 1, 1, 1] });
      const lightSunday = prefs({ weekdayFactors: [1.3, 1, 1, 1, 1, 1, 1] });
      const sunday = day(6); // NOW is a Monday

      expect(targetFor(sunday, busySunday)).toBe(48); // 120 * 0.4
      expect(targetFor(sunday, lightSunday)).toBe(156); // 120 * 1.3
    });

    it('prefers the roomier day when moving work', () => {
      const overloaded = day(0);
      const chunks = Array.from({ length: 6 }, () =>
        placed({ planDate: overloaded, plannedMinutes: 40, dueAt: dueIn(9) }),
      );

      // Tuesday busy, Wednesday light.
      const days = balance(
        chunks,
        prefs({ weekdayFactors: [1, 1, 0.4, 1.3, 1, 1, 1] }),
        NOW,
      );

      expect(loadOn(days, day(2))).toBeGreaterThanOrEqual(loadOn(days, day(1)));
    });
  });
});
