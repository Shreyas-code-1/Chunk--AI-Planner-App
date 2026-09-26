-- Chunk — engine v3: dread replaces difficulty, mode and first action reach
-- the schema, completions become full snapshots, abandoned starts are logged.
--
-- Spec: docs/scheduling-engine-v3.md. Decisions: docs/decision-log.md
-- (2026-09-26). Applied by hand from the dashboard, like 0001.
--
-- Identity rule this schema serves: a completion is an immutable record of
-- what was done, never a pointer to a chunk position. `chunks` stays
-- disposable; what's left of a task is its estimate minus its completions.

-- ---------------------------------------------------------------- enums ----

create type dread as enum ('fine', 'meh', 'dreading');
create type mode  as enum ('problems', 'writing', 'reading', 'memorizing');

-- ---------------------------------------------------------- assignments ----

alter table assignments
  add column dread        dread,
  -- v2 added mode and first action to the planner but never to the schema.
  add column mode         mode not null default 'reading',
  -- The student's own first step; null means the mode's default.
  add column first_action text check (first_action is null or length(btrim(first_action)) > 0);

-- One-time mapping, then difficulty is gone (v3 §1).
update assignments set dread = case difficulty
  when 'easy'   then 'fine'::dread
  when 'medium' then 'meh'::dread
  when 'hard'   then 'dreading'::dread
end
where difficulty is not null;

alter table assignments drop column difficulty;
drop type difficulty;

-- --------------------------------------------------------------- chunks ----

-- Still disposable, still rewritten on every re-plan. These mirror what the
-- planner outputs so a synced plan can show real times.
alter table chunks
  add column scheduled_end timestamptz,
  add column pause_at      timestamptz,
  add column first_action  text;

-- ---------------------------------------------------- chunk_completions ----

-- Still append-only (no update or delete policy). The snapshot fields make
-- each row self-sufficient: the planner and §9 learning read only these.
alter table chunk_completions
  add column started_at  timestamptz,
  add column mode        mode,
  add column dread       dread,
  -- It was the task's first chunk — the one sized by dread.
  add column first_chunk boolean not null default false;

-- ---------------------------------------------------- chunk_abandonments ----

-- A chunk that was started and left unfinished. APPEND-ONLY like
-- completions: §9's dread learning compares these against completions.
create table chunk_abandonments (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users on delete cascade,
  assignment_id uuid,
  dread         dread not null,
  first_chunk   boolean not null,
  started_at    timestamptz not null,
  abandoned_at  timestamptz not null default now()
);
create index chunk_abandonments_user_idx on chunk_abandonments (user_id, started_at);

alter table chunk_abandonments enable row level security;
create policy "read own abandonments" on chunk_abandonments
  for select to authenticated using (user_id = auth.uid());
create policy "record own abandonments" on chunk_abandonments
  for insert to authenticated with check (user_id = auth.uid());

-- ---------------------------------------------------------- preferences ----

-- Minutes from midnight; values before noon are read as after midnight. Null
-- falls back to the planner's DEFAULT_BEDTIME (22:30) until onboarding asks.
alter table preferences
  add column bedtime smallint check (bedtime between 0 and 1439);
