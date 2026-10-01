import { z } from 'zod';
import { ONBOARDING_STEPS, useDraft } from '../onboarding/draft';
import { useWork } from '../work/store';

const date = z.iso.datetime().transform(value => new Date(value));
const id = z.string().min(1);
const dread = z.enum(['fine', 'meh', 'dreading']);
const mode = z.enum(['problems', 'writing', 'reading', 'memorizing']);
export const snapshotSchema = z.object({
  version: z.literal(1),
  draft: z.object({
    completed: z.boolean().default(false),
    lastStep: z.string().nullable().transform(value => ONBOARDING_STEPS.includes(value as typeof ONBOARDING_STEPS[number]) ? value as typeof ONBOARDING_STEPS[number] : value === null ? null : '/vs-alone'),
    goals: z.array(z.enum(['get_started', 'stay_organized', 'hit_deadlines', 'study_for_tests', 'focus_longer'])),
    displayName: z.string(), grade: z.number().int().nullable(), birthYear: z.number().int().nullable(),
    classes: z.array(z.object({ id: z.uuid().optional(), name: z.string(), period: z.string().optional(), teacher: z.string().optional() })),
    chunkLength: z.enum(['short', 'mixed', 'long']), bestTime: z.number().int().min(0).max(4),
    dailyMinutes: z.number().min(15).max(600),
    weekLoad: z.array(z.enum(['light', 'normal', 'busy'])).length(7),
    startStyle: z.enum(['asap', 'few_days', 'day_before']),
    struggle: z.enum(['forget', 'start_late', 'distracted', 'where_to_begin']).nullable(),
    answered: z.object({ chunkLength: z.literal(true).optional(), bestTime: z.literal(true).optional(), week: z.literal(true).optional(), startStyle: z.literal(true).optional(), dailyPace: z.literal(true).optional() }),
  }),
  work: z.object({
    assignments: z.array(z.object({ id, title: z.string(), className: z.string().nullable(), dueAt: date,
      minutes: z.number().nonnegative().nullable(), dread: dread.nullable(), notes: z.string(), mode,
      firstAction: z.string().nullable(), addedAt: date })),
    completions: z.array(z.object({ id, assignmentId: id, title: z.string(), plannedMinutes: z.number().nonnegative(),
      actualMinutes: z.number().nonnegative(), startedAt: date, endedAt: date, mode, dread, firstChunk: z.boolean() })),
    abandoned: z.array(z.object({ id, assignmentId: id, dread, firstChunk: z.boolean(), startedAt: date })),
    keptForLater: z.array(z.string()),
  }),
});

// Explicit projection: never serialize active timers, generated chunks/plans, or store actions.
export function encodeSnapshot(): string {
  const { completed, lastStep, goals, displayName, grade, birthYear, classes, chunkLength, bestTime, dailyMinutes, weekLoad, startStyle, struggle, answered } = useDraft.getState();
  const { assignments, completions, abandoned, keptForLater } = useWork.getState();
  return JSON.stringify({ version: 1,
    draft: { completed, lastStep, goals, displayName, grade, birthYear, classes, chunkLength, bestTime, dailyMinutes, weekLoad, startStyle, struggle, answered },
    work: { assignments, completions, abandoned, keptForLater },
  });
}
export function hydrateSnapshot(raw: string) {
  // Validate everything before updating either store; malformed dates never reach the planner.
  const data = snapshotSchema.parse(JSON.parse(raw));
  useDraft.setState(data.draft);
  useWork.setState({ ...data.work, active: null });
}
