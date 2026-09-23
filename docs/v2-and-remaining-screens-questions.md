# Questions before building engine v2 and the remaining screens

Asked 2026-09-22, before any code. Answers go in `docs/decision-log.md`.

Context found while preparing these:
- `design/board.html` is the newest export (identical to `~/Downloads/CHUNK Board.html`).
- The board draws **5.2 PROFILE** (stats, badges, CONNECTED: Google Classroom /
  Canvas, then "Preferences" and "Reminders" rows) and **5.5 OFFLINE** ("You're
  offline", TRY AGAIN). It draws **no settings screen**, no sign-out, no
  delete-account, and nothing behind "Preferences" or "Reminders".
- Auth is still stubbed: 2.19 VERIFY accepts any code and data lives in memory.

## Scope

1. **"Finish the rest of the app".** Which of these are in? 5.1 PROGRESS, 5.2
   PROFILE, 5.3 EMPTY, 5.4 URGENT, 5.5 OFFLINE, 5.6 SOMETHING WENT WRONG, and
   the section 4 AI screens (4.1 scan, 4.2 ask, 4.3–4.5 study modes/quiz).
   Section 4 needs an Edge Function and a model key, so it is a much bigger job.
2. **Settings.** Is "settings" the screen behind 5.2's "Preferences" row? If so
   it has no frame. Proposed contents: bedtime, daily pace, week, chunk length,
   start style, reminders. Should I lay it out with existing components, or wait
   for your frame?
3. **Account.** Does this mean real Supabase email sign-in (replacing the stub)
   and saving data to the database, or only the account UI? Apple requires
   in-app **delete account**, which the board doesn't draw. Sign out likewise.
   Google Classroom / Canvas sync: build it, or show the rows as "coming soon"?
4. **Offline (5.5).** Everything is in memory today, so nothing can currently go
   offline. Show 5.5 only once data syncs to Supabase, or also build the
   connectivity check now?

## Engine v2

5. **Evening length: daily target vs bedtime.** Today the day is capped by the
   daily target (2.6/2.10). v2 caps it by bedtime − 30 and keeps a 15% buffer.
   The example fills 4:00–6:55. Which wins: the daily target, or the
   start→bedtime window?
6. **Where the bedtime question goes.** Proposal: 2.6 STUDY STYLE, replacing
   its TIME A DAY slider, which duplicates 2.10 DAILY PACE (flagged earlier).
   And does "best time of day" on 2.6 stay as the evening start time?
7. **Due times.** 3.6 records a due *day* only (stored 23:59). "Due tonight" vs
   "due first thing tomorrow" can't be told apart. Add a due-time control
   (e.g. "Before school" / "Tonight"), or treat everything as end-of-day?
8. **Breaks count against the evening?** I plan to count breaks against the
   window but not against the daily target. This replaces today's 10-minute
   break every 2 chunks.
9. **Undrawn UI.** The spec needs these, and none of them has a frame:
   - the mode chip on 3.6
   - the first-action line on 3.3
   - batch grouping on 3.2 (you said ask first)
   - the bedtime-overrun message (you said you'd design it)
   - the "moved History to tomorrow" note
   - the due-today triage prompt
   - the "which is submitted first?" question
   - the "split it smaller?" suggestion
   - a "Today" due chip

   **(a)** Build them with existing components and styles, and mark each
   `TODO(design)`.
   **(b)** Build only the engine and leave the UI for your frames.
10. **5.4 URGENT vs due-today.** 5.4 shows one item due in 3 hours, with DO IT
    NOW / MOVE TO 7 PM. Due-today with several items needs the triage prompt.
    Proposal: 5.4 for a single urgent item, the triage prompt when two or more
    don't fit. OK?

## Bug

11. **Due-date chips "cut off".** 3.6's DUE row is a horizontal scroll. My guess
    is that the selected chip's edge, or the last chip, is clipped at the scroll
    edge. Can you send a screenshot so I fix the actual problem?
