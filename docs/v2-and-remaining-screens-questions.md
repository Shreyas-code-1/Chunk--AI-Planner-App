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
5. 4.1–4.5 are on the board but need the AI server function, which needs real
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
