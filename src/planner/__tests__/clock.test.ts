/**
 * Engine v3 §8 — the plan in clock times, recalculated live.
 */

import { PAUSE_OVER_MINUTES } from '../constants';
import { plan } from '../plan';
import { replan } from '../replan';
import { chunkKey } from '../types';
import type { Assignment, Plan } from '../types';
import { NOW, assignment, completedFrom, dueIn, noHistory, prefs } from './fixtures';

const at = (minutes: number) => new Date(NOW.getTime() + minutes * 60_000);
const clock = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const today = (p: Plan) => p.days[0];

const evening = (): Assignment[] => [
  assignment({ id: 'x', title: 'Problem set', mode: 'problems', minutes: 90, dueAt: dueIn(1) }),
  assignment({ id: 'y', title: 'Essay', mode: 'writing', minutes: 120, dueAt: dueIn(1) }),
];
const roomy = prefs({ dailyTargetMinutes: 400 });

describe('clock times', () => {
  const p = plan(evening(), roomy, noHistory, NOW);

  it('gives every chunk and break a start and an end, and the evening a finish time', () => {
    for (const chunk of today(p).chunks) {
      expect(chunk.scheduledEnd.getTime() - chunk.scheduledStart.getTime()).toBe(
        chunk.plannedMinutes * 60_000,
      );
    }
    for (const b of today(p).breaks) {
      expect(b.end.getTime() - b.start.getTime()).toBe(b.minutes * 60_000);
    }
    const last = today(p).chunks[today(p).chunks.length - 1];
    expect(today(p).workEnd).toEqual(last.scheduledEnd);
    expect(today(p).finishAt.getTime()).toBe(
      last.scheduledEnd.getTime() + today(p).bufferMinutes * 60_000,
    );
  });

  it('leaves 15% of the evening as buffer before "done at"', () => {
    // Evening = the smaller of the 400-min target and 16:00 → 23:29 cutoff.
    expect(today(p).bufferMinutes).toBe(Math.round(0.15 * Math.min(400, 23 * 60 + 29 - 16 * 60)));
  });

  it('puts a midpoint pause in every chunk over 35 minutes, and only those', () => {
    const chunks = p.days.flatMap((d) => d.chunks);
    expect(chunks.some((c) => c.plannedMinutes > PAUSE_OVER_MINUTES)).toBe(true);
    for (const c of chunks) {
      if (c.plannedMinutes > PAUSE_OVER_MINUTES) {
        expect(c.pauseAt?.getTime()).toBe(
          c.scheduledStart.getTime() + (c.plannedMinutes / 2) * 60_000,
        );
      } else {
        expect(c.pauseAt).toBeNull();
      }
    }
  });

  it('spends the buffer when something is due today', () => {
    const urgent = plan([assignment({ minutes: 60, dueAt: dueIn(0, 23) })], roomy, noHistory, NOW);
    expect(today(urgent).bufferMinutes).toBe(0);
    expect(today(urgent).finishAt).toEqual(today(urgent).workEnd);
  });
});

describe('live recalculation', () => {
  const before = plan(evening(), roomy, noHistory, NOW);
  const first = today(before).chunks[0];

  it('moves every later time earlier, finish included, when a chunk finishes early', () => {
    // Planned 16:00 → first.plannedMinutes; finished 10 minutes early.
    const endedAt = at(first.plannedMinutes - 10);
    const after = plan(evening(), roomy, noHistory, endedAt, [
      completedFrom(first, endedAt, first.plannedMinutes - 10),
    ]);

    const was = new Map(today(before).chunks.map((c) => [chunkKey(c), c.scheduledStart]));
    for (const c of today(after).chunks) {
      // Breaks re-place around the real minutes worked, so "earlier", not "10 earlier".
      expect(c.scheduledStart.getTime()).toBeLessThan((was.get(chunkKey(c)) as Date).getTime());
    }
    expect(today(after).finishAt.getTime()).toBeLessThan(today(before).finishAt.getTime());
  });

  it('moves every later time later when the running chunk runs over', () => {
    const now = at(first.plannedMinutes + 10);
    const after = plan(evening(), roomy, noHistory, now, [], {
      assignmentId: first.assignmentId,
      title: first.title,
      plannedMinutes: first.plannedMinutes,
      startedAt: NOW,
    });

    const running = today(after).chunks[0];
    expect(chunkKey(running)).toBe(chunkKey(first));
    expect(clock(running.scheduledStart)).toBe('16:00'); // anchored where it started
    expect(running.scheduledEnd).toEqual(now);
    expect(today(after).finishAt.getTime()).toBeGreaterThan(today(before).finishAt.getTime());
    const was = new Map(today(before).chunks.map((c) => [chunkKey(c), c.scheduledStart]));
    for (const c of today(after).chunks.slice(1)) {
      expect(c.scheduledStart.getTime()).toBeGreaterThan((was.get(chunkKey(c)) as Date).getTime());
    }
  });

  it('keeps the break that was owed after a finished chunk', () => {
    // Finished exactly on time; the plan had a break before the next chunk.
    const endedAt = first.scheduledEnd;
    const next = today(before).chunks[1];
    const after = plan(evening(), roomy, noHistory, endedAt, [completedFrom(first, endedAt)]);
    expect(today(after).chunks[0].scheduledStart).toEqual(next.scheduledStart);
  });

  it('owes no break once the student has already taken one', () => {
    const endedAt = first.scheduledEnd;
    const now = new Date(endedAt.getTime() + 10 * 60_000);
    const after = plan(evening(), roomy, noHistory, now, [completedFrom(first, endedAt)]);
    expect(today(after).chunks[0].scheduledStart).toEqual(now);
  });
});

describe('re-plan structure hold', () => {
  // Two readings that exactly fill the evening up to the cutoff (bed 17:55).
  const work = [
    assignment({ id: 'x', mode: 'reading', minutes: 40, dueAt: dueIn(3) }),
    assignment({ id: 'y', mode: 'reading', minutes: 40, dueAt: dueIn(5) }),
  ];
  const tight = prefs({ dailyTargetMinutes: 400, bedtime: 17 * 60 + 55 });
  const before = plan(work, tight, noHistory, NOW);

  it('starts with both on tonight', () => {
    expect(today(before).chunks.map((c) => c.assignmentId)).toEqual(['x', 'y']);
    expect(clock(today(before).workEnd)).toBe('17:25');
  });

  it("keeps tonight's structure against a small drift, but still moves the times", () => {
    const { plan: after, moves } = replan(before, work, tight, noHistory, at(10));
    expect(today(after).chunks.map((c) => c.assignmentId)).toEqual(['x', 'y']);
    expect(clock(today(after).chunks[0].scheduledStart)).toBe('16:10');
    expect(moves.filter((m) => m.changedDay)).toHaveLength(0);
  });

  it('lets the structure change once the drift reaches 15 minutes, and says so', () => {
    const { plan: after, moves } = replan(before, work, tight, noHistory, at(20));
    expect(today(after).chunks.map((c) => c.assignmentId)).toEqual(['x']);
    expect(moves.filter((m) => m.changedDay).map((m) => m.chunk.assignmentId)).toEqual(['y']);
  });

  it('always re-plans when the student changed something', () => {
    const edited = [work[0], { ...work[1], dread: 'dreading' as const }];
    const fresh = plan(edited, tight, noHistory, at(5));
    const { plan: after } = replan(before, edited, tight, noHistory, at(5));
    expect(after.days.map((d) => d.chunks.map(chunkKey))).toEqual(
      fresh.days.map((d) => d.chunks.map(chunkKey)),
    );
  });
});
