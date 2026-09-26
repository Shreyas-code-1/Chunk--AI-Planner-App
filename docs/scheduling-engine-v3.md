# Chunk — Scheduling Engine v3 (dread, mode-based ramp, clock times)

> Supplied by Shreyas on 2026-09-26. Stored verbatim. Impact analysis and open
> questions are in `docs/scheduling-engine-v3-impact.md`; answers amend this via
> `docs/decision-log.md`. Where this conflicts with
> `docs/scheduling-engine-v2.md`, this wins.

```
Scope: the engine plus clock times. No retention features, no mascot work, no
UI polish beyond showing the times. When something needs a design, list it and
move on.

===========================================================
WHAT'S WRONG NOW
===========================================================

A 50-minute task becomes 25 + 25. Every chunk is identical. Nothing tells the
student what time anything happens or when their evening ends.

===========================================================
1. REPLACE "DIFFICULTY" WITH TWO SEPARATE INPUTS
===========================================================

Difficulty is removed everywhere. It conflates two unrelated things and
students can't rate it reliably.

LOAD — how cognitively demanding. NEVER asked. Inferred from mode.
       Drives chunk LENGTH.

DREAD — how much the student doesn't want to do it. Asked, one tap:
        fine / meh / dreading. Drives the size of the FIRST chunk and the
        order within a batch.

Ask "How much are you dreading this?" — never "how hard is it?" Students
answer the first honestly and the second badly.

Basis: Steel's meta-analysis of 691 correlations found task aversiveness among
the strongest predictors of procrastination, r = 0.40. Difficulty is not on
that list. Blunt & Pychyl identified boredom, frustration and resentment as
its core dimensions.

The dread chip must be one visible tap on the task to change — not buried in
an edit screen. Inference and defaults will sometimes be wrong.

Migration: map existing difficulty once (easy→fine, medium→meh,
hard→dreading), then collect dread going forward. Load is derived, never
stored as user input.

===========================================================
2. MODE INFERENCE
===========================================================

Four modes, inferred from title and class by keyword match. Deterministic, no
LLM — it must be instant.

  problems    — problem set, pset, homework, MCQ, questions, exercises, ch.N,
                worksheet; or class is math/chem/physics/stats
  writing     — essay, paper, write-up, lab report, response, reflection, draft
  reading      — read, chapter, article, annotate, pages, novel, textbook
  memorizing  — vocab, flashcards, terms, formulas, dates, memorize

Default: problems for math-family classes, reading otherwise.
The mode chip is one visible tap to cycle. Same rule as dread.

===========================================================
3. CHUNK LENGTH
===========================================================

Base by mode:
  memorizing  18    fastest attention decay, needs frequent resets
  problems    25    the case 25 actually fits
  reading     40    material supplies its own novelty
  writing     45    high warm-up cost; short chunks waste the ramp

Load scales it: high 0.9x, medium 1.0x, low 1.15x.
(Load and base are separate. Writing is high-load AND long-base — its warm-up
cost outweighs its decay rate.)

Basis: there is no optimal interval. The 25-minute Pomodoro is a convention,
not a finding — Cirillo reached it by experiment and has said it should be
adjusted to the task. Trials in the literature used 24/6 and 12/3, and a 2025
study found no productivity difference between Pomodoro, self-chosen breaks,
and fully self-regulated work. Reading sustains ~50 minutes; writing loses its
first ten to warm-up.

===========================================================
4. THE RAMP — chunks ascend, never taper, never equal
===========================================================

  first chunk:  by dread — fine 0.85x / meh 0.75x / dreading 0.55x
  then:         rising in equal steps
  last chunk:   1.15x base, capped at 55

A dreaded 45-minute writing task opens with a 25-minute chunk.

Basis: formal work on present-biased agents found the best way to chunk a task
is to make initial subtasks easy and get progressively harder. Small
commitments also beat equivalent large ones — people are 4x more likely to
commit to "$5 a day" than the identical "$150 a month." The first chunk IS the
commitment being asked for.

Rules:
  - Round to 5. Push drift into a middle chunk so the ramp stays monotonically
    non-decreasing. Never break the ramp to absorb rounding.
  - Floor 12, or 10 for a dreaded first chunk.
  - Cap 55, always.
  - A task under its mode's base stays ONE chunk. Never split a 20-minute task.
  - 60-second pause at the midpoint of any chunk over 35 minutes.
    Basis: Ariga & Lleras found two brief diversions inside a 50-minute task
    eliminated the attention decline entirely. A long chunk with an internal
    pause beats two short chunks for high-warm-up work.

===========================================================
5. ORDER WITHIN THE EVENING
===========================================================

Apply in this order:

a. DUE TODAY first, always. Suspends the never-the-night-it's-due rule,
   batching for that task, the opener, and the buffer. Keeps breaks and the
   55-minute cap. Bedtime may bend by up to 60 minutes, ONCE, and must say so
   out loud — never silently.
   Tone: calm and practical. No red, no urgency styling. The situation
   supplies the urgency; the app supplies the calm.

b. DUE TOMORROW next, overriding batching.

c. BATCHING by mode, not subject. Problems together, writing together. May
   reorder within a due-date tier, never across one.
   Basis: switching between kinds of thinking costs time, and attention stays
   partly on the previous task.

d. THE OPENER. One chunk under 10 minutes to start, chosen for LOW DREAD.
   Exactly one. Skipped entirely if anything is due today.
   Basis: a quick win builds momentum, but easy-first as a general policy
   degrades the hard work that matters.

e. DREAD SEQUENCING. Within a batch, the most-dreaded task goes SECOND — not
   first, not last. First faces maximum resistance and gets avoided. Last gets
   abandoned when the evening runs long. Second has momentum behind it and
   time ahead of it.

f. Everything else: earliest due date, then shortest first.

===========================================================
6. BREAKS, BEDTIME, BUFFER
===========================================================

  - 5 minutes at every batch boundary
  - Inside a batch over 30 minutes, a break roughly every 25, snapped to a
    task boundary within ±5 minutes
  - 15 minutes after ~90 minutes of total work
  - Breaks count against the evening window, not the daily target
  - Nothing scheduled past bedtime minus 30
  - Evening limit is whichever is smaller: the daily target or the bedtime
    window
  - Leave 15% of the evening unscheduled as catch-up

Basis: fixed breaks produced less fatigue and better concentration than
take-one-when-you-want, with the same work done in less time. And teenagers
who cut sleep to study had MORE academic problems the next day — an app that
helps a student work until 1am is harming them.

If it still doesn't fit: Moore-Hodgson for the maximum on-time set, then ask
which thing slips. Never drop work silently, never pretend it fits.

===========================================================
7. FIRST ACTIONS
===========================================================

Every chunk carries one line saying exactly what to do first:

  problems    → "Do question 1"
  writing     → "Write one sentence — any sentence"
  reading     → "Read the first page"
  memorizing  → "Flip the first card"

Generated per mode, editable, stored on the chunk. Shown on the Focus screen
under the title, in body type, readable before the timer starts.

Basis: implementation intentions — specifying what you'll do first — show a
large effect on follow-through across 94 studies (d = 0.65).

CONSTRAINT: exactly one per chunk and nowhere else in the app. The same
research warns that if every small behaviour gets an if-then rule, the student
ends up managing the plan instead of doing the work.

===========================================================
8. CLOCK TIMES — the engine must output real times
===========================================================

Every chunk and every break gets scheduledStart and scheduledEnd as actual
clock times, plus the evening's finish time.

3.2 Today Path:

  4:00   Vocab · 18m           "Flip the first card"
  4:18   Break · 5m
  4:23   Math problems · 20m   "Do question 1"
  4:43   Chem problems · 25m
  5:08   Break · 5m
  5:13   English essay · 35m   "Write one sentence"
         (pause at 5:31)
  5:48   Break · 15m
  6:03   History essay · 40m
  6:43   Buffer
  ─────────────────────────────
         Done at 6:55

3.1 Home — "Next up at 4:23" and "Done at 6:55"
3.3 Focus — the evening finish time in small type under the countdown
3.4 Complete — "Next chunk at 4:43" or "You're done. It's 6:41."
Completed chunks show ACTUAL time: "4:00 · 22m (said 25)"

Everything recalculates live. Finish early and every downstream time moves
earlier, including the finish time. Run over and they move later.

The finish time is the most important string in the app. Homework feels
infinite because nobody tells a student when it ends. Make it prominent.

===========================================================
9. LEARNING — build the mechanism, leave it dormant
===========================================================

Per-student, requiring 5+ samples before taking effect:
  - Median actual duration per mode → replaces the base length
  - Dread vs completion → if they finish dreaded work fine, reduce their
    first-chunk shrink; if they never start it, increase it

Record actual minutes on every completion regardless. The data is worth more
than the features built on it, and nothing else can be added later without it.

Basis: students predicted 34 days for a thesis and took 55. Comparing against
past results is the documented fix, and the app can do this where the student
can't.

===========================================================
10. UNCHANGED
===========================================================

Spreading across days before a due date, the day balancer, and Moore-Hodgson
all stay — they operate at the week level.

Where this conflicts with chunk-algorithm-spec.md's
due-date-then-shortest-first, THIS WINS for within-day ordering.
Per-class calibration is superseded by per-mode.

===========================================================
11. REQUIREMENTS
===========================================================

- Pure function: tasks + settings + history -> schedule. No I/O, no React.
- Every constant in ONE config block. Comment each with the rule it serves and
  whether it's evidence-based or a guess. Be honest — most multipliers are
  guesses.
- Unit test per rule:
  · chunk lengths ascend within an assignment; first is always shortest
  · a dreaded task opens shorter than a non-dreaded one of equal length
  · the most-dreaded task in a batch lands second
  · load affects length; dread affects only the first chunk and the order
  · reading chunks exceed problem chunks for equal total minutes
  · a 20-minute task stays one chunk
  · nothing exceeds 55 or falls below 12 (10 for a dreaded opener)
  · chunks over 35 minutes carry a midpoint pause
  · due-today suspends the opener, batching and buffer, but not breaks
  · every chunk has a clock time and the evening has a finish time
  · finishing early moves all downstream times earlier
  · rounding never breaks the ascending order

Tell me what this breaks, what migration you need, and which screens change,
before you build anything.
```
