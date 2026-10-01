# v1 readiness — 2026-10-01

Question (Shreyas): is the app bug-free, secure, functional, and ready for a
v1 App Store submission? **Answer: ready for the Expo Go demo; not yet ready
to submit.** Checked on branch `integrate/all`.

## Healthy
- 517 tests pass; TypeScript strict typecheck clean; iOS bundle exports.
- No secrets in any commit (docs/security-check.md). RLS enabled on all 10
  Supabase tables. Sessions in SecureStore.
- Expo Go path verified: RevenueCat never loads; paywall, login (email only),
  Settings, Home, Profile render.

## Would likely get the app rejected (fix before submitting)
1. **Paywall sells features that don't exist.** It lists "Unlimited chunking
   and re-plans", "Quizzes, flashcards and audio recaps", "Syllabus scanning".
   There are no Edge Functions, so no AI feature works. Build them or change
   the copy to what Pro actually unlocks (Guidelines 2.1, 3.1.2).
2. **No account deletion.** Required for apps with account creation (5.1.1(v)).
3. **No privacy policy or terms.** `PRIVACY_POLICY_URL` is an example.com
   placeholder; subscriptions need both linked on the paywall and in App Store
   Connect (3.1.2, 5.1.1).
4. **"Save across devices" isn't true.** Log in says chunks, streaks and
   classes sync; all data is on the phone only (batch 6 Supabase sync not built).
5. **Purchases never tested for real.** Needs an EAS development build and a
   sandbox buy/restore; App Store Connect products must map to `$rc_annual` /
   `$rc_monthly` in the `default` offering.
6. **Unused microphone permission.** The `expo-audio` plugin adds a mic
   permission the app never uses — remove it or use it.

## Works, but not v1 quality
- Streak / best streak are a 0-or-1 placeholder (Home, Profile, Chunk
  Complete, Week streak badge).
- Settings rows with nothing behind them: Preferences, Notifications, Classes,
  Chunk Pro, Privacy policy, Terms of use. No reminders are ever sent.
- Today's week strip and WEEK pill don't do anything (question 22).
- 43 `TODO(design)` states with no designed treatment (empty, error, loading).
- Bundle id `com.caidenn2.chunk` and the EAS project sit on a teammate's
  personal Expo account — decide who owns the App Store listing.

## Code health
- Lint: 6 errors. `react-hooks/set-state-in-effect` in `_layout.tsx` and
  `SessionProvider.tsx` (from the merges), `react-hooks/immutability` in
  `Button.tsx`, plus `gallery.tsx` and a test. With the React Compiler on,
  these components skip compiler optimisation; not crashes, but worth fixing.
- `npm audit`: high (brace-expansion) and moderate (decode-uri-component) in
  build tooling, not shipped in the app. `npm audit fix` clears the high one.

## Not verified by me (needs a phone / native build)
Real device run, native build, live Supabase sign-in and data, purchases,
Apple/Google sign-in, notifications.
