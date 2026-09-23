# Chunk — Scheduling Engine v2

> Supplied by Shreyas on 2026-09-22. Stored verbatim. Open questions against it
> are in `docs/v2-and-remaining-screens-questions.md`; answers amend this via
> `docs/decision-log.md`.

What actually goes in the app, and what doesn't.

The current engine splits a 60-minute task into 30 + 30. That's arithmetic,
not a product. This spec adds the intelligence — but it cuts the research
document roughly in half, because nine features shipped at once is how a
working app becomes a stalled one.

---

## What this changes and what it doesn't

**Unchanged:** spreading work across days before a due date, the day balancer,
the 55-minute cap, Moore–Hodgson for the can't-finish-everything case. That all
operates at the week level and it stays.

**Changed:** ordering *within* an evening. Where this conflicts with
`chunk-algorithm-spec.md`'s due-date-then-shortest-first, **this wins** for
within-day ordering.

**Superseded:** the per-class calibration in §5 of the old spec. Same idea,
now per-mode (§4 below).

---

## Build order — and where to stop

**Ship these three, then stop and use the app for a week:**

1. Mode inference and batching (§2)
2. First-action lines (§3)
3. Bedtime cutoff and breaks (§4)

**Then, only if a week of real use says you need them:**

4. Estimates that learn (§5)
5. Where-I-left-off notes (§6)
6. Milestone splitting (§7)

**Cut entirely — see §9 for why:** test-prep interleaving, the focus-window
question, habit nudges, rewards, the brain dump, Do Not Disturb prompts.

The first three are what make the app feel like it's doing something. The rest
are refinements to a thing that has to work first.

---

## 1. What a task carries

Two new fields. Not four.

```ts
type Task = {
  // existing fields stay
  mode: 'problems' | 'writing' | 'reading' | 'memorizing';
  firstAction: string;   // generated, editable
};
```

**Dropped from the research doc:** `isTestPrep` and `isBigProject` as input
fields. Big projects are already handled — the existing spread logic
distributes work across the days before a due date, which is most of what
milestone splitting buys. Test prep is §9.

### Mode inference

From the task title and the class. Keyword match, not an LLM call — it has to
be instant and predictable.

```
problems    — problem set, pset, homework, MCQ, questions, exercises, ch.N,
              worksheet; or class is math/chem/physics/stats
writing     — essay, paper, write-up, lab report, response, reflection,
              paragraph, draft
reading     — read, chapter, article, annotate, pages, novel, textbook
memorizing  — vocab, flashcards, terms, formulas, dates, memorize, quizlet
```

Default when nothing matches: `problems` for math-family classes, `reading`
otherwise.

**Inference will be wrong sometimes, and a wrong mode puts an essay in a
problem-solving batch.** So the correction has to be one visible tap on the
task itself — a small mode chip the student can tap to cycle through the four.
Not buried in an edit screen. This is a design requirement, not a nice-to-have.

---

## 2. Batching — the core change

**Group tonight's tasks by mode, not by subject.**

Math problems and chem problems sit together. The English essay and the
history essay sit together. The student switches between *kinds of thinking*
three times instead of five.

This is the single biggest change and the reason an evening feels different.

### Order within the evening

1. **One warm-up.** The shortest task under 10 minutes, usually memorizing.
   Exactly one — not a run of easy tasks. Skip it if nothing qualifies.
2. **Hardest batch next**, while they're fresh. "Hardest" = highest total
   difficulty across the batch.
3. **Remaining batches** in descending difficulty. Hardest task first within
   each batch.
4. **Due today or tomorrow overrides everything.** Anything due tomorrow gets
   scheduled tonight even if it breaks the batching. Anything due *today* goes
   first, before the warm-up — see below. Deadlines always win.

### Due today — the override that beats everything

A student adds something at 6pm that's due tonight, or due first thing
tomorrow morning at school. This is the most stressful moment the app will ever
handle, and it has to behave differently.

**The rules that get suspended:**

- **"Never the night it's due" is off.** That rule exists to build slack. There
  is no slack left. Schedule it now.
- **Batching is off for this task.** It doesn't wait for its mode group.
- **The warm-up is skipped** if anything is due today. No easy win first — the
  student knows what's urgent and a vocab deck will read as the app not
  understanding the situation.
- **The 15% buffer is spent** on the urgent work.

**The rules that stay on:**

- **Breaks stay.** 90 unbroken minutes at 9pm produces worse work, not more.
- **Bedtime still applies, but it bends once.** If the work genuinely cannot
  fit before bedtime minus 30, allow up to 60 minutes past it — and say so
  explicitly rather than silently: "This runs 40 minutes past your bedtime.
  That's the only way it fits." Never silently schedule into the small hours.
- **The 55-minute chunk cap stays.** Panic is not a reason to sit for two hours.

**Ordering within "due today":** if more than one thing is due today, earliest
deadline first — an assignment due at 8am tomorrow comes before one due at
11:59pm tonight only if the 8am one is submitted before school. Ask the student
which is submitted first if the timestamps don't resolve it; don't guess.

**When it can't fit at all.** This is where Moore–Hodgson earns its place. If
three things are due today and only two fit, say so plainly and let the student
choose:

> "You've got 3 hours of work due today and about 2 hours before bed. If you
> let the History reading go, you finish Math and the essay. Want to do that?"

Never quietly drop the third. Never pretend it all fits.

**Tone matters more here than anywhere else in the app.** The student is
already stressed. The copy is calm and practical — what to do first, how long
it takes, what fits. No exclamation marks, no urgency styling, no red. The
situation supplies the urgency; the app supplies the calm.

### Why one warm-up and not more

A quick win buys activation energy. A whole evening of quick wins is
procrastination wearing a productivity costume — the research on easy-first
ordering is clear that it degrades the hard work that matters. One, then the
hard thing.

---

## 3. First actions — the highest-value feature here

Every chunk shows one line telling the student exactly what to do first.

```
problems    → "Do question 1"
writing     → "Write one sentence — any sentence"
reading     → "Read the first page"
memorizing  → "Flip the first card"
```

Generated per mode, editable with one tap.

**This is the most important thing in this document.** The gap Chunk exists to
close is between opening the app and starting work. "English essay, 50 minutes"
is a wall. "Write one sentence — any sentence" is a door. A specific,
trivially-small first action is the single best-evidenced intervention on
follow-through there is.

Design note: the first action goes on the Focus screen (3.3), directly under
the task title, in body type. Not a tooltip, not a subtitle — a line the
student reads before the timer starts.

---

## 4. Breaks and bedtime

**Breaks:**
- 5 minutes at every batch boundary
- Inside a batch over 30 minutes, a break roughly every 25 minutes, snapped to
  a task boundary if one falls within ±5 minutes
- 15 minutes after about 90 minutes of total work

Fixed breaks beat "take one when you feel like it" — students using scheduled
breaks reported less fatigue and got the same work done in less time.

**Bedtime cutoff:**
The student sets a bedtime once, during onboarding. Nothing is ever scheduled
past bedtime minus 30 minutes. If the work doesn't fit, the latest-due tasks
move to tomorrow and the app says so plainly:

> "This won't all fit before 10:30. I moved History to tomorrow — it's not due
> until Friday."

Teenagers who cut sleep to study had *more* academic trouble the next day, not
less. An app that helps a student work until 1am is actively harming them, and
this is the rule that prevents it.

**Buffer:** leave 15% of the evening unscheduled at the end.

---

## 5. Estimates that learn (build later)

- New users: pad estimates by 1.5×
- Log estimated vs actual on every chunk
- After 5 completed tasks in a mode, replace the padding with the student's own
  median ratio for that mode
- Surface it gently in weekly stats: "Your essays usually take about 1.4× your
  guess"

Students predict 34 days and take 55. The app being calibrated when the student
isn't is a real advantage — but it needs real completion data, so this can't be
built usefully until people are using the app.

---

## 6. Where-I-left-off (build later)

When a student taps **Stop here**, ask for one line: "Next: paragraph 3, need a
quote from ch.5." Show it when the task resumes.

Cheap to build, genuinely useful, and it costs the student five seconds. Worth
doing — just not before the core works.

---

## 7. Milestone splitting (build later, maybe never)

For projects due more than 3 days out: split into 3–5 milestones (outline,
draft, revise, final), spaced evenly, each treated as a normal task with its
own deadline.

**Honest assessment:** the existing spread-across-days logic already
distributes this work. Milestones add *named stages*, which is a real
improvement for essays and probably nothing for problem sets. Build it only if
students tell you the generic "Part 2 of 5" titles feel meaningless.

---

## 8. When the student falls behind

- **Replan silently and instantly.** Chunk runs over, student starts late —
  rebuild the rest of the evening with the same rules. Never show a wall of red
  overdue tasks.
- **Forward-looking copy, never guilt.** "No worries — here's the updated
  plan." Students who forgave themselves for procrastinating procrastinated
  *less* next time. Guilt is not a motivator; it's a reason to avoid the app.
- **After two slips on the same task, suggest splitting it smaller.** Suggest,
  don't do it silently.

---

## 9. What I cut, and why

**Test-prep interleaving.** The evidence is strong — mixed practice beat
blocked practice 61% to 37% on a delayed test. But it requires knowing what
topics are on a test, which means a whole content-entry flow that doesn't
exist. It's a separate feature, not a scheduling rule. Revisit when there's a
reason to.

**The focus-window question.** "When do you focus best?" adds an onboarding
screen to place the hardest batch. But most high schoolers do homework in one
window — after school until bedtime — so the answer rarely changes the
schedule. Default to "hardest thing first, after the warm-up" and skip the
question.

**Brain dump prompt.** Already covered: 3.5 All Work exists and the spread
logic schedules everything. Don't add a separate ritual.

**Do Not Disturb prompt.** The evidence here is genuinely mixed — the
phone-presence finding failed to replicate. Adding a permissions prompt on a
contested effect isn't worth the friction.

**Rewards and habit nudges.** Both plausible, both unproven in this context,
both add surface area to an app that isn't finished. The streak system already
covers habit.

---

## Example

**Input:** vocab (easy, 10m), math problems (hard, 25m), chem problems (medium,
20m), English essay (hard, 50m, due tomorrow), history essay (medium, 40m, due
Friday). Bedtime 10:30, starts at 4:00.

```
4:00  Vocab (10m)              → "Flip the first card"
4:10  ── problems ──
      Math (25m)               → "Do question 1"
4:35  Break (5m)
4:40  Chem (20m)               → "Do question 1"
5:00  Break (5m)
5:05  ── writing ──
      English essay (50m)      → "Write one sentence — any sentence"
      (break at ~25m)
6:00  Break (15m)
6:15  History essay (40m)      → "Write one sentence — any sentence"
6:55  Buffer (~25m)
```

Three switches between kinds of thinking instead of five. Hardest work while
fresh. Done five hours before bedtime.

Compare to what the app does today: two 30-minute blocks with no order, no
breaks, and no idea what to do when the timer starts.

---

## Implementation

- Pure function: `tasks + settings + history → schedule`. Same standard as the
  existing planner — no I/O, no React, unit tested per rule.
- Every tunable value in ONE config file: warm-up threshold, break intervals,
  buffer percentage, bedtime margin, padding factor.
- Tests per rule: mode inference, batching, warm-up selection, due-tomorrow
  override, break placement, bedtime cutoff, replanning.
- Due-today tests specifically: warm-up skipped, batching bypassed, buffer
  consumed, breaks still present, bedtime bends by at most 60 minutes and the
  overrun is reported, chunk cap still enforced, Moore–Hodgson triage offered
  when it doesn't fit.
- Mode inference is keyword matching. No LLM in the scheduler — it must be
  instant and deterministic.

## Screens affected

- **3.3 Focus** — add the first-action line under the title
- **3.2 Today Path** — batches need visual grouping; ask before designing it
- **3.6 Add Assignment** — mode chip, tappable to cycle; due-date picker needs
  a one-tap "today" option, since that's the panic case and it shouldn't take
  three taps to express
- **3.1 Home / 5.4 Urgent** — the due-today state. 5.4 exists for "due in 3
  hours"; confirm it covers this or tell me what's missing
- **Bedtime overrun** — the "runs 40 minutes past your bedtime" message has no
  frame. I'll design it
- **Onboarding** — one bedtime question (new field on an existing screen, not
  a new screen)

Flag anything else, and any state the board doesn't draw.
