# Events — plan (awaiting approval)

Fixed-time things (practice, dentist, club) added through +, shown on Today's
Path, and treated by the scheduler as busy time. Branch `feature/events`.

## How things work today

**Storage.** Work is local-only. `useWork` (zustand, `src/features/work/store.ts`)
holds assignments, completions, abandoned starts and `keptForLater`.
`src/features/persistence/localData.ts` subscribes to `useWork` and `useDraft`
and writes one zod-validated JSON snapshot (`snapshot.ts`, `version: 1`) to
AsyncStorage under `chunk:data:v1:guest:<installation>`. Supabase has
`assignments`/`chunks` tables but nothing writes work to them yet. **So events
need no Supabase migration** — they join the snapshot, with `.default([])` so
existing snapshots still load. (If you'd rather add the table anyway for when
sync arrives, that's `0004_events.sql` + `src/api/types.ts`; say so.)

**Scheduling.** `plan()` → resolve → split → spread → balance → for each day,
`scheduleDay()`. `scheduleDay` orders the day into segments (due today, opener,
due-tomorrow batches, later batches), then `layout()` walks a single `slot`
cursor (minutes from the plan day's midnight): each chunk occupies
`[slot, slot+minutes)`, then a break may be inserted (batch boundary, ~25 min in
a long batch, 15 min after ~90). A running chunk is anchored at its real start
and can overrun. If `layout().end` passes bedtime − 30, movable chunks are
deferred latest-deadline-first to the next day (reported as `Deferral`); if
must-do-tonight work still passes bedtime + 60, `urgentTriage` suggests what to
let go. `finishAt` = work end + buffer (15% of the smaller of target and window),
capped at the cutoff. `usePlan` re-plans every minute; `replan` holds the order
when drift is < 15 min. **Nothing on screen renders `deferrals` today.**

## Step 1 — the + button

- `src/app/(app)/add.tsx` becomes a thin container: Assignment | Event tabs
  over the active form.
- The current screen body moves **verbatim** to
  `src/features/work/AddAssignmentForm.tsx` (no behaviour change; diff will be a move).
- Tabs drawn with the existing chip styles. `TODO(design)`.
- Last tab remembered in a tiny persisted store
  (`src/features/events/addTab.ts`, same pattern as `profile/username`).
- Dock's + label becomes "Add".

## Step 2 — the event form

- `src/features/events/EventForm.tsx` (UI), `useEventForm.ts` (state),
  `validate.ts` (pure, tested). Reuses `Input`, `Toggle`, chip `Choice`, `Button`.
- Fields: title, date, start/end, all-day toggle (hides times), repeat
  (Never / Daily / Weekly + weekday chips / Custom: every N days | every N weeks
  on weekdays), end (never / on date / after N times), note.
- Messages: "Give it a name so you recognise it later.", "End time needs to be
  after the start time.", "Pick at least one day for it to repeat on.",
  "The repeat needs to end after it starts.", "Repeat at least once."
- **Date/time controls:** `@react-native-community/datetimepicker` (compact iOS
  style). Per the SDK 57 docs it ships in Expo Go; install with
  `npx expo install`. The board draws no picker. `TODO(design)`.

## Step 3 — data

Pure module `src/planner/events.ts`:

```ts
type RepeatRule =
  | { freq: 'none' }
  | { freq: 'daily'; interval: number }                       // every N days
  | { freq: 'weekly'; interval: number; weekdays: number[] }; // every N weeks on days
type RepeatEnd = { kind: 'never' } | { kind: 'on'; date: PlanDate } | { kind: 'after'; count: number };
type EventSeries = {
  id; title; note; date: PlanDate;            // first occurrence
  startMinutes; endMinutes; allDay;           // wall-clock minutes, not instants
  repeat: RepeatRule; end: RepeatEnd;
  exceptions: Record<PlanDate, { deleted: true } | { override: Partial<...> }>;
};
expandEvents(series[], from: PlanDate, to: PlanDate): EventOccurrence[]
```

- Stored as rules. Expanded only for the range shown or planned.
- Times are kept as wall-clock minutes on a date key and turned into a `Date`
  with the local constructor at expansion time, so 4:00 stays 4:00 across DST.
- "After N times" counts deleted occurrences (as calendars do), so deleting
  one doesn't extend the series.
- Store: `src/features/events/store.ts` (`useEvents`: add, updateSeries,
  editOccurrence, deleteOccurrence, deleteSeries). Added to the snapshot and
  its subscription.

## Step 4 — planning around events

`plan()`/`replan()`/`scheduleDay()` take an optional `events: EventOccurrence[]`
(default `[]`, so every existing call and test is unchanged).

- Per day, timed occurrences become **busy intervals**, overlaps merged.
  All-day events are ignored by the scheduler.
- `layout()`: a slot inside a busy interval jumps to its end. A chunk that
  would overlap the next busy interval is **never split**. Instead the gap is
  offered to the first later chunk that fits and is next in its own task's
  order (no chunk 2 before chunk 1). If none fits, the gap is skipped and the
  chunk goes after the event. Splitting is untouched.
- **Breaks:** a break that would run into an event isn't placed. The event
  counts as the rest, so the break counters reset (the long-break counter
  only if the event is ≥ 15 min). Nothing ever lands inside an event.
- **Running chunk** is anchored as now and never interrupted, even if an
  event starts mid-chunk. Everything after it lays out around events.
- **Target:** `loadMinutes`/target logic sums chunks only; events never count.
- **Window:** event minutes between start and cutoff reduce the evening used
  for the buffer, and `layout().end` already includes jumped-over events, so
  the existing bedtime/defer/urgent-triage logic engages naturally and "Done at" includes them.
- **Copy:** `Deferral` gains `crowdedBy: string | null`, the title of the
  biggest event that day, set when the day would have fit without its events.
  Pure `deferralLine()` builds: "Practice takes up most of tonight. I moved
  History to tomorrow, it's not due until Friday." Shown as a plain row at the
  top of Today's Path. `TODO(design)`: no frame exists for deferral messages.

## Step 5 — Today's Path and week

- `usePlan` expands events for today through the last planned day and returns
  `eventsToday`, `allDayToday` and `eventDays` (the set of week dates with
  events). Chunk counts, `upNext`, logs and streak are untouched. Events are
  not chunks, never complete, never earn.
- `src/features/events/EventBlock.tsx`: a time-ordered row with start time on
  the left, tan/grey card (`colors.locked`/`colors.cream`/`mutedWarm`), and no
  node, play or lock. All-day events become a banner above the summary.
  `TODO(design)` on both.
- Tap → repeating? Native `Alert` with "Just this one" / "All events in the
  series" / Cancel (`TODO(design)`). Then route `src/app/(app)/event.tsx`
  (edit, with delete), scoped to that choice.
- Week view: the strip on Today gets a small tan dot under days with an event.
  `TODO(design)`. The strip isn't tappable today, so that's all it can show.

## Step 6 — tests

`src/planner/__tests__/events.test.ts` (expansion: daily, weekly days, every
N days/weeks, end on date, end after N, edited and deleted occurrences, DST
via `TZ=America/Los_Angeles` across 1 Nov 2026) and
`src/planner/__tests__/schedule-events.test.ts` (no overlap, no split: moves
after or a fitting chunk fills the gap, breaks never inside, target unaffected,
finish includes events, all-day doesn't block, triage + `crowdedBy`, running
chunk not interrupted). Plus `validate.test.ts` and `deferralLine` tests.
The 517 existing tests must stay green.

## Also

- Decision-log entry: events block time, all-day don't, events don't count
  toward the daily target, chunks never split by events, and events count as a break.
- Design-needed list appended to `docs/v2-and-remaining-screens-questions.md`.
- Phone test script in this file once built. No merge to main.
