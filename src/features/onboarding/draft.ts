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

import type { ChunkLengthPref, Goal, StartStyle } from '../../api/types';

/** A class as 2.5 collects it, before it has a row or an id. */
export type DraftClass = {
  name: string;
  /** Both optional on the board's "Add a class" form and nullable in the schema. */
  period?: string;
  teacher?: string;
};

/** 2.6 BEST TIME OF DAY offers five fixed times, in minutes from midnight. */
export const BEST_TIMES = [
  { minutes: 360, label: '6 AM' },
  { minutes: 720, label: 'NOON' },
  { minutes: 960, label: '4 PM' },
  { minutes: 1200, label: '8 PM' },
  { minutes: 1380, label: '11 PM' },
] as const;

/**
 * Daily study target bounds, shared by 2.6's TIME A DAY slider and 2.10's
 * DAILY PACE slider — the two screens set the same value, so they must agree
 * on its range. The schema permits 15-600; onboarding offers 30 min to 3 hr,
 * which is what 2.10 labels its track with.
 */
export const DAILY_MIN = 30;
export const DAILY_MAX = 180;
export const DAILY_STEP = 15;

/** 2.9 WHAT GOES WRONG. No column stores this yet — see the screen. */
export type Struggle = 'forget' | 'start_late' | 'distracted' | 'where_to_begin';

/** 2.7 cycles each day through these. Values are WEEKDAY_FACTORS' three steps. */
export type DayLoad = 'light' | 'normal' | 'busy';

/**
 * Answers that have a pre-filled value, so "has a value" can't tell us whether
 * the user actually chose it. A screen's CONTINUE stays disabled until its
 * keys are here.
 */
export type AnswerKey = 'chunkLength' | 'bestTime' | 'week' | 'startStyle' | 'dailyPace';

type DraftState = {
  goals: Goal[];
  displayName: string;
  grade: number | null;
  birthYear: number | null;
  classes: DraftClass[];

  chunkLength: ChunkLengthPref;
  /** Index into BEST_TIMES. */
  bestTime: number;
  dailyMinutes: number;
  /** Sunday..Saturday, matching preferences.weekday_factors. */
  weekLoad: DayLoad[];
  startStyle: StartStyle;
  struggle: Struggle | null;
  answered: Partial<Record<AnswerKey, true>>;

  markAnswered(key: AnswerKey): void;
  toggleGoal(goal: Goal): void;
  setName(name: string): void;
  setGrade(grade: number): void;
  setBirthYear(year: number | null): void;
  addClass(entry: DraftClass): void;
  removeClass(index: number): void;

  setChunkLength(value: ChunkLengthPref): void;
  setBestTime(index: number): void;
  setDailyMinutes(minutes: number): void;
  cycleDay(index: number): void;
  setStartStyle(value: StartStyle): void;
  setStruggle(value: Struggle): void;

  reset(): void;
};

const NEXT_LOAD: Record<DayLoad, DayLoad> = {
  light: 'normal',
  normal: 'busy',
  busy: 'light',
};

const EMPTY = {
  goals: [] as Goal[],
  displayName: '',
  grade: null,
  birthYear: null,
  classes: [] as DraftClass[],
  chunkLength: 'mixed' as ChunkLengthPref,
  // 4 PM, which is the option the board draws selected.
  bestTime: 2,
  dailyMinutes: 90,
  weekLoad: ['normal', 'normal', 'normal', 'normal', 'normal', 'normal', 'normal'] as DayLoad[],
  startStyle: 'few_days' as StartStyle,
  struggle: null,
  answered: {} as Partial<Record<AnswerKey, true>>,
};

const answer = (key: AnswerKey) => (state: DraftState) => ({
  answered: { ...state.answered, [key]: true as const },
});

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

  markAnswered: (key) => set(answer(key)),

  setChunkLength: (chunkLength) => set((s) => ({ chunkLength, ...answer('chunkLength')(s) })),
  setBestTime: (bestTime) => set((s) => ({ bestTime, ...answer('bestTime')(s) })),
  setDailyMinutes: (dailyMinutes) => set({ dailyMinutes }),
  setStartStyle: (startStyle) => set((s) => ({ startStyle, ...answer('startStyle')(s) })),
  setStruggle: (struggle) => set({ struggle }),

  cycleDay: (index) =>
    set((state) => ({
      weekLoad: state.weekLoad.map((load, i) => (i === index ? NEXT_LOAD[load] : load)),
      ...answer('week')(state),
    })),

  reset: () => set(EMPTY),
}));
