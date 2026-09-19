@AGENTS.md

# Chunk — working conventions

Read `docs/chunk-implementation-prompt.md` first; it is the brief and it wins.
`docs/chunk-algorithm-spec.md` and `docs/chunk-points-system.md` specify the
planner and the streak. `docs/decision-log.md` records every decision that
amends one of those, and `docs/0a-open-questions.md` holds the answers.

## The rule that comes before the others

**Every plan, decision and answer goes in a committed file in this repo.** Not
in conversation. Work has been lost to this twice. A decision that changes an
agreed approach goes in `docs/decision-log.md`, naming the superseded value so
it cannot drift back.

## Design

`design/board.html` is the single source of truth — the standalone v3 export,
the only self-contained copy. Regenerate the readable form with
`node scripts/extract-board.mjs`, which writes `design/extracted/`
(git-ignored). `design/assets/` is for hand-supplied assets and is never
touched by that script.

`design/mascot/` holds the board's own 21 mascot poses, extracted from
`design/board.html`. The board uses **a different pose per screen** — the
mascot is not one image, and `design/mascot/README.md` maps each file to the
screen it appears on. Do not take mascot art from anywhere else.

- The design is final. We are **translating** it, not reimplementing it. Do not
  change spacing, colour, type size, weight, radius or shadow. The scale is
  uneven on purpose (12, 11.5, 14.5, 13.5 all appear); do not harmonise it.
- All values live in `src/theme/tokens.ts`. Screens read tokens, never literals.
- Where a web construct has no RN equivalent, **say so and stop** — do not
  approximate. Text stroke is the live example: nothing stroked gets built, and
  `docs/stroked-elements.md` is the hand-off list.
- Where the board draws no state (loading, error, offline, disabled,
  permission-denied), **ask**. Mark the gap `TODO(design):` and leave it
  rendering nothing rather than inventing UI.

Two shadows, never conflated: `shadows.hardEdge(n)` is the solid offset edge
(`shadowRadius: 0`, opacity 1); `shadows.elevation` is an ordinary blurred
shadow. Getting this wrong is the fastest way to make the app look wrong.

## Architecture

```
src/api/        the only place that imports the Supabase client
src/app/        expo-router routes and layouts; routing and composition only
src/components/ui, icons — shared primitives from the board
src/features/   auth, billing — feature-scoped hooks and providers
src/lib/        supabase, queryClient, haptics, planDate, env
src/native/     stubs for native capability we don't have yet
src/planner/    the chunking algorithm: pure, tested, no I/O
src/theme/      tokens, subject mapping
```

- Components under ~150 lines. Logic goes in hooks.
- Server state is TanStack Query; local UI state is Zustand. No component keeps
  its own copy of a Supabase row.
- Screens never import `src/lib/supabase` — they go through `src/api`.
- Haptics go through `src/lib/haptics`, never `expo-haptics` directly, and fire
  on **press-in** alongside the visual press state.
- The planner is pure. It takes `now` as an argument so it can be tested; never
  call `new Date()` inside it.
- `src/lib/planDate.ts` owns the **03:00 day boundary**. Never compute a plan
  day anywhere else, or the scheduler and the streak will disagree.

## Stub seams

`src/native/appBlocking.ts`, `src/features/billing/usePro.ts`, and Apple/Google
sign-in in `SessionProvider` all follow the same pattern: the real interface
exists, the implementation is mocked or throws a clear message, and callers
never branch on the platform. They gate nothing today.

**We develop in Expo Go until the paywall (2.10).** `react-native-purchases`
and `expo-apple-authentication` are deliberately **not installed** — importing
a native module inside Expo Go crashes the app. Anything that can only be
verified in a native build costs a cloud build cycle, so flag it rather than
writing it.

## Security

- RLS on every table, `user_id = auth.uid()`, no exceptions.
- `chunk_completions` is append-only: select and insert policies only. Never add
  an update or delete policy — the lifetime count depends on it.
- No secrets in the repo. `EXPO_PUBLIC_*` is bundled into the binary and is
  public; treat it as printed on the App Store page. Service-role and model
  provider keys live in Edge Functions.
- **Never open or print `.env`.** Read variables by name through `src/lib/env.ts`.
- No LLM calls from the client. All AI goes through an Edge Function that holds
  the key, authenticates the user and rate limits.
- Sessions in `expo-secure-store`, never AsyncStorage.

## Process

- Plan first. One batch at a time; do not build ahead.
- Before a batch, list the files it will touch. After it, say what was built,
  what is stubbed, and where the RN result may differ from the board.
- Commit after each approved batch. No mock data in committed code.
- Open questions are raised **one at a time, at the screen that needs them** —
  not batched (this supersedes §9.1 of the brief for questions 13–17, 19, 20).

## Commands

```
npm test          jest — the planner's spec suite
npm run typecheck tsc --noEmit, strict
npx expo start    Expo Go on a physical iPhone; there is no local simulator
```
