/**
 * The onboarding draft.
 *
 * Sign-up lives in batch 3, so there is no authenticated user while 2.3, 2.4
 * and 2.5 are on screen — and every table those screens feed (`profiles`,
 * `preferences`, `classes`) is RLS-scoped to `auth.uid()`. Writing as we go is
 * impossible, not merely inconvenient.
 *
 * So the answers accumulate here and are flushed in one go once a session
 * exists. That is also the right shape independent of the ordering: someone
 * who abandons onboarding at 2.5 should not leave a half-written profile row
 * behind for the next screen to reason about.
 *
 * This is the user's own input held in memory, not fixtures — §9.1's ban on
 * mock data in committed code is about invented content, and there is none
 * here.
 *
 * Not persisted: killing the app mid-onboarding loses the answers and starts
 * the flow again. For eight screens that is an acceptable v1 trade, and it is
 * recorded as such in docs/decision-log.md. If it proves annoying, this store
 * gains a SecureStore backing and no screen changes.
 */

import { create } from 'zustand';

import type { Goal } from '../../api/types';

/** A class as 2.5 collects it, before it has a row or an id. */
export type DraftClass = {
  name: string;
  /** Both optional on the board's "Add a class" form and nullable in the schema. */
  period?: string;
  teacher?: string;
};

type DraftState = {
  goals: Goal[];
  displayName: string;
  grade: number | null;
  birthYear: number | null;
  classes: DraftClass[];

  toggleGoal(goal: Goal): void;
  setName(name: string): void;
  setGrade(grade: number): void;
  setBirthYear(year: number | null): void;
  addClass(entry: DraftClass): void;
  removeClass(index: number): void;
  reset(): void;
};

const EMPTY = {
  goals: [] as Goal[],
  displayName: '',
  grade: null,
  birthYear: null,
  classes: [] as DraftClass[],
};

export const useDraft = create<DraftState>((set) => ({
  ...EMPTY,

  toggleGoal: (goal) =>
    set((state) => ({
      goals: state.goals.includes(goal)
        ? state.goals.filter((g) => g !== goal)
        : // Appended rather than sorted, so the array records the order they
          // were chosen in. `profiles.goals` is a goal[] and preserves it.
          [...state.goals, goal],
    })),

  setName: (displayName) => set({ displayName }),
  setGrade: (grade) => set({ grade }),
  setBirthYear: (birthYear) => set({ birthYear }),

  addClass: (entry) => set((state) => ({ classes: [...state.classes, entry] })),
  removeClass: (index) =>
    set((state) => ({ classes: state.classes.filter((_, i) => i !== index) })),

  reset: () => set(EMPTY),
}));
