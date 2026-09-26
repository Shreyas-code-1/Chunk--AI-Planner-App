/**
 * Every tunable number the planner uses, in one place.
 *
 * These are product decisions, not implementation details. When one changes it
 * changes here and nowhere else, and the reason goes in docs/decision-log.md.
 */

import type { ChunkLengthPref, Dread, Mode, StartStyle, WeekdayFactors } from './types';

// ---- Engine v3 (docs/scheduling-engine-v3.md): chunk length and the ramp. ----
// Evidence status is noted on each. Most numbers here are guesses.

/**
 * Base chunk length by the kind of thinking (v3 §3). Load is folded in; it is
 * not a separate multiplier (v3 Q2). GUESS informed by evidence: no interval is
 * optimal; reading sustains ~50 min, writing loses ~10 to warm-up.
 */
export const MODE_BASE_MINUTES: Record<Mode, number> = {
  memorizing: 18,
  problems: 25,
  reading: 40,
  writing: 45,
};

/** 2.6's chunk-length answer, as a multiplier on the mode base (v3 Q1). GUESS. */
export const CHUNK_LENGTH_FACTOR: Record<ChunkLengthPref, number> = {
  short: 0.85,
  mixed: 1.0,
  long: 1.15,
};

/**
 * The first chunk is the commitment, sized by dread (v3 §4). The direction is
 * evidence-based (small commitments, easy-first subtasks for present bias);
 * the numbers are a GUESS.
 */
export const DREAD_FIRST_CHUNK_FACTOR: Record<Dread, number> = {
  fine: 0.85,
  meh: 0.75,
  dreading: 0.55,
};

/** The ramp climbs to this × base (v3 §4). GUESS. */
export const RAMP_TOP_FACTOR = 1.15;

/** Chunks round to this many minutes; drift goes into a middle chunk (v3 §4). */
export const ROUND_TO_MINUTES = 5;

/** Floor for a chunk of a split task, and for a dreaded first chunk (v3 §4). GUESS. */
export const MIN_CHUNK_MINUTES = 12;
export const MIN_DREADED_FIRST_CHUNK_MINUTES = 10;

/**
 * A chunk must be finishable in one sitting — that is the entire mechanism, so
 * the upper bound is hard (algorithm spec, display rule 5; v3 §4).
 */
export const MAX_CHUNK_MINUTES = 55;

/**
 * Chunks longer than this get a short pause at their midpoint (v3 §4).
 * Evidence-based direction (Ariga & Lleras: brief diversions removed the
 * vigilance decrement in a 50-min task); the threshold is a GUESS.
 */
export const PAUSE_OVER_MINUTES = 35;
export const PAUSE_SECONDS = 60;

/** Default dread when the student hasn't said (v3 §1). */
export const DEFAULT_DREAD: Dread = 'meh';

/** Dread levels in rising order, for "most dreaded" and "lowest dread". */
export const DREAD_RANK: Record<Dread, number> = { fine: 0, meh: 1, dreading: 2 };

/** The opener is a first chunk this short or shorter, lowest dread wins (v3 Q5). GUESS. */
export const OPENER_MAX_MINUTES = 20;

/**
 * Per-mode medians need this many completions before they replace the base,
 * and the dread adjustment needs as many dreaded chunks (v3 §9). GUESS.
 */
export const LEARNING_MIN_SAMPLES = 5;

/** Most chunks an assignment can be cut into, however large it is. */
export const MAX_CHUNKS_PER_ASSIGNMENT = 12;

/** Used when an assignment has no duration and its class has no history. */
export const DEFAULT_ASSIGNMENT_MINUTES = 45;

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

// ---- Breaks, bedtime, buffer (v2 §4, kept by v3 §6). ----
// The practice of fixed breaks is evidence-based (less fatigue than
// self-timed ones); every specific interval below is a GUESS.

/** 5 minutes at a batch boundary, and inside a long batch. */
export const SHORT_BREAK_MINUTES = 5;
/** Inside a batch longer than this, breaks come roughly every IN_BATCH_BREAK_EVERY. */
export const IN_BATCH_BREAK_MIN_BATCH = 30;
export const IN_BATCH_BREAK_EVERY = 25;
/** Breaks snap to a chunk boundary within this many minutes. */
export const BREAK_SNAP_MINUTES = 5;
/** A 15-minute break after about 90 minutes of work. */
export const LONG_BREAK_AFTER = 90;
export const LONG_BREAK_MINUTES = 15;

/** Nothing is scheduled later than bedtime minus this. Evidence-based direction (teen sleep loss hurts next-day school); 30 is a GUESS. */
export const BEDTIME_MARGIN_MINUTES = 30;
/**
 * How far past bedtime must-do-tonight work may run. PROVISIONAL: the spec
 * says "up to 60 minutes past it" and its example copy measures from bedtime,
 * so this measures from bedtime, not from the cutoff.
 */
export const BEDTIME_BEND_MAX_MINUTES = 60;
/**
 * PROVISIONAL: used until onboarding asks for a bedtime. 10:30 PM, the spec's
 * example.
 */
export const DEFAULT_BEDTIME = 22 * 60 + 30;
/**
 * Share of the evening left unscheduled as catch-up. The evening is the smaller
 * of the day's target and the bedtime window (v3 Q12). None when something is
 * due today. A guess.
 */
export const BUFFER_FRACTION = 0.15;

/** Tie-break when two batches in a due tier share their earliest deadline (v3 Q6). */
export const MODE_TIE_ORDER: readonly Mode[] = ['problems', 'writing', 'reading', 'memorizing'];

/** Estimate padding for new users (v2 §5 — not built yet). */
export const NEW_USER_PADDING = 1.5;

/**
 * Structure hold: a re-plan does not reorder the evening or move work between
 * days unless the drift behind it is at least this. Clock times are never
 * held — they always show the live schedule (v3, decision log 2026-09-26). GUESS.
 */
export const REPLAN_MIN_SHIFT_MINUTES = 15;

/** Home turns into 5.4 URGENT when unfinished work is due within this (Q16). */
export const URGENT_WITHIN_HOURS = 6;
