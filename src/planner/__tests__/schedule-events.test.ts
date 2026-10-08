/**
 * Planning around events (docs/events-plan.md, step 4): events are fixed busy
 * time. Chunks go only in the gaps, are never split, breaks never land inside
 * an event, and the finish time includes them.
 */

import { toDateKey } from '../../lib/planDate';
import type { BalancedDay, PlacedChunk } from '../balance';
import { scheduleDay, type DayEvent } from '../schedule';
import type { Dread, Mode, ScheduledChunk } from '../types';
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
  dread: 'dreading', // never an opener, so the order is just the batches
  firstAction: 'Read the first page',
  ...overrides,
});

const task = (id: string, mode: Mode, dread: Dread, minutes: number, extra: Partial<PlacedChunk> = {}) =>
  placed({ assignmentId: id, mode, dread, plannedMinutes: minutes, ...extra });

const dayOf = (chunks: PlacedChunk[], targetMinutes = 600): BalancedDay => ({
  planDate: toDateKey(NOW),
  chunks,
  loadMinutes: chunks.reduce((s, c) => s + c.plannedMinutes, 0),
  targetMinutes,
  overTargetReason: null,
});

/** An event today (Monday 14 Sep) from h:m to h:m. */
const event = (title: string, from: [number, number], to: [number, number]): DayEvent => ({
  title,
  start: new Date(2026, 8, 14, from[0], from[1]),
  end: new Date(2026, 8, 14, to[0], to[1]),
  allDay: false,
});

const clock = (d: Date) => `${d.getHours()}:${String(d.getMinutes()).padStart(2, '0')}`;
const bed = (hour: number, minute = 0) => prefs({ bedtime: hour * 60 + minute });
const overlaps = (a: { start: Date; end: Date }, b: { start: Date; end: Date }) =>
  a.start < b.end && b.start < a.end;
const span = (c: ScheduledChunk) => ({ start: c.scheduledStart, end: c.scheduledEnd });

describe('scheduleDay — events are busy time', () => {
  it('never places a chunk on top of an event', () => {
    const practice = event('Practice', [16, 30], [17, 30]);
    const { day } = scheduleDay(
      dayOf([task('a', 'reading', 'dreading', 30), task('b', 'reading', 'dreading', 30), task('c', 'reading', 'dreading', 30)]),
      bed(23),
      NOW,
      {},
      null,
      [practice],
    );
    expect(day.chunks).toHaveLength(3);
    for (const chunk of day.chunks) expect(overlaps(span(chunk), practice)).toBe(false);
  });

  it('moves a chunk that will not fit before an event to after it, whole', () => {
    const { day } = scheduleDay(
      dayOf([task('essay', 'writing', 'dreading', 40)]),
      bed(23),
      NOW,
      {},
      null,
      [event('Dentist', [16, 20], [17, 0])],
    );
    const [chunk] = day.chunks;
    expect(clock(chunk.scheduledStart)).toBe('17:00');
    expect(clock(chunk.scheduledEnd)).toBe('17:40');
    expect(chunk.plannedMinutes).toBe(40);
  });

  it('gives the gap before an event to a shorter chunk that fits, without splitting anything', () => {
    const chunks = [
      task('long', 'writing', 'meh', 40, { dueAt: dueIn(1), pinned: true }),
      task('short', 'problems', 'dreading', 20),
    ];
    const { day } = scheduleDay(dayOf(chunks), bed(23), NOW, {}, null, [
      event('Club', [16, 25], [17, 0]),
    ]);
    expect(day.chunks.map((c) => [c.assignmentId, clock(c.scheduledStart), clock(c.scheduledEnd)])).toEqual([
      ['short', '16:00', '16:20'],
      ['long', '17:00', '17:40'],
    ]);
  });

  it('never runs a later chunk of a task ahead of an earlier one to fill a gap', () => {
    const chunks = [
      task('x', 'reading', 'dreading', 40, { index: 1 }),
      task('x', 'reading', 'dreading', 20, { index: 2 }),
    ];
    const { day } = scheduleDay(dayOf(chunks), bed(23), NOW, {}, null, [
      event('Club', [16, 25], [17, 0]),
    ]);
    expect(day.chunks.map((c) => [c.index, clock(c.scheduledStart)])).toEqual([
      [1, '17:00'],
      [2, '17:45'], // after the usual in-batch break
    ]);
  });

  it('treats overlapping events as one busy block', () => {
    const { day } = scheduleDay(dayOf([task('a', 'reading', 'dreading', 30)]), bed(23), NOW, {}, null, [
      event('Practice', [16, 0], [17, 0]),
      event('Ride home', [16, 45], [17, 30]),
    ]);
    expect(clock(day.chunks[0].scheduledStart)).toBe('17:30');
  });

  it('ignores all-day events', () => {
    const chunks = [task('a', 'reading', 'dreading', 30), task('b', 'writing', 'dreading', 30)];
    const without = scheduleDay(dayOf(chunks), bed(23), NOW).day;
    const allDay: DayEvent = { ...event('Spirit week', [0, 0], [0, 0]), end: new Date(2026, 8, 15), allDay: true };
    const withIt = scheduleDay(dayOf(chunks), bed(23), NOW, {}, null, [allDay]).day;
    expect(withIt.chunks.map(span)).toEqual(without.chunks.map(span));
    expect(withIt.finishAt).toEqual(without.finishAt);
  });
});

describe('scheduleDay — breaks around events', () => {
  it('never puts a break inside an event', () => {
    const practice = event('Practice', [17, 0], [18, 0]);
    const chunks = ['a', 'b', 'c', 'd', 'e'].map((id, i) =>
      task(id, i % 2 ? 'writing' : 'reading', 'dreading', 25),
    );
    const { day } = scheduleDay(dayOf(chunks), bed(23), NOW, {}, null, [practice]);
    expect(day.breaks.length).toBeGreaterThan(0);
    for (const pause of day.breaks) expect(overlaps(pause, practice)).toBe(false);
  });

  it('lets an event that starts right after a chunk be the break', () => {
    const chunks = [task('a', 'reading', 'dreading', 30), task('b', 'writing', 'dreading', 30)];
    const { day } = scheduleDay(dayOf(chunks), bed(23), NOW, {}, null, [
      event('Practice', [16, 32], [17, 0]),
    ]);
    expect(day.breaks).toEqual([]);
    expect(day.chunks.map((c) => clock(c.scheduledStart))).toEqual(['16:00', '17:00']);
  });
});

describe('scheduleDay — target, finish time, triage', () => {
  const chunks = () => [task('a', 'reading', 'dreading', 30), task('b', 'reading', 'dreading', 30)];

  it('does not count event time against the daily target', () => {
    const { day } = scheduleDay(dayOf(chunks(), 60), bed(23), NOW, {}, null, [
      event('Practice', [16, 0], [18, 0]),
    ]);
    expect(day.loadMinutes).toBe(60);
    expect(day.targetMinutes).toBe(60);
    expect(day.overTargetReason).toBeNull();
    expect(day.chunks).toHaveLength(2);
  });

  it('includes events in the finish time', () => {
    const without = scheduleDay(dayOf(chunks()), bed(23), NOW).day;
    const withIt = scheduleDay(dayOf(chunks()), bed(23), NOW, {}, null, [
      event('Practice', [16, 30], [17, 30]),
    ]).day;
    // The hour of practice, less the 5-minute break it stands in for.
    expect(withIt.workEnd.getTime() - without.workEnd.getTime()).toBe(55 * 60_000);
    expect(clock(withIt.workEnd)).toBe('18:00');
    expect(withIt.finishAt.getTime()).toBeGreaterThan(without.finishAt.getTime());
  });

  it('defers work crowded out by events, and names the event', () => {
    // Bedtime 7:00, so nothing past 6:30. Without practice it all fits.
    const day = dayOf([
      task('math', 'problems', 'dreading', 30, { dueAt: dueIn(1), pinned: true }),
      task('hist', 'reading', 'dreading', 60, { dueAt: dueIn(4) }),
    ]);
    expect(scheduleDay(day, bed(19), NOW).deferred).toEqual([]);

    const result = scheduleDay(day, bed(19), NOW, {}, null, [event('Practice', [16, 0], [18, 0])]);
    expect(result.deferred.map((c) => c.assignmentId)).toEqual(['hist']);
    expect(result.crowdedBy).toBe('Practice');
    expect(result.day.chunks.map((c) => [c.assignmentId, clock(c.scheduledStart)])).toEqual([
      ['math', '18:00'],
    ]);
  });

  it('does not blame events when the work would not have fit anyway', () => {
    const day = dayOf([
      task('math', 'problems', 'dreading', 30, { dueAt: dueIn(1), pinned: true }),
      task('hist', 'reading', 'dreading', 180, { dueAt: dueIn(4) }),
    ]);
    const result = scheduleDay(day, bed(19), NOW, {}, null, [event('Practice', [16, 0], [16, 30])]);
    expect(result.deferred.map((c) => c.assignmentId)).toEqual(['hist']);
    expect(result.crowdedBy).toBeNull();
  });

  it('falls back to urgent triage when events leave no room for work due tomorrow', () => {
    const day = dayOf([
      task('lab', 'writing', 'dreading', 45, { index: 1, dueAt: dueIn(0, 23), pinned: true }),
      task('lab', 'writing', 'dreading', 45, { index: 2, dueAt: dueIn(0, 23), pinned: true }),
    ]);
    const result = scheduleDay(day, bed(19), NOW, {}, null, [event('Game', [16, 0], [19, 30])]);
    expect(result.urgentTriage?.letGo).toEqual(['lab']);
  });
});

describe('scheduleDay — a running chunk', () => {
  it('is never interrupted by an event; what follows re-plans around it', () => {
    const chunks = [task('a', 'reading', 'dreading', 30), task('b', 'reading', 'dreading', 30)];
    const { day } = scheduleDay(
      dayOf(chunks),
      bed(23),
      NOW,
      { active: { assignmentId: 'a', index: 1, startedAt: new Date(2026, 8, 14, 15, 50) } },
      null,
      [event('Practice', [16, 10], [17, 0])],
    );
    expect(day.chunks.map((c) => [c.assignmentId, clock(c.scheduledStart), clock(c.scheduledEnd)])).toEqual([
      ['a', '15:50', '16:20'],
      ['b', '17:00', '17:30'],
    ]);
  });
});
