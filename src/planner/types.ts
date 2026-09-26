/**
 * Types for the chunking and scheduling algorithm.
 *
 * Taken from docs/chunk-algorithm-spec.md. The planner is pure: no I/O, no
 * React, no Supabase. Everything it needs arrives as arguments.
 */

/** How much the student doesn't want to do it (v3 §1). Sizes the first chunk and the order in a batch. */
export type Dread = 'fine' | 'meh' | 'dreading';
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
  /** Null means the student hasn't said; DEFAULT_DREAD applies. */
  dread: Dread | null;
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
  /** Live: moves with a running chunk that overruns (v3 §8). */
  scheduledEnd: Date;
  /** The 60-second midpoint pause, for chunks over 35 minutes (v3 §4). */
  pauseAt: Date | null;
  classId: string | null;
  dueAt: Date;
  mode: Mode;
  dread: Dread;
  firstAction: string;
  /** Which part of the evening it sits in: the due-today block, the opener, or a mode batch. */
  segment: 'dueToday' | 'opener' | Mode;
};

/** A scheduled break between chunks (v2 §4). */
export type Break = {
  start: Date;
  end: Date;
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
 * Past behaviour, per mode (v3 §10: per-class calibration is superseded).
 * Each returns null until there are enough samples to trust.
 */
export type History = {
  /** Median total minutes of a task in this mode; fills a missing estimate. */
  medianTaskMinutes(mode: Mode): number | null;
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
  /** When the last chunk ends. */
  workEnd: Date;
  /** Catch-up time after the work: 15% of the evening, none if something is due today. */
  bufferMinutes: number;
  /** "Done at" — work end plus the buffer, never past the bedtime cutoff unless the work is. */
  finishAt: Date;
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

/** The chunk on the timer right now. It is anchored at its real start. */
export type ActiveChunk = {
  assignmentId: string;
  index: number;
  startedAt: Date;
};

/** A chunk finished today, as the clock saw it. Decides the break owed next. */
export type FinishedToday = {
  endedAt: Date;
  minutes: number;
  mode: Mode;
};

/** What is happening right now, beyond the assignments themselves. */
export type Live = {
  active?: ActiveChunk | null;
  finishedToday?: FinishedToday[];
};

/** A finished chunk: it keeps its identity but no longer has a slot. */
export type DoneChunk = SplitChunk & {
  classId: string | null;
  dueAt: Date;
  mode: Mode;
  dread: Dread;
  firstAction: string;
};

/** The one chunk identity used by completions, the plan and the screens. */
export const chunkKey = (chunk: { assignmentId: string; index: number }): string =>
  `${chunk.assignmentId}:${chunk.index}`;

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
  /** Chunks already finished, excluded from scheduling. */
  done: DoneChunk[];
};
