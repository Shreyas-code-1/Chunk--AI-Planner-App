/**
 * Laying a day on the clock — engine v2: due-today first, one warm-up, mode
 * batches, breaks, and the bedtime cutoff.
 */

import {
  BEDTIME_BEND_MAX_MINUTES,
  LONG_BREAK_MINUTES,
  MAX_CHUNK_MINUTES,
  SHORT_BREAK_MINUTES,
} from '../constants';
import { scheduleDay } from '../schedule';
import { toDateKey } from '../../lib/planDate';
import type { BalancedDay, PlacedChunk } from '../balance';
import type { Dread, Mode } from '../types';
import { NOW, dueIn, prefs } from './fixtures';

let seq = 0;
const placed = (overrides: Partial<PlacedChunk> = {}): PlacedChunk => ({
  assignmentId: `t${++seq}`,
  index: 1,
  title: 'Part',
  plannedMinutes: 30,
  planDate: toDateKey(NOW),
  classId: 'bio',
  dueAt: dueIn(5),
  pinned: false,
  mode: 'reading',
  dread: 'meh',
  firstAction: 'Read the first page',
  ...overrides,
});

const task = (
  id: string,
  mode: Mode,
  dread: Dread,
  minutes: number,
  extra: Partial<PlacedChunk> = {},
) =>
  placed({
    assignmentId: id,
    mode,
    dread,
    plannedMinutes: minutes,
    ...extra,
  });

const dayOf = (chunks: PlacedChunk[]): BalancedDay => ({
  planDate: chunks[0].planDate,
  chunks,
  loadMinutes: chunks.reduce((s, c) => s + c.plannedMinutes, 0),
  targetMinutes: 600,
  overTargetReason: null,
});

const clock = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const bed = (hour: number, minute = 0) => prefs({ bedtime: hour * 60 + minute });

describe('scheduleDay — the spec example', () => {
  // vocab 10 easy, math 25 hard, chem 20 medium, English 50 hard (2x25, due
  // tomorrow), history 40 medium. Bedtime 10:30, start 4:00.
  const chunks = [
    task('vocab', 'memorizing', 'fine', 10),
    task('math', 'problems', 'dreading', 25),
    task('chem', 'problems', 'meh', 20),
    task('eng', 'writing', 'dreading', 25, {
      index: 1,
      dueAt: dueIn(1),
      pinned: true,
    }),
    task('eng', 'writing', 'dreading', 25, {
      index: 2,
      dueAt: dueIn(1),
      pinned: true,
    }),
    task('hist', 'writing', 'meh', 40),
  ];
  const { day } = scheduleDay(dayOf(chunks), bed(22, 30), NOW);

  it('orders warm-up, then problems, then writing, hardest first', () => {
    expect(day.chunks.map((c) => c.assignmentId)).toEqual([
      'vocab',
      'math',
      'chem',
      'eng',
      'eng',
      'hist',
    ]);
    expect(day.chunks.map((c) => clock(c.scheduledStart))).toEqual([
      '16:00',
      '16:10',
      '16:40',
      '17:05',
      '17:35',
      '18:15',
    ]);
  });

  it('places the example breaks', () => {
    expect(day.breaks.map((b) => [clock(b.start), b.minutes])).toEqual([
      ['16:35', SHORT_BREAK_MINUTES], // inside the problems batch
      ['17:00', SHORT_BREAK_MINUTES], // batch boundary
      ['17:30', SHORT_BREAK_MINUTES], // ~25 min into the essay
      ['18:00', LONG_BREAK_MINUTES], // after ~90 min of work
    ]);
  });

  it('labels segments', () => {
    expect(day.chunks.map((c) => c.segment)).toEqual([
      'opener',
      'problems',
      'problems',
      'writing',
      'writing',
      'writing',
    ]);
  });
});

describe('scheduleDay — ordering', () => {
  it('takes exactly one warm-up, the shortest under the threshold', () => {
    const { day } = scheduleDay(
      dayOf([
        task('a', 'memorizing', 'fine', 10),
        task('b', 'memorizing', 'fine', 5),
        task('c', 'reading', 'dreading', 30),
      ]),
      bed(23),
      NOW,
    );
    expect(day.chunks.filter((c) => c.segment === 'opener').map((c) => c.assignmentId)).toEqual([
      'b',
    ]);
  });

  it('skips the warm-up when nothing is short enough', () => {
    const { day } = scheduleDay(dayOf([task('a', 'reading', 'fine', 30)]), bed(23), NOW);
    expect(day.chunks.some((c) => c.segment === 'opener')).toBe(false);
  });

  it('puts due-today work first and skips the warm-up', () => {
    const { day } = scheduleDay(
      dayOf([
        task('vocab', 'memorizing', 'fine', 10),
        task('hard', 'problems', 'dreading', 30),
        task('urgent', 'reading', 'fine', 20, {
          dueAt: dueIn(0, 23),
          pinned: true,
        }),
      ]),
      bed(23),
      NOW,
    );
    expect(day.chunks[0].assignmentId).toBe('urgent');
    expect(day.chunks[0].segment).toBe('dueToday');
    expect(day.chunks.some((c) => c.segment === 'opener')).toBe(false);
  });

  it('asks which is submitted first when due-today deadlines tie', () => {
    const due = dueIn(0, 23);
    const result = scheduleDay(
      dayOf([
        task('x', 'reading', 'fine', 20, { dueAt: due, pinned: true }),
        task('y', 'writing', 'fine', 20, { dueAt: due, pinned: true }),
      ]),
      bed(23),
      NOW,
    );
    expect(result.needsSubmitOrder.sort()).toEqual(['x', 'y']);
  });
});

describe('scheduleDay — bedtime', () => {
  it('defers movable work, latest deadline first, past the cutoff and buffer', () => {
    // 16:00 to 19:30 cutoff (bed 20:00) is 210 min; minus 15% leaves ~178.
    const result = scheduleDay(
      dayOf([
        task('soon', 'reading', 'dreading', 50, { dueAt: dueIn(2) }),
        task('mid', 'reading', 'dreading', 50, { dueAt: dueIn(4) }),
        task('late', 'reading', 'dreading', 50, { dueAt: dueIn(9) }),
        task('later', 'reading', 'dreading', 50, { dueAt: dueIn(10) }),
      ]),
      bed(20),
      NOW,
    );
    expect(result.deferred.map((c) => c.assignmentId)).toEqual(['later']);
    expect(result.day.bedtimeOverrun).toBeNull();
  });

  it('bends past bedtime for must-do-tonight work and reports it', () => {
    const result = scheduleDay(
      dayOf([
        task('a', 'writing', 'dreading', 55, { dueAt: dueIn(0, 23), pinned: true }),
        task('b', 'writing', 'dreading', 55, { dueAt: dueIn(0, 23), pinned: true }),
        task('c', 'writing', 'dreading', 55, { dueAt: dueIn(0, 23), pinned: true }),
      ]),
      bed(18, 30),
      NOW,
    );
    // 55, break 5, 55, long break 15 (past ~90 min), 55 → ends 19:05.
    expect(result.day.bedtimeOverrun).toEqual({
      minutesPastCutoff: 65,
      minutesPastBedtime: 35,
    });
    expect(result.urgentTriage).toBeNull();
    expect(result.day.breaks.length).toBeGreaterThan(0); // breaks stay
  });

  it('suggests what to let go when must-do work runs past the bend', () => {
    const result = scheduleDay(
      dayOf([
        task('math', 'problems', 'dreading', 50, {
          dueAt: dueIn(0, 23),
          pinned: true,
        }),
        task('essay', 'writing', 'dreading', 55, {
          dueAt: dueIn(0, 23),
          pinned: true,
        }),
        task('hist', 'reading', 'meh', 40, {
          dueAt: dueIn(0, 23),
          pinned: true,
        }),
        task('hist', 'reading', 'meh', 40, {
          index: 2,
          dueAt: dueIn(0, 23),
          pinned: true,
        }),
      ]),
      bed(17, 30),
      NOW,
    );
    expect(result.urgentTriage?.letGo).toEqual(['hist']);
    // The suggested let-go stays visible, last; everything else fits the bend.
    const ids = result.day.chunks.map((c) => c.assignmentId);
    expect(ids.slice(-2)).toEqual(['hist', 'hist']);
    const kept = result.day.chunks.filter((c) => c.assignmentId !== 'hist');
    const end = Math.max(...kept.map((c) => c.scheduledStart.getTime() / 60_000 + c.plannedMinutes));
    expect(end - NOW.getTime() / 60_000).toBeLessThanOrEqual(90 + BEDTIME_BEND_MAX_MINUTES);
  });

  it('never grows a chunk past the cap', () => {
    const { day } = scheduleDay(
      dayOf([task('a', 'writing', 'dreading', 55, { dueAt: dueIn(0, 23), pinned: true })]),
      bed(17),
      NOW,
    );
    expect(Math.max(...day.chunks.map((c) => c.plannedMinutes))).toBeLessThanOrEqual(
      MAX_CHUNK_MINUTES,
    );
  });
});

describe('scheduleDay — start time', () => {
  it('starts today from now when now is past the usual start time', () => {
    const later = new Date(NOW.getTime());
    later.setHours(18, 30, 0, 0);
    const { day } = scheduleDay(dayOf([placed()]), bed(23), later);
    expect(clock(day.chunks[0].scheduledStart)).toBe('18:30');
  });

  it('starts a future day from the usual start time', () => {
    const tomorrow = new Date(NOW.getTime());
    tomorrow.setDate(tomorrow.getDate() + 1);
    const { day } = scheduleDay(dayOf([placed({ planDate: toDateKey(tomorrow) })]), bed(23), NOW);
    expect(clock(day.chunks[0].scheduledStart)).toBe('16:00');
  });
});
