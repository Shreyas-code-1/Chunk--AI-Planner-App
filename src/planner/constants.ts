/**
 * Every tunable number the planner uses, in one place.
 *
 * These are product decisions, not implementation details. When one changes it
 * changes here and nowhere else, and the reason goes in docs/decision-log.md.
 */

import type { ChunkLengthPref, Difficulty, StartStyle, WeekdayFactors } from './types';

/** Target chunk length in minutes, from screen 2.6. */
export const TARGET_MINUTES: Record<ChunkLengthPref, number> = {
  short: 20,
  mixed: 30,
  long: 50,
};

/**
 * Difficulty scales the target: harder work gets shorter chunks.
 *
 * Note what "mixed" does and does not mean. Screen 2.6 labels it "20-45", which
 * reads like a range, but it is not randomness. Mixed is a 30-minute target,
 * and the label describes the span the difficulty adjustment produces across
 * assignments: easy 34, medium 30, hard 24. Chunk lengths never vary randomly
 * within one assignment.
 */
export const DIFFICULTY_ADJUST: Record<Difficulty, number> = {
  easy: 1.15,
  medium: 1.0,
  hard: 0.8,
};

/**
 * A chunk must be finishable in one sitting — that is the entire mechanism, so
 * the upper bound is hard (algorithm spec, display rule 5).
 */
export const MIN_CHUNK_MINUTES = 12;
export const MAX_CHUNK_MINUTES = 55;

/** Most chunks an assignment can be cut into, however large it is. */
export const MAX_CHUNKS_PER_ASSIGNMENT = 12;

/** Used when an assignment has no duration and its class has no history. */
export const DEFAULT_ASSIGNMENT_MINUTES = 45;

/** A class needs this many completions before its median is worth trusting. */
export const MIN_SAMPLES_FOR_MEDIAN = 3;

/**
 * Multipliers on dailyTargetMinutes, from screen 2.6b YOUR WEEK.
 *
 * These are a guess. Tune them against real completion data before trusting
 * them — no student behaviour has informed these numbers yet. The schema
 * default in supabase/migrations/0001_init.sql mirrors this shape.
 */
export const WEEKDAY_FACTORS = { busy: 0.4, normal: 1.0, light: 1.3 } as const;

/** A week of "normal" days, used until the student sets 2.6b. */
export const DEFAULT_WEEKDAY_FACTORS: WeekdayFactors = [1, 1, 1, 1, 1, 1, 1];

/**
 * How many days before the due date the spread may begin (screen 2.6c).
 *
 * This narrows the window; it never overrides the rule that nothing is ever
 * scheduled on the night a thing is due. Even 'day_before' means the day
 * before the due date, not the due date itself.
 */
export const START_STYLE_WINDOW_DAYS: Record<StartStyle, number | 'all'> = {
  asap: 'all',
  few_days: 3,
  day_before: 1,
};

/** A break after this many consecutive chunks, and how long it lasts. */
export const CHUNKS_BETWEEN_BREAKS = 2;
export const BREAK_MINUTES = 10;

/**
 * A re-plan that would move a chunk by less than this leaves it alone. A
 * schedule that rearranges itself constantly is one nobody trusts.
 */
export const REPLAN_MIN_SHIFT_MINUTES = 15;
