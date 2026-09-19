/**
 * Laying a day on the clock: order, interleaving and breaks.
 */

import { BREAK_MINUTES } from '../constants';
import { scheduleDay } from '../schedule';
import { toDateKey } from '../../lib/planDate';
import type { BalancedDay, PlacedChunk } from '../balance';
import { NOW, dueIn, prefs } from './fixtures';

let seq = 0;
const placed = (overrides: Partial<PlacedChunk> = {}): PlacedChunk => ({
  assignmentId: 'a',
  index: ++seq,
  title: 'Part',
  plannedMinutes: 30,
  planDate: toDateKey(NOW),
  classId: 'bio',
  dueAt: dueIn(5),
  pinned: false,
  ...overrides,
});

const dayOf = (chunks: PlacedChunk[]): BalancedDay => ({
  planDate: chunks[0].planDate,
  chunks,
  loadMinutes: chunks.reduce((s, c) => s + c.plannedMinutes, 0),
  targetMinutes: 120,
  overTargetReason: null,
});

const minutesInto = (start: Date) => start.getHours() * 60 + start.getMinutes();

describe('scheduleDay', () => {
  it('starts today from now when now is past the usual start time', () => {
    // availableStart is 16:00 and NOW is 16:00, so they coincide; push now on.
    const later = new Date(NOW.getTime());
    later.setHours(18, 30, 0, 0);

    const day = scheduleDay(dayOf([placed()]), prefs(), later);

    expect(minutesInto(day.chunks[0].scheduledStart)).toBe(18 * 60 + 30);
  });

  it('starts a future day from the student’s usual start time', () => {
    const tomorrow = new Date(NOW.getTime());
    tomorrow.setDate(tomorrow.getDate() + 1);

    const day = scheduleDay(dayOf([placed({ planDate: toDateKey(tomorrow) })]), prefs(), NOW);

    expect(minutesInto(day.chunks[0].scheduledStart)).toBe(16 * 60);
  });

  it('runs chunks back to back, with a break after every two', () => {
    const day = scheduleDay(
      dayOf([placed(), placed(), placed(), placed()]),
      prefs(),
      NOW,
    );

    const starts = day.chunks.map((c) => minutesInto(c.scheduledStart));
    expect(starts[1] - starts[0]).toBe(30); // straight on
    expect(starts[2] - starts[1]).toBe(30 + BREAK_MINUTES); // break after two
    expect(starts[3] - starts[2]).toBe(30);
  });

  it('interleaves classes rather than blocking one subject', () => {
    const day = scheduleDay(
      dayOf([
        placed({ classId: 'bio' }),
        placed({ classId: 'bio' }),
        placed({ classId: 'bio' }),
        placed({ classId: 'eng' }),
        placed({ classId: 'alg' }),
      ]),
      prefs(),
      NOW,
    );

    const classes = day.chunks.map((c) => c.classId);
    // No three of the same class in a row anywhere in the day.
    for (let i = 0; i + 2 < classes.length; i++) {
      expect(new Set(classes.slice(i, i + 3)).size).toBeGreaterThan(1);
    }
  });

  it('does not let interleaving overtake an earlier deadline', () => {
    const day = scheduleDay(
      dayOf([
        placed({ classId: 'bio', dueAt: dueIn(9) }),
        placed({ classId: 'eng', dueAt: dueIn(2) }),
        placed({ classId: 'bio', dueAt: dueIn(2) }),
      ]),
      prefs(),
      NOW,
    );

    const deadlines = day.chunks.map((c) => c.dueAt.getTime());
    expect([...deadlines]).toEqual([...deadlines].sort((a, b) => a - b));
  });

  it('carries the day’s load, target and over-target reason through untouched', () => {
    const source = { ...dayOf([placed()]), overTargetReason: 'everything here is due soon' };
    const day = scheduleDay(source, prefs(), NOW);

    expect(day.loadMinutes).toBe(source.loadMinutes);
    expect(day.targetMinutes).toBe(source.targetMinutes);
    expect(day.overTargetReason).toBe(source.overTargetReason);
  });
});
