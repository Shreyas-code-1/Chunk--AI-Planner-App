/**
 * Row types for the database.
 *
 * Hand-written to mirror supabase/migrations/0001_init.sql, because the
 * migration has not been applied yet and `supabase gen types` needs a live
 * project. Once it is applied these are replaced by the generated types and
 * this file becomes a re-export — see docs/decision-log.md.
 */

export type Goal =
  | 'get_started'
  | 'stay_organized'
  | 'hit_deadlines'
  | 'study_for_tests'
  | 'focus_longer';

export type Difficulty = 'easy' | 'medium' | 'hard';
export type AssignmentSource = 'typed' | 'photo' | 'voice';
export type ChunkStatus = 'pending' | 'done' | 'skipped';
export type ChunkLengthPref = 'short' | 'mixed' | 'long';
export type StartStyle = 'asap' | 'few_days' | 'day_before';

export type ProfileRow = {
  id: string;
  display_name: string | null;
  grade: number | null;
  birth_year: number | null;
  timezone: string;
  goals: Goal[];
  created_at: string;
  updated_at: string;
};

export type PreferencesRow = {
  user_id: string;
  chunk_length: ChunkLengthPref;
  available_start: number;
  available_end: number;
  daily_target_minutes: number;
  start_style: StartStyle;
  /** Sunday..Saturday multipliers on daily_target_minutes. */
  weekday_factors: number[];
  haptics_enabled: boolean;
  updated_at: string;
};

export type ClassRow = {
  id: string;
  user_id: string;
  name: string;
  abbrev: string;
  color_key: string;
  period: string | null;
  teacher: string | null;
  archived_at: string | null;
  created_at: string;
};

export type AssignmentRow = {
  id: string;
  user_id: string;
  class_id: string | null;
  title: string;
  due_at: string;
  estimated_minutes: number | null;
  difficulty: Difficulty | null;
  source: AssignmentSource;
  notes: string | null;
  deleted_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ChunkRow = {
  id: string;
  user_id: string;
  assignment_id: string;
  idx: number;
  title: string;
  planned_minutes: number;
  scheduled_start: string | null;
  status: ChunkStatus;
  created_at: string;
};

/** Append-only: insert and read, never update or delete. */
export type ChunkCompletionRow = {
  id: string;
  user_id: string;
  chunk_id: string | null;
  assignment_id: string | null;
  class_id: string | null;
  assignment_title: string;
  class_abbrev: string | null;
  planned_minutes: number;
  actual_minutes: number | null;
  completed_at: string;
  /** The 03:00-local plan day this completion counts toward. */
  plan_date: string;
};

export type StreakRow = {
  user_id: string;
  current_streak: number;
  longest_streak: number;
  last_plan_date: string | null;
  recovery_month: string | null;
  recoveries_used: number;
  updated_at: string;
};

export type BadgeRow = {
  user_id: string;
  badge_key: string;
  earned_at: string;
};

export type AiConsentRow = {
  id: string;
  user_id: string;
  provider: string;
  policy_version: string;
  accepted_at: string;
};
