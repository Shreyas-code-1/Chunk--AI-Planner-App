-- Chunk — initial schema
--
-- Conventions in here, all of them deliberate:
--   * every table carries user_id and has RLS enabled with a policy scoped to
--     auth.uid(). No table ships without one (brief §11a).
--   * chunk_completions is append-only: it has SELECT and INSERT policies and
--     deliberately no UPDATE or DELETE policy, so Postgres enforces the
--     "lifetime count only goes up" rule rather than our discipline.
--   * plan_date is stored, never derived at read time. The day boundary is
--     03:00 local, so work finished at 00:30 belongs to the previous plan day.
--     One helper writes it; the scheduler and the streak both read it.

-- ---------------------------------------------------------------- enums ----

create type goal as enum (
  'get_started', 'stay_organized', 'hit_deadlines', 'study_for_tests', 'focus_longer'
);
create type difficulty        as enum ('easy', 'medium', 'hard');
create type assignment_source as enum ('typed', 'photo', 'voice');
create type chunk_status      as enum ('pending', 'done', 'skipped');
create type chunk_length_pref as enum ('short', 'mixed', 'long');
-- How many days before the due date the spread begins: all / 3 / 1 (screen 2.6c).
create type start_style       as enum ('asap', 'few_days', 'day_before');

-- ------------------------------------------------------------- profiles ----

create table profiles (
  id           uuid primary key references auth.users on delete cascade,
  -- Null until screen 2.4. The trigger below creates the row at signup, before
  -- a name has been chosen; 2.4 enforces non-empty on the way in.
  display_name text        check (display_name is null or length(btrim(display_name)) > 0),
  grade        smallint    check (grade between 10 and 12),
  -- Age gate (§12): under-13 signup is blocked. Grade alone cannot prove age.
  birth_year   smallint    check (birth_year between 1900 and 2100),
  -- IANA zone, captured at signup. v1 is single-timezone per the agreed scope.
  timezone     text        not null default 'America/Los_Angeles',
  goals        goal[]      not null default '{}',
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

-- ---------------------------------------------------------- preferences ----

create table preferences (
  user_id              uuid primary key references auth.users on delete cascade,
  chunk_length         chunk_length_pref not null default 'mixed',
  -- Minutes from midnight, from the 2.6 range slider (6 AM - 11 PM).
  available_start      smallint not null default 960  check (available_start between 0 and 1440),
  available_end        smallint not null default 1380 check (available_end   between 0 and 1440),
  daily_target_minutes smallint not null default 120  check (daily_target_minutes between 15 and 600),
  start_style          start_style not null default 'few_days',
  -- Multipliers on daily_target_minutes, Sunday..Saturday, from 2.6b YOUR WEEK.
  -- busy 0.4 / normal 1.0 / light 1.3. These are a guess to be tuned against
  -- real completion data; the source of truth is WEEKDAY_FACTORS in
  -- src/planner/constants.ts.
  weekday_factors      numeric(3,2)[] not null default '{1,1,1,1,1,1,1}',
  haptics_enabled      boolean not null default true,
  updated_at           timestamptz not null default now(),
  constraint available_window_is_ordered check (available_end > available_start),
  constraint weekday_factors_is_a_week   check (array_length(weekday_factors, 1) = 7)
);

-- -------------------------------------------------------------- classes ----

create table classes (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users on delete cascade,
  name        text not null check (length(btrim(name)) > 0),
  -- Derived deterministically from name by keyword match, not hashed.
  -- Unrecognised names get the neutral chip and the first three letters.
  abbrev      text not null check (length(abbrev) between 1 and 4),
  color_key   text not null,
  period      text,
  teacher     text,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index classes_user_idx on classes (user_id) where archived_at is null;

-- ---------------------------------------------------------- assignments ----

create table assignments (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references auth.users on delete cascade,
  class_id          uuid references classes on delete set null,
  title             text not null check (length(btrim(title)) > 0),
  -- The only required field. Everything else falls back (algorithm spec, step 1).
  due_at            timestamptz not null,
  estimated_minutes smallint check (estimated_minutes between 1 and 1200),
  difficulty        difficulty,
  source            assignment_source not null,
  notes             text,
  deleted_at        timestamptz,
  created_at        timestamptz not null default now(),
  updated_at        timestamptz not null default now()
);
create index assignments_user_due_idx on assignments (user_id, due_at)
  where deleted_at is null;

-- --------------------------------------------------------------- chunks ----

-- Mutable and disposable: every re-plan rewrites these rows, and deleting an
-- assignment deletes its chunks. Nothing here is history — that is what
-- chunk_completions is for.
create table chunks (
  id              uuid primary key default gen_random_uuid(),
  user_id         uuid not null references auth.users on delete cascade,
  assignment_id   uuid not null references assignments on delete cascade,
  idx             smallint not null check (idx >= 1),
  title           text not null,
  -- The 55-minute ceiling is a hard product rule: every chunk must be
  -- finishable in one sitting (algorithm spec, display rule 5).
  planned_minutes smallint not null check (planned_minutes between 5 and 55),
  scheduled_start timestamptz,
  status          chunk_status not null default 'pending',
  created_at      timestamptz not null default now(),
  unique (assignment_id, idx)
);
create index chunks_user_scheduled_idx on chunks (user_id, scheduled_start)
  where status = 'pending';

-- ---------------------------------------------------- chunk_completions ----

-- APPEND-ONLY. See the RLS block below: there is no update or delete policy.
-- Assignment and class are denormalised so a later deletion cannot orphan or
-- rewrite a completed record.
create table chunk_completions (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references auth.users on delete cascade,
  chunk_id         uuid,
  assignment_id    uuid,
  class_id         uuid,
  assignment_title text not null,
  class_abbrev     text,
  planned_minutes  smallint not null,
  actual_minutes   smallint,
  completed_at     timestamptz not null default now(),
  -- The 03:00-local plan day this completion counts toward.
  plan_date        date not null
);
create index chunk_completions_user_day_idx on chunk_completions (user_id, plan_date);

-- --------------------------------------------------------- streak_state ----

create table streak_state (
  user_id         uuid primary key references auth.users on delete cascade,
  current_streak  integer not null default 0 check (current_streak >= 0),
  longest_streak  integer not null default 0 check (longest_streak >= 0),
  -- Last plan day evaluated. Days with no assigned work are never evaluated,
  -- so they neither extend nor break the streak (points spec, section 1).
  last_plan_date  date,
  -- One automatic recovery per calendar month; never purchasable.
  recovery_month  date,
  recoveries_used smallint not null default 0 check (recoveries_used >= 0),
  updated_at      timestamptz not null default now()
);

-- --------------------------------------------------------------- badges ----

create table badges (
  user_id   uuid not null references auth.users on delete cascade,
  badge_key text not null,
  earned_at timestamptz not null default now(),
  primary key (user_id, badge_key)
);

-- ---------------------------------------------------------- ai_consents ----

-- Section 12 requires logging consent: which provider, which version, when.
create table ai_consents (
  id             uuid primary key default gen_random_uuid(),
  user_id        uuid not null references auth.users on delete cascade,
  provider       text not null,
  policy_version text not null,
  accepted_at    timestamptz not null default now()
);
create index ai_consents_user_idx on ai_consents (user_id, accepted_at desc);

-- ------------------------------------------------------------------ RLS ----

alter table profiles          enable row level security;
alter table preferences       enable row level security;
alter table classes           enable row level security;
alter table assignments       enable row level security;
alter table chunks            enable row level security;
alter table chunk_completions enable row level security;
alter table streak_state      enable row level security;
alter table badges            enable row level security;
alter table ai_consents       enable row level security;

-- profiles keys on id rather than user_id; everything else keys on user_id.
create policy "own profile" on profiles
  for all to authenticated using (id = auth.uid()) with check (id = auth.uid());

create policy "own preferences" on preferences
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own classes" on classes
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own assignments" on assignments
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own chunks" on chunks
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own streak" on streak_state
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own badges" on badges
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());
create policy "own consents" on ai_consents
  for all to authenticated using (user_id = auth.uid()) with check (user_id = auth.uid());

-- Append-only. Read your own, write your own, and that is all: with RLS on and
-- no UPDATE or DELETE policy, both are denied to anyone holding a publishable
-- key. Completed work cannot be rewritten or erased, so the lifetime count and
-- past streaks survive any later edit or deletion of an assignment.
create policy "read own completions" on chunk_completions
  for select to authenticated using (user_id = auth.uid());
create policy "record own completions" on chunk_completions
  for insert to authenticated with check (user_id = auth.uid());

-- ------------------------------------------------------------- triggers ----

create or replace function touch_updated_at() returns trigger
  language plpgsql as $fn$
begin
  new.updated_at = now();
  return new;
end $fn$;

create trigger profiles_touch     before update on profiles     for each row execute function touch_updated_at();
create trigger preferences_touch  before update on preferences  for each row execute function touch_updated_at();
create trigger assignments_touch  before update on assignments  for each row execute function touch_updated_at();
create trigger streak_touch       before update on streak_state for each row execute function touch_updated_at();

-- ------------------------------------------------- new user bootstrapping --

-- A signup needs a profile row before onboarding can write to it. Doing this
-- in a trigger rather than from the client means it cannot be skipped.
create or replace function handle_new_user() returns trigger
  language plpgsql security definer set search_path = public as $fn$
begin
  insert into public.profiles (id, display_name)
  values (new.id, nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), ''))
  on conflict (id) do nothing;

  insert into public.preferences (user_id) values (new.id) on conflict do nothing;
  insert into public.streak_state (user_id) values (new.id) on conflict do nothing;
  return new;
end $fn$;

create trigger on_auth_user_created
  after insert on auth.users for each row execute function handle_new_user();
