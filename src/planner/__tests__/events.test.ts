/**
 * Repeat expansion: a series is stored as a rule and expanded only for the
 * days asked about (docs/events-plan.md, step 3).
 */

import { expandEvents, occurrenceDates, type EventSeries } from '../events';

/** Monday 14 September 2026. */
const MON = '2026-09-14';

const series = (overrides: Partial<EventSeries> = {}): EventSeries => ({
  id: 's1',
  title: 'Soccer practice',
  note: '',
  date: MON,
  startMinutes: 16 * 60,
  endMinutes: 17 * 60 + 30,
  allDay: false,
  repeat: { freq: 'none' },
  end: { kind: 'never' },
  exceptions: {},
  ...overrides,
});

describe('occurrenceDates', () => {
  it('a one-off is on its own day only', () => {
    expect(occurrenceDates(series(), '2026-09-01', '2026-09-30')).toEqual([MON]);
    expect(occurrenceDates(series(), '2026-09-15', '2026-09-30')).toEqual([]);
  });

  it('daily', () => {
    const daily = series({ repeat: { freq: 'daily', interval: 1 } });
    expect(occurrenceDates(daily, '2026-09-12', '2026-09-17')).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
      '2026-09-17',
    ]);
  });

  it('every N days', () => {
    const every3 = series({ repeat: { freq: 'daily', interval: 3 } });
    expect(occurrenceDates(every3, MON, '2026-09-23')).toEqual([
      '2026-09-14',
      '2026-09-17',
      '2026-09-20',
      '2026-09-23',
    ]);
  });

  it('weekly on chosen days, starting from the first matching day', () => {
    // Starts on a Monday but repeats Tuesday and Thursday: Monday itself isn't one.
    const tueThu = series({ repeat: { freq: 'weekly', interval: 1, weekdays: [2, 4] } });
    expect(occurrenceDates(tueThu, MON, '2026-09-27')).toEqual([
      '2026-09-15',
      '2026-09-17',
      '2026-09-22',
      '2026-09-24',
    ]);
  });

  it('every N weeks on chosen days', () => {
    const fortnightly = series({ repeat: { freq: 'weekly', interval: 2, weekdays: [1, 3] } });
    expect(occurrenceDates(fortnightly, MON, '2026-10-11')).toEqual([
      '2026-09-14',
      '2026-09-16',
      '2026-09-28',
      '2026-09-30',
    ]);
  });

  it('a later window of a repeating series lines up with the rule', () => {
    const fortnightly = series({ repeat: { freq: 'weekly', interval: 2, weekdays: [1] } });
    expect(occurrenceDates(fortnightly, '2026-10-01', '2026-10-31')).toEqual([
      '2026-10-12',
      '2026-10-26',
    ]);
  });

  it('ends on a date, inclusive', () => {
    const daily = series({
      repeat: { freq: 'daily', interval: 1 },
      end: { kind: 'on', date: '2026-09-16' },
    });
    expect(occurrenceDates(daily, MON, '2026-09-30')).toEqual([
      '2026-09-14',
      '2026-09-15',
      '2026-09-16',
    ]);
  });

  it('ends after N times, even when asked about a later window', () => {
    const three = series({
      repeat: { freq: 'weekly', interval: 1, weekdays: [2, 4] },
      end: { kind: 'after', count: 3 },
    });
    expect(occurrenceDates(three, MON, '2026-10-31')).toEqual([
      '2026-09-15',
      '2026-09-17',
      '2026-09-22',
    ]);
    expect(occurrenceDates(three, '2026-09-20', '2026-10-31')).toEqual(['2026-09-22']);
  });
});

describe('expandEvents — exceptions', () => {
  const weekly = series({
    repeat: { freq: 'weekly', interval: 1, weekdays: [1] },
    end: { kind: 'after', count: 3 },
  });

  it('a deleted occurrence is gone, and still counts toward "after N times"', () => {
    const out = expandEvents(
      [{ ...weekly, exceptions: { '2026-09-21': { deleted: true } } }],
      MON,
      '2026-12-31',
    );
    expect(out.map((o) => o.occurrenceDate)).toEqual(['2026-09-14', '2026-09-28']);
  });

  it('an edited occurrence changes only that one', () => {
    const out = expandEvents(
      [
        {
          ...weekly,
          exceptions: {
            '2026-09-21': { override: { title: 'Scrimmage', startMinutes: 18 * 60, endMinutes: 20 * 60 } },
          },
        },
      ],
      MON,
      '2026-12-31',
    );
    expect(out.map((o) => [o.title, o.start.getHours(), o.end.getHours()])).toEqual([
      ['Soccer practice', 16, 17],
      ['Scrimmage', 18, 20],
      ['Soccer practice', 16, 17],
    ]);
    expect(out.every((o) => o.repeating)).toBe(true);
  });

  it('an all-day event runs midnight to midnight', () => {
    const [o] = expandEvents([series({ allDay: true })], MON, MON);
    expect(o.allDay).toBe(true);
    expect(o.start).toEqual(new Date(2026, 8, 14));
    expect(o.end).toEqual(new Date(2026, 8, 15));
  });

  it('comes back in time order across series', () => {
    const out = expandEvents(
      [series({ id: 'late', startMinutes: 19 * 60, endMinutes: 20 * 60 }), series({ id: 'early' })],
      MON,
      MON,
    );
    expect(out.map((o) => o.seriesId)).toEqual(['early', 'late']);
  });
});

describe('expandEvents — daylight saving', () => {
  const original = process.env.TZ;
  beforeAll(() => {
    // US clocks fall back on Sunday 1 November 2026.
    process.env.TZ = 'America/Los_Angeles';
  });
  afterAll(() => {
    process.env.TZ = original;
  });

  it('a weekly 4:00 practice stays at 4:00 on both sides of the change', () => {
    const weekly = series({
      date: '2026-10-26',
      repeat: { freq: 'weekly', interval: 1, weekdays: [1] },
    });
    const [before, after] = expandEvents([weekly], '2026-10-26', '2026-11-02');
    // The zone really did change, or this test proves nothing.
    expect(before.start.getTimezoneOffset()).not.toBe(after.start.getTimezoneOffset());
    expect([before.start.getHours(), before.start.getMinutes()]).toEqual([16, 0]);
    expect([after.start.getHours(), after.start.getMinutes()]).toEqual([16, 0]);
    expect(after.occurrenceDate).toBe('2026-11-02');
  });

  it('a daily event keeps its date and time through the change', () => {
    const daily = series({ date: '2026-10-30', repeat: { freq: 'daily', interval: 1 } });
    const out = expandEvents([daily], '2026-10-30', '2026-11-03');
    expect(out.map((o) => [o.start.getDate(), o.start.getHours()])).toEqual([
      [30, 16],
      [31, 16],
      [1, 16],
      [2, 16],
      [3, 16],
    ]);
  });
});
