# Open questions — things the board doesn't draw

Standing rule (2026-09-22): build everything `design/board.html` draws without
asking; batch only the genuinely off-board questions here and keep working.
Answers go in `docs/decision-log.md`.

The first version of this file (earlier on 2026-09-22) asked about screens the
board already covers. Those are now built and dropped from the list:
- 5.1 PROGRESS
- 5.2 PROFILE
- 5.3 EMPTY
- 5.4 URGENT
- 5.5 OFFLINE
- 5.6 SOMETHING WENT WRONG
- the due-chip bug

Each item below gives the provisional choice currently in the code.

## Account and settings
1. **Settings / Preferences / Reminders.** 5.2 draws "Preferences" and
   "Reminders" buttons. Nothing is drawn behind them. *Now:* the buttons don't
   do anything.
2. **Sign out and delete account.** Neither is on the board. Apple requires
   in-app account deletion. *Now:* not built.
3. **Real sign-in.** 2.19 accepts any code, and all data lives in memory. Is
   now the time for real Supabase email sign-in and saving data to the
   database? This also unblocks section 4.
4. **Google Classroom / Canvas.** *Now:* both rows say "Not connected" and the
   toggles are disabled.

## Section 4 (AI tutor)
5. **AI consent: built 29 Sep** (see the decision log). 4.1–4.5 are on the board but need the AI server function, which needs real
   sign-in (item 3). They also need the **AI consent** screen, which has no
   frame. *Now:* not built. "SCAN A SYLLABUS" on 5.3 is disabled.

## Engine v2 UI with no frame
6. **Bedtime question.** Which onboarding screen should it go on? *Now:*
   `DEFAULT_BEDTIME` is 10:30 PM.
7. **Due times.** "Due tonight" and "due before school" can't be told apart,
   because only a due day is recorded. *Now:* everything is due at 23:59, and
   the plan flags tied due-today items (`needsSubmitOrder`).
8. **3.2 batch grouping and breaks on the path.** You said to ask first.
   *Now:* the engine labels each chunk's segment and lists breaks, but 3.2 is
   unchanged.
9. **Messages the spec asks for, with no frame:**
   - "runs 40 min past your bedtime"
   - "I moved History to tomorrow"
   - the due-today "let one go?" prompt
   - "which is submitted first?"
   - the "split it smaller?" suggestion (§8, not built)

   *Now:* the data is in `usePlan()` and nothing is shown.
10. **Mode chip and first-action line.** Drawn with existing chip and body
    styles and marked `TODO(design)`. OK as they are?

## Provisional values to confirm
11. **Bedtime bend.** Up to 60 min past **bedtime** (not past bedtime minus 30).
12. **"Deep work" badge.** Earned by one chunk of 50+ min. The board gives no rule.
13. **5.1's "chunks done".** Read as this week's count.
14. **5.1's "finish rate".** Chunks finished out of the chunks whose start time
    has passed.

## Engine v3 — open (2026-09-26)
15. **Small dreaded tasks fragment.** A 30-min dreaded worksheet ramps to
    10 + 20, and the spread can then put the two parts on different days
    ("Chem worksheet · Part 1 of 2 · 10m" tonight, the rest tomorrow). It
    follows the rules as written but reads badly. *Proposal:* a task stays one
    chunk if it is no longer than the ramp's top (1.15 × base: memorizing 20,
    problems 30, reading 45, writing 50). *Now:* unchanged, per the spec.
16. **The Focus timer doesn't stop at the midpoint pause.** `pauseAt` is
    computed and shown on the path; 3.3 has no frame for the pause itself.
17. **Migration 0002 needs running by hand** from the Supabase dashboard.

## Logs — open (2026-09-30)
18. **Leaving a chunk early.** Minutes it ran still earn logs. *Alternative:*
    only finished chunks earn.
19. **Partial minutes.** 90 s earns 1 log; the 30 s is lost. *Alternative:*
    carry seconds over between sessions.
20. **Home placement.** A fourth stat tile makes all four narrower. *Alternative:*
    a log pill beside the streak pill in the header.
21. **Logs move to Supabase** with the rest of the user data (batch 6).
