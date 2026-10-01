import {
  durationLabel,
  focusedMinutes,
  hoursByMonth,
  hoursShortLabel,
  onTimeSummary,
} from '../progress';
import type { Completion, WorkAssignment } from '../store';

const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h);

const done = (assignmentId: string, minutes: number, endedAt: Date): Completion => ({
  id: `${assignmentId}-${endedAt.getTime()}`,
  assignmentId,
  title: 'Task',
  plannedMinutes: minutes,
  actualMinutes: minutes,
  startedAt: new Date(endedAt.getTime() - minutes * 60_000),
  endedAt,
  mode: 'reading',
  dread: 'meh',
  firstChunk: false,
});

const task = (id: string, dueAt: Date): WorkAssignment => ({
  id,
  title: id,
  className: null,
  dueAt,
  minutes: 60,
  dread: null,
  notes: '',
  mode: 'reading',
  firstAction: null,
  addedAt: at(2026, 9, 1),
});

describe('v3 progress numbers', () => {
  it('formats durations the way the designs do', () => {
    expect(durationLabel(3700)).toBe('61 hr 40 min');
    expect(durationLabel(120)).toBe('2 hr');
    expect(durationLabel(0)).toBe('0 min');
    expect(hoursShortLabel(3700)).toBe('61 hr');
    expect(hoursShortLabel(40)).toBe('40 min');
  });

  it('totals focused minutes', () => {
    expect(focusedMinutes([done('a', 25, at(2026, 9, 1)), done('a', 30, at(2026, 9, 2))])).toBe(55);
  });

  it('buckets hours into the last five months, across a year boundary', () => {
    const bars = hoursByMonth(
      [done('a', 90, at(2026, 2, 10)), done('a', 30, at(2025, 12, 5)), done('a', 600, at(2025, 9, 1))],
      '2026-02-14',
    );
    expect(bars.map((b) => b.label)).toEqual(['Oct', 'Nov', 'Dec', 'Jan', 'Feb']);
    expect(bars.map((b) => b.hours)).toEqual([0, 0, 0.5, 0, 1.5]);
    expect(bars[4].isCurrent).toBe(true);
  });

  it('counts on-time work out of finished or overdue work', () => {
    const now = at(2026, 9, 20);
    const assignments = [
      task('early', at(2026, 9, 10)), // finished before due
      task('late', at(2026, 9, 10)), // finished after due
      task('overdue', at(2026, 9, 15)), // not finished, past due
      task('future', at(2026, 9, 30)), // not finished, not due: ignored
    ];
    const completions = [done('early', 30, at(2026, 9, 9)), done('late', 30, at(2026, 9, 12))];
    const chunks = new Map([['early', 1], ['late', 1], ['overdue', 2], ['future', 2]]);
    expect(onTimeSummary(assignments, completions, chunks, now)).toEqual({ onTime: 1, total: 3 });
  });
});
