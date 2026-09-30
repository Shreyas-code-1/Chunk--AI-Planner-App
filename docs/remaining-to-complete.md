# What's left before Chunk is complete

Snapshot 2026-09-29, from `main` at `b38d3dc`. Open questions stay numbered as
in `v2-and-remaining-screens-questions.md` (Q1–Q17).

## Blockers (the app can't ship without these)
**Update 29 Sep:** the partner's branch `origin/codex/revenuecat-auth-integration`
has real email sign-in, Apple/Google sign-in, the EAS build setup, and
RevenueCat purchase and restore. It's not merged into `main` yet. `usePro()`
still always returns false there.

1. **Real sign-in** (Q3). 2.18/2.19 are fake: no email is sent and any code
   passes. Waiting on the partner's auth code: push it or rule it out.
2. **Persistence.** Work and onboarding answers live only in memory, so a
   restart loses everything. Needs Supabase read/write endpoints, and depends on 1.
3. **Migration 0002** (Q17) has to be run by hand in the Supabase dashboard.
4. **First EAS dev build.** RevenueCat, Apple Sign In and app blocking can't
   run in Expo Go.
5. **Billing.** `usePro` is a stub (`isBillingAvailable = false`). Needs
   RevenueCat wired in, plus a decision on what Pro unlocks and whether the
   paywall can be skipped.
6. **Apple/Google sign-in**: both currently throw "needs a development build".
7. **Sign out and account deletion** (Q2). Apple requires in-app deletion.

## Features not built
8. **Section 4, AI tutor (4.1–4.5).** Needs 1 and a server function. The AI
   consent screen is built (29 Sep); see the decision log.
9. **Notifications/reminders.** `expo-notifications` is installed but not used;
   the Reminders button on 5.2 does nothing (Q1).
10. **Preferences screen** (Q1), which also has no frame.
11. **Classroom/Canvas import** (Q4). Toggles are disabled.
12. **Focus midpoint pause** (Q16). The timer runs straight through.
13. **Engine messages with no frame** (Q9): past bedtime, moved to tomorrow,
    "let one go?", submit order, "split it smaller?".
14. **Bedtime question** in onboarding (Q6). Currently a 10:30 PM default.
15. **Adaptive learning** is built but switched off (`LEARNING_ENABLED = false`).

## Decisions still open
- Q7 due times, Q8 batch grouping on 3.2, Q10 mode chip/first-action styling,
  Q11–Q14 provisional values, Q15 small dreaded tasks splitting across days.
- 41 `TODO(design)` markers in `src/` for UI that has no frame.

## Release
- TestFlight build, App Store listing, privacy policy (needed for the AI and
  account data), and a full pass on a physical iPhone.

## Suggested order
Settle auth (1) → persistence + 0002 (2, 3) → EAS build (4) → billing, Apple
sign-in, deletion (5–7) → notifications (9) → section 4 (8) → release.
