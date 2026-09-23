import { badges, clockLabel, hoursLabel, week, weekStart } from '../progress';

const at = (y: number, m: number, d: number, h = 18) => new Date(y, m - 1, d, h);

describe('progress', () => {
  it('starts the week on Monday', () => {
    expect(weekStart('2026-09-23')).toBe('2026-09-21'); // Wed -> Mon
    expect(weekStart('2026-09-27')).toBe('2026-09-21'); // Sun -> Mon
  });

  it('sums minutes per day and marks today and the future', () => {
    const days = week(
      [
        { assignmentId: 'a', chunkKey: 'a:1', minutes: 30, at: at(2026, 9, 21) },
        { assignmentId: 'a', chunkKey: 'a:2', minutes: 20, at: at(2026, 9, 21) },
      ],
      '2026-09-22',
    );
    expect(days[0].minutes).toBe(50);
    expect(days[1].isToday).toBe(true);
    expect(days[2].isFuture).toBe(true);
  });

  it('formats the board labels', () => {
    expect(hoursLabel(380)).toBe('6 hr 20');
    expect(hoursLabel(45)).toBe('45 min');
    expect(clockLabel(155)).toBe('2:35');
  });

  it('earns badges by their rules', () => {
    const list = badges({ allTimeChunks: 1, streak: 1, onTime: 0, longestMinutes: 55 });
    expect(list.filter((b) => b.earned).map((b) => b.key)).toEqual(['first', 'deep']);
  });
});
