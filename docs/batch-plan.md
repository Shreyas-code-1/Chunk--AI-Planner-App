# Batch plan — 35 screens

Supersedes the 5-batch plan, which assumed a 10-screen onboarding. The 19 Sep
board has **17 onboarding screens** and 35 in total. Screen numbers here are the
board's; the brief still uses the old numbering (mapping in `decision-log.md`).

Ordering principle: **stay in Expo Go as long as possible.** Only 2.16 PAYWALL
needs a native module, so it goes last and costs exactly one cloud build cycle.

| batch | screens | needs from you |
|---|---|---|
| ~~1~~ | ~~2.1, 2.2, 2.3, 2.4, 2.5~~ | **built** (`92ee035`, recoloured in `1c1120d`) |
| 2 | 2.6 STUDY STYLE, 2.7 YOUR WEEK, 2.8 WHEN YOU START, 2.9 WHAT GOES WRONG, **2.17 LOG IN** | nothing — 2.17's design now exists |
| 3 | 2.10 DAILY PACE, 2.11 WITH CHUNK VS ALONE, 2.12 YOUR PROGRESS CURVE, 2.13 IMPORT WORK, 2.14 BUILDING YOUR PLAN | confirm Q13 applies to 2.14 (see below) |
| 4 | 2.15 YOUR FIRST PLAN, 3.1 HOME, 3.2 TODAY — PATH, 3.3 FOCUS — RUNNING, 3.4 CHUNK COMPLETE | stroked assets for 2.15's `21 chunks` |
| 5 | 3.5 ALL WORK, 3.6 ADD ASSIGNMENT, 3.7 THE CHUNKING MOMENT, 5.3 EMPTY STATE, 5.4 URGENT DEADLINE | stroked assets for 3.7's `5 chunks` |
| 6 | 5.1 PROGRESS, 5.2 PROFILE, 5.5 OFFLINE, 5.6 SOMETHING WENT WRONG, **AI consent** | **AI consent has no frame on the board** |
| 7 | 4.1 SCAN TO CHUNK, 4.2 ASK CHUNK, 4.3 STUDY MODES, 4.4 QUIZ, 4.5 QUIZ RESULT | Edge Function; Q18 follow-ups; extraction-failure behaviour |
| 8 | 2.16 PAYWALL | first EAS build; RevenueCat; stroked `7 days free` |

## Why 2.17 LOG IN moved up into batch 2

Three reasons, and the first is the one that matters: it closes 2.2's dead
"I ALREADY HAVE AN ACCOUNT" button, which is the App Completeness rejection
risk. It also gives onboarding a real session, so the draft store built in
batch 1 can finally flush to `profiles`, `preferences` and `classes` — until
then nothing written during onboarding reaches the database. And email sign-in
works in Expo Go; only Apple and Google need the dev build, so those stay
stubbed until batch 8.

## Renumbering that affects answers already given

- **Q13** (chunking fails → inline error, retry, "add it manually" to 3.6) was
  answered against "2.8 BUILDING YOUR PLAN". That screen is now **2.14**. The
  escape target 3.6 is unchanged.
- **Q16** (urgent at 6 hours) targets 5.4, unchanged.
- **Q14** (out-of-order starts) targets 3.2, unchanged.

## Known gaps, by the batch that hits them

- **Batch 2** — 2.6's BEST TIME OF DAY is a two-thumb range slider. The board's
  COMPONENTS row only draws a single-thumb one, so the range variant is still
  unbuilt and flagged.
- **Batch 2** — 2.9 WHAT GOES WRONG, and 2.10–2.12 in batch 3, are new screens
  with no counterpart in the brief. The board says what they look like; nothing
  says what they do. Expect questions at the screen, per the one-at-a-time rule.
- **Batch 6** — **AI consent is the last genuinely undesigned screen.** It is an
  App Store blocker and needs a frame.
- **Any batch** — no field-level error state exists on the board (2.4's empty
  name). 5.5 OFFLINE and 5.6 SOMETHING WENT WRONG now cover the screen-level
  failures, which the old board did not.

## Still outstanding regardless of batch

- Types are hand-written. `supabase gen types` needs `npx supabase login` —
  no CLI token and no Docker on this machine.
- Stroked artwork: six elements, listed in `stroked-elements.md`. Placeholders
  currently render in plain fill (`DRAFT_FILL` in `StrokedText.tsx`) so screens
  are reviewable; that flag flips to `false` when the assets land.
