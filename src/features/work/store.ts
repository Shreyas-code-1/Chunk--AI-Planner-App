/**
 * The work the student has added, and the chunks they have finished.
 *
 * This is the seam Supabase replaces. `src/api` is the only place allowed to
 * talk to Supabase, and nothing is signed in yet — 2.19 accepts any code
 * without creating a session — so until auth is real the app needs somewhere
 * to keep work, and this is it. Same shape as the onboarding draft and the
 * same trade: **it is memory only.** Reloading the bundler loses it.
 *
 * The rows deliberately mirror the planner's `Assignment` rather than the
 * screens' needs, so `toPlannerAssignments` is a rename and not a translation,
 * and so the Supabase tables can take the same shape when they arrive.
 *
 * TODO(batch 6): move to `assignments` and `chunk_completions` through
 * `src/api`, with TanStack Query holding it. `chunk_completions` is
 * append-only by policy, which is why completions here are only ever added.
 */

import { create } from 'zustand';

import type { Assignment, Difficulty } from '../../planner/types';

export type WorkAssignment = {
  id: string;
  title: string;
  /** The class name, which is what the chips and the planner both key on. */
  className: string | null;
  /** End of the due day, local. The planner only reads the day out of it. */
  dueAt: Date;
  minutes: number | null;
  difficulty: Difficulty | null;
  notes: string;
  addedAt: Date;
};

export type Completion = {
  assignmentId: string;
  /** `${assignmentId}:${index}`, matching the planner's chunk identity. */
  chunkKey: string;
  minutes: number;
  at: Date;
};

type WorkState = {
  assignments: WorkAssignment[];
  completions: Completion[];
  addAssignment(input: Omit<WorkAssignment, 'id' | 'addedAt'>): WorkAssignment;
  removeAssignment(id: string): void;
  completeChunk(entry: Omit<Completion, 'at'>): void;
  reset(): void;
};

/** Good enough for a memory store; the database generates the real ones. */
const newId = () => `a${Date.now().toString(36)}${Math.random().toString(36).slice(2, 7)}`;

export const useWork = create<WorkState>((set) => ({
  assignments: [],
  completions: [],

  addAssignment(input) {
    const assignment: WorkAssignment = { ...input, id: newId(), addedAt: new Date() };
    set((state) => ({ assignments: [...state.assignments, assignment] }));
    return assignment;
  },

  removeAssignment(id) {
    set((state) => ({
      assignments: state.assignments.filter((entry) => entry.id !== id),
      completions: state.completions.filter((entry) => entry.assignmentId !== id),
    }));
  },

  completeChunk(entry) {
    set((state) =>
      // Append-only, and idempotent: finishing the same chunk twice must not
      // inflate the lifetime count, which is the whole point of the policy on
      // `chunk_completions`.
      state.completions.some((done) => done.chunkKey === entry.chunkKey)
        ? state
        : { completions: [...state.completions, { ...entry, at: new Date() }] },
    );
  },

  reset() {
    set({ assignments: [], completions: [] });
  },
}));

/** The planner's view of the same rows. A rename, not a translation. */
export function toPlannerAssignments(assignments: WorkAssignment[]): Assignment[] {
  return assignments.map((entry) => ({
    id: entry.id,
    classId: entry.className,
    title: entry.title,
    dueAt: entry.dueAt,
    minutes: entry.minutes,
    difficulty: entry.difficulty,
    source: 'typed' as const,
  }));
}
