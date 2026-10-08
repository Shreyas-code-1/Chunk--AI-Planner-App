import { deferralLine } from '../copy';
import { eventProblem } from '../validate';
import type { EventInput } from '../store';

jest.mock('expo-crypto', () => ({ randomUUID: () => 'id' }));

const input = (overrides: Partial<EventInput> = {}): EventInput => ({
  title: 'Soccer practice',
  note: '',
  date: '2026-10-06',
  startMinutes: 16 * 60,
  endMinutes: 17 * 60 + 30,
  allDay: false,
  repeat: { freq: 'none' },
  end: { kind: 'never' },
  ...overrides,
});

describe('eventProblem', () => {
  it('accepts a complete event', () => {
    expect(eventProblem(input())).toBeNull();
  });

  it('needs a title', () => {
    expect(eventProblem(input({ title: '  ' }))).toBe('Give it a name so you recognise it later.');
  });

  it('needs the end after the start, unless it is all day', () => {
    expect(eventProblem(input({ endMinutes: 16 * 60 }))).toBe('End time needs to be after the start time.');
    expect(eventProblem(input({ endMinutes: 15 * 60 }))).toBe('End time needs to be after the start time.');
    expect(eventProblem(input({ endMinutes: 15 * 60, allDay: true }))).toBeNull();
  });

  it('needs weekdays for a weekly repeat and a sensible interval', () => {
    expect(eventProblem(input({ repeat: { freq: 'weekly', interval: 1, weekdays: [] } }))).toBe(
      'Pick at least one day for it to repeat on.',
    );
    expect(eventProblem(input({ repeat: { freq: 'daily', interval: 0 } }))).toMatch(/How often/);
    expect(eventProblem(input({ repeat: { freq: 'daily', interval: 1.5 } }))).toMatch(/How often/);
  });

  it('checks the repeat end', () => {
    const daily = { freq: 'daily', interval: 1 } as const;
    expect(eventProblem(input({ repeat: daily, end: { kind: 'on', date: '2026-10-05' } }))).toBe(
      'The repeat needs to end on or after the first day.',
    );
    expect(eventProblem(input({ repeat: daily, end: { kind: 'after', count: 0 } }))).toBe(
      'It needs to happen at least once.',
    );
    // A one-off ignores its end entirely.
    expect(eventProblem(input({ end: { kind: 'after', count: 0 } }))).toBeNull();
  });
});

describe('deferralLine', () => {
  const today = '2026-09-14'; // Monday
  it('names the event when events crowded the work out', () => {
    expect(
      deferralLine(
        { assignmentId: 'h', fromPlanDate: today, toPlanDate: '2026-09-15', dueAt: new Date(2026, 8, 18, 23, 59), crowdedBy: 'Practice' },
        'History',
        today,
      ),
    ).toBe("Practice takes up most of tonight. I moved History to tomorrow, it's not due until Friday.");
  });

  it('says so plainly when it is just a full evening', () => {
    expect(
      deferralLine(
        { assignmentId: 'h', fromPlanDate: today, toPlanDate: '2026-09-16', dueAt: new Date(2026, 8, 25, 23, 59), crowdedBy: null },
        'History',
        today,
      ),
    ).toBe("Tonight's full. I moved History to Wednesday, it's not due until Friday, Sep 25.");
  });
});
