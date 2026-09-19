# Chunk — Points & Streaks

## The constraint that shapes everything

Duolingo generates its own content, so a streak measures showing up. Chunk's
work comes from teachers, so some days there is genuinely nothing to do.

**A streak must never break on a day with no assigned work.** Get this wrong
and the first quiet weekend destroys the mechanic's credibility.

Second constraint: Duolingo optimizes for time in app. We optimize for work
finished on time. Never award points for minutes spent, sessions opened, or
app opens — that rewards the behavior we exist to reduce.

---

## 1. The streak — "plan days"

A **plan day** is any day the schedule had at least one chunk on it.

```
streak continues if: all of today's chunks are done
streak is unaffected if: today had no chunks (not a plan day)
streak breaks if: a plan day ends with chunks undone
```

Days with no work are invisible to the streak. They neither extend nor break
it. This is the single most important rule here.

**Partial credit.** Finishing 3 of 4 chunks shouldn't feel like failing. If the
student completes at least one chunk and at least 60% of the day's minutes, the
streak holds and the mascot says so: "Not everything, but you showed up. Streak's
safe."

**Recovery, not freezes.** Duolingo sells streak freezes. Don't monetize
forgiveness in a study app for minors — it's a bad look and it teaches the wrong
thing. Instead: one automatic recovery per month. Miss a day, do your chunks
tomorrow, the streak is restored. Tell them it happened.

**Cap the display.** Show streaks up to 30 days, then switch to a calmer framing
("5 weeks strong"). A 200-day counter creates anxiety disproportionate to
anything it's measuring, and the eventual break is devastating.

---

## 2. Chunks completed — the lifetime counter

Already on the board (5.2 shows 148). Keep it exactly as is: a simple count
that only goes up.

This is the best number in the app. It's honest, it's cumulative, it can't be
lost, and it maps directly to real work done. It does most of what XP does
without any of the abstraction.

**Do not add a separate XP currency on top of it.** A second number that
converts from the first adds no information and invites farming. If you ever
want XP, make "chunks" the XP.

---

## 3. Badges

Already on the board: First chunk, Week streak, On time ×10, Deep work.
That set is good. Extend it along axes that reward the behavior we want:

- **On time ×10 / ×25 / ×50** — assignments finished before the due date.
  This is the real outcome; weight it heaviest.
- **Early bird** — finished an assignment 2+ days early.
- **Full week** — every plan day completed, Mon–Fri.
- **Comeback** — returned and completed a plan day after missing 3+ days.
  Deliberately rewards re-engagement rather than only perfect records.
- **Subject badges** — 20 chunks in one class.

Rules: badges are earned silently in the background and revealed on completion
screens (3.4), never via push. No badge is ever lost.

---

## 4. What not to build

**No leagues or leaderboards.** Duolingo's leagues work because losing a
language league costs nothing socially. Ranking teenagers against each other on
homework completion is a different thing entirely — it surfaces who's
struggling, invites comparison at exactly the age it hurts most, and cuts
directly against the "don't feel overwhelmed" goal. Also: the app is
single-user by design (§1 of the brief).

**No hearts, lives, or lockouts.** Duolingo can afford to block a lesson.
Blocking a student from their own homework is absurd.

**No points for time spent.** See above.

**No purchasable advantages.** Anything buyable that affects streaks or points
turns a study tool into a game with pay-to-win, aimed at minors. RevenueCat
gates features, never progress.

**No loss-framed notifications.** "Your streak is about to die" works and it's
manipulative. The mascot nudges — "one chunk left today" — and never threatens.

---

## 5. A caution worth taking seriously

There's a well-documented effect where extrinsic rewards can undermine
intrinsic motivation for activities people already do. Homework is already
externally compelled; layering points on top risks the student optimizing for
the counter rather than the work.

Mitigation, and the reason for the design above: every number in Chunk measures
**real work completed**, not app engagement. Chunks done, assignments finished
on time, days you followed your plan. If the student games these, they've done
their homework. That's an acceptable failure mode — and it's why there's no
separate XP currency to farm.

---

## 6. Build order

1. Streak with plan-day logic and partial credit. This is most of the value.
2. Lifetime chunk count — already designed, trivial.
3. Badges — already designed, background-evaluated.
4. Monthly recovery.

Nothing here needs a new screen. The board already has streak, count and badge
displays on 3.1, 3.4, 5.1 and 5.2.

---

## 7. Tests

- Day with no assigned chunks → streak unchanged, not broken, not extended
- Plan day with all chunks done → streak +1
- Plan day with 3 of 4 chunks and 70% of minutes → streak holds
- Plan day with 1 of 4 chunks → streak breaks
- Missed day, then a full day → streak restored once per month, student told
- Second miss in the same month → no recovery
- Badge earned mid-session → revealed on the completion screen, no push