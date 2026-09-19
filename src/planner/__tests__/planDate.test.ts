/**
 * The 03:00 plan-day boundary.
 *
 * This is the single most load-bearing helper in the app: the scheduler and
 * the streak both read it, and if they disagree about which day a chunk
 * belongs to, the streak breaks on a day the student actually worked.
 */

import {
  DAY_CUTOFF_HOUR,
  addDays,
  daysBetween,
  daysInRange,
  planDateOf,
  toDateKey,
  weekdayOf,
} from '../../lib/planDate';

describe('planDateOf', () => {
  it('counts work after midnight as the previous day', () => {
    // 00:30 on the 14th is still the 13th's plan day.
    expect(planDateOf(new Date(2026, 8, 14, 0, 30))).toBe('2026-09-13');
  });

  it('rolls over at 03:00, not midnight', () => {
    expect(planDateOf(new Date(2026, 8, 14, 2, 59))).toBe('2026-09-13');
    expect(planDateOf(new Date(2026, 8, 14, 3, 0))).toBe('2026-09-14');
  });

  it('leaves daytime work on its own date', () => {
    expect(planDateOf(new Date(2026, 8, 14, 16, 0))).toBe('2026-09-14');
    expect(planDateOf(new Date(2026, 8, 14, 23, 59))).toBe('2026-09-14');
  });

  it('crosses a month boundary backwards', () => {
    expect(planDateOf(new Date(2026, 9, 1, 1, 0))).toBe('2026-09-30');
  });

  it('uses 3 as the default cutoff', () => {
    expect(DAY_CUTOFF_HOUR).toBe(3);
  });

  it('honours a different cutoff when one is given', () => {
    expect(planDateOf(new Date(2026, 8, 14, 1, 0), 0)).toBe('2026-09-14');
  });
});

describe('date-key arithmetic', () => {
  it('adds and subtracts days across a month boundary', () => {
    expect(addDays('2026-09-30', 1)).toBe('2026-10-01');
    expect(addDays('2026-10-01', -1)).toBe('2026-09-30');
  });

  it('measures whole days between keys', () => {
    expect(daysBetween('2026-09-14', '2026-09-19')).toBe(5);
    expect(daysBetween('2026-09-19', '2026-09-14')).toBe(-5);
    expect(daysBetween('2026-09-14', '2026-09-14')).toBe(0);
  });

  it('survives a daylight-saving transition', () => {
    // US DST ends 1 November 2026; that day is 25 hours long.
    expect(daysBetween('2026-10-31', '2026-11-02')).toBe(2);
    expect(addDays('2026-10-31', 2)).toBe('2026-11-02');
  });

  it('lists an inclusive range, and nothing for a backwards one', () => {
    expect(daysInRange('2026-09-14', '2026-09-16')).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
    ]);
    expect(daysInRange('2026-09-16', '2026-09-14')).toEqual([]);
  });

  it('round-trips a Date through a key', () => {
    expect(toDateKey(new Date(2026, 8, 14, 22, 15))).toBe('2026-09-14');
  });

  it('reports the weekday for the load factors', () => {
    expect(weekdayOf('2026-09-14')).toBe(1); // a Monday
  });
});
