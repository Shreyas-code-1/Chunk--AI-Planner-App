/**
 * Types for the chunking and scheduling algorithm.
 *
 * Taken from docs/chunk-algorithm-spec.md. The planner is pure: no I/O, no
 * React, no Supabase. Everything it needs arrives as arguments.
 */

export type Difficulty = 'easy' | 'medium' | 'hard';
export type ChunkLengthPref = 'short' | 'mixed' | 'long';
export type AssignmentSource = 'typed' | 'photo' | 'voice';

/** The kind of thinking a task needs; tonight's work is batched by it (engine v2 §1). */
export type Mode = 'problems' | 'writing' | 'reading' | 'memorizing';

/** How many days before the due date the spread begins (screen 2.6c). */
export type StartStyle = 'asap' | 'few_days' | 'day_before';

/** Sunday..Saturday, matching Date#getDay. */
export type WeekdayFactors = readonly [number, number, number, number, number, number, number];

export type Assignment = {
  id: string;
  classId: string | null;
  title: string;
  /** The only required field. Everything else has a fallback. */
  dueAt: Date;
  minutes: number | null;
  difficulty: Difficulty | null;
  source: AssignmentSource;
  mode: Mode;
  /** The student's own first step. Null means the mode's default (v2 §3). */
  firstAction: string | null;
};

/** A chunk as produced by split(), before it has a day or a time. */
export type SplitChunk = {
  assignmentId: string;
  index: number;
  title: string;
  plannedMinutes: number;
};

/** A chunk once scheduling has given it a plan day and a start time. */
export type ScheduledChunk = SplitChunk & {
  /** The plan day it belongs to, as a YYYY-MM-DD key. */
  planDate: string;
  scheduledStart: Date;
  classId: string | null;
  dueAt: Date;
  mode: Mode;
  difficulty: Difficulty;
  firstAction: string;
  /** Which part of the evening it sits in: the due-today block, the warm-up, or a mode batch. */
  segment: 'dueToday' | 'warmup' | Mode;
};

/** A scheduled break between chunks (v2 §4). */
export type Break = {
  start: Date;
  minutes: number;
  kind: 'short' | 'long';
};

export type Prefs = {
  chunkLength: ChunkLengthPref;
  /** Minutes from midnight. */
  availableStart: number;
  availableEnd: number;
  dailyTargetMinutes: number;
  startStyle: StartStyle;
  weekdayFactors: WeekdayFactors;
  /**
   * Local hour at which one plan day becomes the next. 3 means work finished
   * at 00:30 still counts toward the previous day.
   */
  dayCutoffHour: number;
  /**
   * Minutes from midnight. Values before noon are read as after midnight.
   * Null falls back to DEFAULT_BEDTIME.
   */
  bedtime: number | null;
};

/**
 * Past behaviour, used only to fill in a missing duration. Returns null until
 * a class has enough completions to be worth trusting.
 */
export type History = {
  medianMinutes(classId: string | null): number | null;
};

/** A plan day with its chunks and the load they add up to. */
export type DayPlan = {
  planDate: string;
  chunks: ScheduledChunk[];
  /** Total planned minutes on this day. */
  loadMinutes: number;
  /** This day's ceiling: dailyTargetMinutes scaled by its weekday factor. */
  targetMinutes: number;
  /**
   * Set when the day exceeds its target after balancing, which only happens
   * when deadlines force it. The UI is required to say why (spec, step 4).
   */
  overTargetReason: string | null;
  breaks: Break[];
  /**
   * Set when must-do-tonight work only fits by running past the cutoff
   * (bedtime minus the margin). The UI has to say so (v2 §2).
   */
  bedtimeOverrun: {
    minutesPastCutoff: number;
    minutesPastBedtime: number;
  } | null;
};

/** Work pushed to a later day because it didn't fit before bedtime (v2 §4). */
export type Deferral = {
  assignmentId: string;
  fromPlanDate: string;
  toPlanDate: string;
  dueAt: Date;
};

/**
 * Must-do-tonight work that can't fit even with the bedtime bend. Nothing is
 * dropped silently: `letGo` is a suggestion the student accepts or not.
 */
export type UrgentTriage = {
  planDate: string;
  needMinutes: number;
  haveMinutes: number;
  letGo: string[];
};

export type Plan = {
  days: DayPlan[];
  /**
   * Assignments that cannot be finished on time even after balancing. The
   * student is asked which one slips; nothing is dropped silently.
   */
  atRisk: Assignment[];
  deferrals: Deferral[];
  urgentTriage: UrgentTriage | null;
  /**
   * Two or more things due today with the same deadline. Which is submitted
   * first can't be guessed, so the student is asked (v2 §2).
   */
  needsSubmitOrder: string[];
};
