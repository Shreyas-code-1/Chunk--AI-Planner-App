import { FIRST_ACTIONS, firstActionFor, inferMode, nextMode } from '../mode';
import { plan } from '../plan';
import { assignment, dueIn, noHistory, NOW, prefs } from './fixtures';

describe('inferMode', () => {
  it.each([
    ['Chapter 5 problem set', null, 'problems'],
    ['Worksheet 3', 'Biology', 'problems'],
    ['Lab report', 'Chemistry', 'writing'],
    ['Persuasive essay draft', 'English', 'writing'],
    ['Read pages 88-94', 'Biology', 'reading'],
    ['Unit 4 vocab', 'Spanish', 'memorizing'],
    ['Quizlet terms', null, 'memorizing'],
  ] as const)('%s (%s) is %s', (title, className, mode) => {
    expect(inferMode(title, className)).toBe(mode);
  });

  it('defaults by class family when nothing matches', () => {
    expect(inferMode('Unit 3', 'AP Calculus')).toBe('problems');
    expect(inferMode('Unit 3', 'US History')).toBe('reading');
  });
});

describe('first actions', () => {
  it('uses the mode default unless the student wrote one', () => {
    expect(firstActionFor('writing', null)).toBe(FIRST_ACTIONS.writing);
    expect(firstActionFor('writing', '  ')).toBe(FIRST_ACTIONS.writing);
    expect(firstActionFor('writing', 'Open the doc')).toBe('Open the doc');
  });

  it('cycles the four modes', () => {
    expect(nextMode('problems')).toBe('writing');
    expect(nextMode('memorizing')).toBe('problems');
  });
});

describe('plan — bedtime rolls work to the next day', () => {
  it('defers movable work and reports it', () => {
    // 4 PM start, bedtime 7 PM: 150 min to the cutoff, ~128 after the buffer.
    // x (105 min, due tomorrow) must stay tonight; y's chunk can move.
    const result = plan(
      [
        assignment({ id: 'x', minutes: 100, dueAt: dueIn(1), mode: 'writing' }),
        assignment({ id: 'y', minutes: 55, dueAt: dueIn(3), difficulty: 'hard' }),
      ],
      prefs({ bedtime: 19 * 60, dailyTargetMinutes: 400 }),
      noHistory,
      NOW,
    );
    const today = result.days[0];
    expect(today.chunks.every((c) => c.assignmentId === 'x')).toBe(true);
    expect(result.deferrals.map((d) => d.assignmentId)).toEqual(['y']);
    expect(today.bedtimeOverrun).toBeNull();
  });
});
