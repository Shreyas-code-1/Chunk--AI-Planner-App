# Chunk — Chunking & Scheduling Algorithm

Two jobs. Keep them separate in code.

1. **Split** — cut one assignment into chunks
2. **Schedule** — lay all pending chunks onto available time

No LLM in either. Deterministic, pure functions, easy to test.

---

## Data

```ts
type Assignment = {
  id: string;
  classId: string;
  title: string;
  dueAt: Date;
  minutes: number | null;              // student's estimate, may be absent
  difficulty: 'easy' | 'medium' | 'hard' | null;   // may be absent
  source: 'typed' | 'photo' | 'voice';
};

type Chunk = {
  id: string;
  assignmentId: string;
  index: number;
  title: string;
  plannedMinutes: number;
  scheduledStart: Date | null;
  status: 'pending' | 'done' | 'skipped';
  actualMinutes: number | null;        // recorded on completion
};

type Prefs = {
  chunkLength: 'short' | 'mixed' | 'long';   // 20 / 30 / 50 min
  availableStart: number;                    // minutes from midnight
  availableEnd: number;
  dailyTargetMinutes: number;
};
```

---

## Step 1 — Fill in what's missing

Only the **due date** is required. Everything else has a fallback.

```ts
function resolve(a: Assignment, history: History) {
  const minutes = a.minutes
    ?? history.medianMinutes(a.classId)       // this class's past average
    ?? 45;                                     // global default

  const difficulty = a.difficulty
    ?? (minutes > 60 ? 'hard' : minutes < 25 ? 'easy' : 'medium');

  return { minutes, difficulty };
}
```

That's the whole "don't depend on one signal" requirement. Duration or
difficulty, either one works; with neither, use the class average.

---

## Step 2 — Split into chunks

```ts
const TARGET = { short: 20, mixed: 30, long: 50 };
const ADJUST = { easy: 1.15, medium: 1.0, hard: 0.8 };

function split(a, prefs, history) {
  const { minutes, difficulty } = resolve(a, history);
  const target = clamp(TARGET[prefs.chunkLength] * ADJUST[difficulty], 12, 55);

  const count = clamp(Math.round(minutes / target), 1, 12);
  const per = roundTo5(minutes / count);

  return range(count).map(i => ({
    index: i + 1,
    plannedMinutes: per,
    title: titleFor(a, i, count),
  }));
}
```

Titles: if the assignment came from a **photo**, we have page ranges and problem
numbers — use them. Otherwise `"Part 2 of 5"`. Don't overthink it.

---

## Step 3 — Spread each assignment across its available days

This is the core of the product. Do not schedule greedily — greedy scheduling
crams everything into the next few days and leaves the rest empty.

For each assignment, spread its chunks evenly over the days between now and
when it's due.

```ts
function spread(assignment, chunks, prefs) {
  // Land one day early. Never schedule work for the night it's due.
  const lastDay = addDays(assignment.dueAt, -1);
  const days = availableDaysBetween(today, lastDay, prefs);

  if (days.length === 0) return assignRemaining(chunks, today);  // due tomorrow

  // One chunk per day, cycling, so a 5-chunk assignment over 4 days
  // becomes 2/1/1/1 rather than 5/0/0/0.
  return chunks.map((chunk, i) => ({
    ...chunk,
    day: days[i % days.length],
  }));
}
```

Two rules make this feel right:

- **Front-load slightly.** When chunks don't divide evenly, put the extra ones
  on the earlier days. That builds slack before the deadline instead of after
  it, so a bad day doesn't become a crisis.
- **Never the last night.** Work always finishes a day before it's due. If a
  student loses a day, they have a buffer instead of an emergency.

---

## Step 4 — Balance the days

Spreading each assignment independently can still pile up — four assignments
each putting a chunk on Thursday makes Thursday awful. So level the load.

```ts
function balance(days, prefs) {
  for (const day of days) {
    while (load(day) > prefs.dailyTargetMinutes) {
      // Move the chunk with the most slack — the one whose deadline is
      // furthest away — to the lightest nearby day that's still before
      // its own due date.
      const chunk = maxBy(day.chunks, c => daysUntilDue(c));
      const target = lightestDayBefore(dueAt(chunk), days);
      if (!target || load(target) >= load(day)) break;   // nowhere better
      move(chunk, target);
    }
  }
}
```

If a day is still over target after balancing, it's because deadlines force it.
That's fine — but say so on screen: "Thursday's heavier, two things are due
Friday."

Within each day, order chunks by due date, then shortest first. Then lay them
onto the clock:

```ts
let slot = max(prefs.availableStart, now);
for (const chunk of day.chunks) {
  chunk.scheduledStart = slot;
  slot += chunk.plannedMinutes;
  if (chunksSinceBreak() >= 2) slot += 10;
}
```

**Mix classes within a day.** Don't put three Biology chunks back to back —
alternate assignments where the ordering allows. Interleaving different material
beats blocking one subject, and it stops the evening feeling like one long slog.

---

## Step 5 — Re-plan

Re-planning is just running steps 3 and 4 again. It's cheap — run it on the
client whenever a chunk finishes, is skipped, or an assignment is added.

**One rule:** if a re-plan would move a chunk less than 15 minutes, don't.
A schedule that rearranges itself constantly is one nobody trusts.

**When something runs long, say so.** Don't silently compress the rest of the
evening: "That ran 20 minutes over. I moved History to tomorrow — it's not due
until Monday." Naming the tradeoff is the product.

---

## When they can't finish everything

This is the one place worth more than a sort, and it's still short.

If total remaining work won't fit before the deadlines, the naive response is
to cram. The better move — Moore–Hodgson, a known-optimal algorithm — is to
drop the **largest** assignment and save several smaller ones:

```ts
function maxOnTimeSet(assignments) {
  const sorted = [...assignments].sort((a, b) => a.dueAt - b.dueAt);
  const kept = [];
  let total = 0;

  for (const a of sorted) {
    kept.push(a);
    total += a.minutes;
    if (total > availableMinutesBefore(a.dueAt)) {
      const biggest = maxBy(kept, x => x.minutes);
      remove(kept, biggest);
      total -= biggest.minutes;
    }
  }
  return kept;   // provably the largest set finishable on time
}
```

Then tell them, and let them decide:
"You can't finish all five. Let the History essay slip a day and you make the
other four. Want to do that?"

A student will never make that call themselves. That's the feature.

---

## Learning (add later, not now)

Record `actualMinutes` on every completed chunk. Once a class has 3+ samples,
use its median in `resolve()` instead of the default. That's the entire
learning loop — one median, no model.

Do not build this before you have real users completing real chunks.

---

## Build order

1. Steps 1–4 — split, spread, balance. This is the whole product. Ship it.
2. The can't-finish-everything case.
3. Median-based learning, after you have data.

Anything beyond this — energy matching, confidence scores, warm-up chunks,
buffers — is a hypothesis, not a feature. Add one only if real usage shows the
simple version failing in that specific way.

---

## Tests

Pure functions, no UI needed:

- Assignment with duration but no difficulty → plans fine
- Assignment with difficulty but no duration → plans fine
- Assignment with neither → plans fine using class median
- No due date → the only case that blocks; ask for it
- 5 chunks due in 5 days → one per day, not all today
- 5 chunks due in 2 days → 3 today, 2 tomorrow, nothing on the due date
- Four assignments all landing on Thursday → balancer moves the least urgent
  ones to lighter days
- A day still over target after balancing → allowed, and the reason is shown
- No assignment is ever scheduled on the night it's due
- Three chunks from one class in a day → interleaved with other classes
- More work than time → largest assignment flagged, student asked
- Chunk runs long → later chunks move, nothing silently dropped
- Re-plan that moves a chunk 5 minutes → no change

---

## What this is actually for

The goal is not throughput. It's that a student with nine hours of work looks
at their phone and doesn't feel buried.

The scheduler contributes less to that than the display does. Two students with
identical plans feel completely differently depending on whether the screen
says "10 hours left" or "read pages 88–94, 24 minutes." So the ordering rules
above only need to be defensible — these display rules are what the product
lives on.

**1. One thing at a time, by default.**
Home shows the next chunk. Not the next three. The path view exists for when
the student chooses to look ahead; that's different from being shown the
backlog unprompted.

**2. Never show a total that can only grow.**
"10 hours left" gets worse every time a teacher assigns something. "3 chunks
today" is bounded and finishable. Same information, opposite feel. Cumulative
totals belong on Progress, framed as what they've done — never on a work list,
framed as what they owe.

**3. Today is the largest unit the app asks them to hold.**
Week and month views are navigation the student opts into, never the default
landing state.

**4. The daily target is a ceiling, not a preference.**
If the work doesn't fit, it spreads across days — the day view shows only
today's share. The only thing that breaks the ceiling is a real deadline, and
when it breaks, say why: "Bio is due tomorrow, so today's a bit heavier than
usual."

**5. Every chunk must be completable in one sitting.**
That's the whole mechanism. A finishable unit produces a completion; completions
are what tell someone they're not drowning. This is why the 55-minute cap is
hard.

**6. When work gets dropped or moved, name it.**
Silent rescheduling makes the plan feel arbitrary. "I moved History to
tomorrow — it's not due until Monday" is reassurance. Work vanishing without
explanation is not.

If a feature makes the schedule better but makes the student see more work at
once, it's a bad trade. Default to showing less.