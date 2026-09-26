/**
 * Work due today or tomorrow must show up today, chunked — never vanish.
 */

import { plan } from '../plan';
import { toDateKey } from '../../lib/planDate';
import { assignment, completedFrom, noHistory, NOW, prefs } from './fixtures';
import type { Plan } from '../types';

const endOfDay = (days: number) => {
  const d = new Date(NOW.getTime());
  d.setDate(d.getDate() + days);
  d.setHours(23, 59, 0, 0);
  return d;
};
const today = toDateKey(NOW);
// The app's real prefs: a 90-minute target and the default bedtime.
const appPrefs = prefs({ dailyTargetMinutes: 90, bedtime: null });

describe('due today', () => {
  it('schedules a two-hour assignment due tonight, in chunks, today', () => {
    const result = plan(
      [assignment({ id: 'x', minutes: 120, dueAt: endOfDay(0) })],
      appPrefs,
      noHistory,
      NOW,
    );
    const chunks = result.days.find((d) => d.planDate === today)?.chunks ?? [];
    expect(chunks.length).toBeGreaterThan(1);
    expect(chunks.reduce((t, c) => t + c.plannedMinutes, 0)).toBeGreaterThanOrEqual(120);
    expect(chunks.every((c) => c.segment === 'dueToday')).toBe(true);
  });

  it('still shows work due tonight when it is already late', () => {
    const late = new Date(NOW.getTime());
    late.setHours(22, 45, 0, 0);
    const result = plan(
      [assignment({ id: 'x', minutes: 90, dueAt: endOfDay(0) })],
      appPrefs,
      noHistory,
      late,
    );
    expect(result.days.flatMap((d) => d.chunks).length).toBeGreaterThan(0);
  });
});

describe('due tomorrow', () => {
  it('schedules everything tonight even when it exceeds the daily target', () => {
    const result = plan(
      [assignment({ id: 'y', minutes: 120, dueAt: endOfDay(1) })],
      appPrefs,
      noHistory,
      NOW,
    );
    const tonight = result.days.find((d) => d.planDate === today)?.chunks ?? [];
    expect(tonight.reduce((t, c) => t + c.plannedMinutes, 0)).toBeGreaterThanOrEqual(120);
  });
});

describe('never silently dropped', () => {
  it('keeps at-risk work on the plan and reports it', () => {
    const result = plan(
      [assignment({ id: 'big', minutes: 600, dueAt: endOfDay(2) })],
      appPrefs,
      noHistory,
      NOW,
    );
    expect(result.atRisk.map((a) => a.id)).toEqual(['big']);
    expect(result.days.flatMap((d) => d.chunks).some((c) => c.assignmentId === 'big')).toBe(true);
  });
});

describe('finished chunks — stable identity', () => {
  const later = new Date(NOW.getTime());
  later.setHours(17, 0, 0, 0);
  const work = (dread: 'meh' | 'dreading' = 'meh') => [
    assignment({ id: 'x', minutes: 120, dueAt: endOfDay(0), dread }),
  ];
  const first = plan(work(), appPrefs, noHistory, NOW).days[0].chunks[0];
  const done = completedFrom(first, later);
  const sum = (p: Plan) =>
    p.days.flatMap((d) => d.chunks).reduce((t, c) => t + c.plannedMinutes, 0);

  it('take no time tonight: what is left is the estimate minus what was completed', () => {
    const result = plan(work(), appPrefs, noHistory, later, [done]);
    expect(result.done.map((c) => c.completion.id)).toEqual([done.id]);
    expect(sum(result)).toBe(120 - first.plannedMinutes);
    const scheduled = result.days.flatMap((d) => d.chunks);
    expect(scheduled[0].index).toBe(2);
    // The rest starts now, not after a phantom copy of the finished chunk.
    expect(scheduled[0].scheduledStart.getHours()).toBe(17);
  });

  it('stay attached to what was actually done when the task is re-cut', () => {
    // Changing dread re-cuts the task. The completion is a record, not a
    // position, so it keeps its own minutes and the remainder follows it.
    const result = plan(work('dreading'), appPrefs, noHistory, later, [done]);
    expect(result.done).toHaveLength(1);
    expect(result.done[0].plannedMinutes).toBe(first.plannedMinutes);
    expect(sum(result)).toBe(120 - first.plannedMinutes);
  });

  it('leave nothing to schedule once completions cover the estimate', () => {
    const big = { ...done, plannedMinutes: 120 };
    expect(plan(work(), appPrefs, noHistory, later, [big]).days).toHaveLength(0);
  });

  it('keep the running chunk as snapshotted, first tonight, through a re-cut', () => {
    const running = { assignmentId: 'x', title: 'Snapshot', plannedMinutes: 25, startedAt: later };
    const result = plan(work('dreading'), appPrefs, noHistory, later, [], running);
    const tonight = result.days[0].chunks;
    expect(tonight[0]).toMatchObject({ title: 'Snapshot', plannedMinutes: 25, index: 1 });
    expect(sum(result)).toBe(120);
  });
});

describe('a crowded night', () => {
  it('moves work due tomorrow to tomorrow before bending bedtime for work due tonight', () => {
    const late = new Date(NOW.getTime());
    late.setHours(21, 50, 0, 0);
    const result = plan(
      [
        assignment({ id: 'essay', minutes: 120, dueAt: endOfDay(0), mode: 'writing' }),
        assignment({ id: 'pset', minutes: 60, dueAt: endOfDay(1), mode: 'problems' }),
      ],
      appPrefs,
      noHistory,
      late,
    );
    const tonight = result.days.find((d) => d.planDate === today)?.chunks ?? [];
    expect(tonight.every((c) => c.assignmentId === 'essay')).toBe(true);
    expect(tonight[0].assignmentId).toBe('essay');
    expect(result.deferrals.map((d) => d.assignmentId)).toEqual(['pset']);
    const tomorrow = result.days.find((d) => d.planDate !== today)?.chunks ?? [];
    expect(tomorrow.some((c) => c.assignmentId === 'pset')).toBe(true);
  });
});
