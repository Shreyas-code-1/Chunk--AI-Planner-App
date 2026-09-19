# Phase 0a — Clarifying questions

Per §4 of the implementation brief: every clarifying question, before any
schema or code. Answers get written back into this file and committed, then
carried into `decision-log.md` where they change an approach.

Status: **answered 2026-09-19 for 1–12 and 18** — see the Answers section at the
bottom, which is authoritative where it differs from a question above.
Questions 13–17, 19 and 20 remain open and are raised one at a time at the screen
that needs each.

---

## A. Contradictions between the brief and the current repo

These are places where two documents we have already agreed on disagree. I am
not choosing between them without you.

**1. Expo Go vs. Dev Client.**
§2 fixes the stack on an Expo **Dev Client** build, because RevenueCat and
Apple Sign In are native modules. §1's dev note says you test **in Expo Go** on
a physical iPhone, with EAS/TestFlight for dev builds. Those cannot both be the
default: RevenueCat, Apple Sign In and app blocking will not run in Expo Go at
all.

My proposal — confirm or correct: we develop against **Expo Go for everything
up to 2.9**, which covers the entire design foundation, all of onboarding except
the paywall, and the chunking algorithm. `usePro()` and the auth providers get
interface-level stubs behind the same seam as `appBlocking.ts`. We cut the first
EAS dev build when we reach 2.10 (paywall) and sign-in, and from then on that is
the test target. This costs one cloud build cycle instead of one per batch.

Related: do you have an Apple Developer account, an EAS account, a Supabase
project and a RevenueCat project already, or is part of Phase 0 setting those
up? I need the Supabase project before 0b is real rather than theoretical.

**2. `expo-av` is deprecated.**
§5a specifies `expo-av` for voice recording. `expo-av` was deprecated and
removed from the SDK in favour of `expo-audio` and `expo-video`; on SDK 57 I do
not expect `expo-av` to be installable at all. `expo-audio` is the direct
replacement for recording. §2 says ask before adding any library not on the
list — this is that ask, and I will verify the exact SDK 57 status against the
versioned docs per `AGENTS.md` before installing. Confirm `expo-audio`.

**3. Packages the stack requires that are not installed yet.**
`package.json` currently has only the Expo template's dependencies. §2's stack
needs, at minimum: `@supabase/supabase-js`, `react-native-purchases`,
`@tanstack/react-query`, `zustand`, `expo-secure-store`, `expo-notifications`,
`expo-camera`, `expo-image-picker`, `expo-haptics`, `expo-keep-awake`,
`expo-apple-authentication`, `expo-audio`, `zod`, and the two font families
(Baloo 2, Nunito). These are all already named in the brief, so I read this as
approved and will install them at SDK-57-compatible versions in 0d — say so if
you want to see the list first.

There is also no test runner in the stack. Both specs specify test cases, and
the algorithm is pure functions that are worth testing properly. May I add
`jest` + `jest-expo`? That is a §2 addition, so I am asking.

**4. The design board — which file is canonical? There are now four.**
`reference/` (git-ignored) holds three exports: v1, v2 and v3. Of those, only
**v3** has the full labelled set 2.1–5.4 — v2 stops at 4.5 plus a `5.9`, and v1
has a different row 4 (4.6, 4.7) that no longer exists in the brief. So within
`reference/`, v3 wins.

But four commits pushed to `origin/main` (`82fea0e`…`bd70139`) have since added
three more board files at the repo root:

| file | size | screens |
|---|---|---|
| `CHUNK Board v3.dc.html` (root) | 167,840 B | 2.1–5.4 |
| `reference/CHUNK Board v3.dc.html` | 164,725 B | 2.1–5.4 |
| `CHUNK Design1.html` | 167,849 B | 2.1–5.4 |
| `CHUNK Board v3 (standalone).html` | 9.5 MB | 2.1–5.4 |

All four cover the same screen set and **all four differ in content** — the two
files both called "v3" are not the same file, and `CHUNK Design1.html` is a
near-identical sibling of the root one. The 9.5 MB standalone is presumably the
same board with assets inlined.

I will not guess which of these is the final design. Tell me the one file that
is authoritative, and I will delete or archive the rest — four copies of a
"final" design is exactly how a visual decision silently drifts. Also: was that
upload yours, and is `origin/codex/functional-mobile-web` (a branch that also
appeared on the remote) relevant to us, or dead?

Once you name the canonical file, I would like it committed at a fixed path —
`design/board.html` — rather than left in git-ignored `reference/`. The design
is final and the code is meaningless without it; losing it is the same failure
mode we just fixed twice.

**5. Icons.**
Does the board draw its own icons in the hand-drawn style, or is it using a
system icon set? This decides whether icons become SVG/image assets or
`expo-symbols` (SF Symbols). It affects `src/components/ui/` directly, so I need
it before 0c. Per the §3 rule I will not pick.

---

## B. Data model and rules — needed for 0b (schema)

**6. Day boundaries and timezone.**
A "plan day" is the core unit of both the scheduler and the streak. When does a
day end — midnight local, or a later cutoff like 3 AM (a student working at
12:30 AM is still on "today")? And is the timezone fixed at signup or read from
the device each session? Travel and DST both change streak outcomes, so this
needs to be a stored decision, not an implementation detail.

**7. What `2.6b YOUR WEEK` stores.**
Light / normal / busy per weekday feeds day-balancing. What do those mean
numerically — multipliers on `dailyTargetMinutes` (say 0.5 / 1.0 / 0.25), or
absolute minute caps? The algorithm spec's `balance()` reads a single
`prefs.dailyTargetMinutes`, so this either replaces it per-day or scales it.

**8. What `2.6c WHEN YOU START` does to the scheduler.**
"As soon as I can / a few days before / the day before" calibrates front-loading.
The spec's `spread()` distributes evenly and front-loads the remainder. Does
this setting change the distribution shape, or only the size of the remainder
bias? "The day before" appears to contradict the hard rule that nothing is ever
scheduled on the night it is due — I assume the rule wins and this only shifts
the bias. Confirm.

**9. Chunk length preference mismatch.**
2.6 offers 20 short / 20–45 mixed / 50 long. The algorithm's `TARGET` is
`{short: 20, mixed: 30, long: 50}` — a single number for mixed, where the screen
implies a range. Is "mixed" a 30-minute target, or genuinely variable chunk
lengths within one day?

**10. Class chip colours and abbreviations.**
§2.5 asks for a deterministic name → chip colour + abbreviation mapping, for
your review. What is the palette of chip colours on the board, and how many? And
what happens on collision — two classes both abbreviating to "Bio", or a
seventh class when the palette has six colours?

**11. Assignment deletion and editing.**
Not covered anywhere. If a student deletes or reschedules an assignment whose
chunks are partly done: do completed chunks still count toward the lifetime
counter and past streaks? My assumption is yes — the counter "only goes up" per
the points spec, and retroactively breaking a past streak would be indefensible.
Confirm, because it determines whether chunk history is a separate immutable
table from live chunks.

**12. Age gate placement.**
§12 requires blocking under-13 signup, but no screen on the board collects a
birth year — 2.4 collects grade only. This is a new screen or a new field on an
existing one, and per §3.3 I will not invent it. Where does it go, and what is
the copy when someone is blocked?

---

## C. Screen behaviour — needed when we reach each screen

**13. 2.8 — chunking failure.** The brief explicitly defers this: if the
chunking run fails, where does the student go? Also: what does 2.8 do when the
only assignment added has no due date, which the algorithm spec names as the one
blocking case?

**14. 3.2 — out-of-order starts.** Can a student tap a locked node and start a
later chunk? The board draws locked nodes as not tappable. My instinct is that
blocking it is the wrong call for a homework app — it is their work — but the
board says otherwise and the board wins unless you say so.

**15. 3.3 — leaving the app mid-session.** Pause, keep running, or warn? This
also decides whether a half-finished chunk's `actualMinutes` is trustworthy as
learning data.

**16. 5.4 — urgent deadline threshold.** When does Home become the urgent
variant? The card says "DUE IN 3 HOURS". Is 3 hours the trigger, and does it
fire only when the work is still unfinished? What if two things are urgent at
once — the board draws one card.

**17. 2.10 — what is actually gated.** Which screens and features are Pro-only,
and is the paywall skippable? The brief says this is undecided and to ask before
adding any gate. I will build `usePro()` and gate nothing until you answer.

**18. LLM provider.** Needed for three separate reasons: the Edge Function
implementation, the failure path when extraction fails mid-scan, and — most
importantly — the AI consent screen, which per §13a must **name the specific
provider** or we get rejected. Which provider, and can you confirm they do not
train on our data, since the consent copy has to state that?

**19. The nine screens you owe designs for.** 2.6b, 2.6c, AI consent, sign-in,
settings, delete-account confirmation, privacy policy, camera/mic
permission-denied, and flashcards/audio recap. I will flag each as I reach it
per §5, but two land early: **AI consent sits in onboarding right after 2.2**,
and **sign-in is reachable from 2.2 itself** — both inside the first batch.
Which do you want to supply first?

Related, and cheap to decide now: §10 says flashcards and audio recap are cut
from v1 until designed, and §5 says remove them from 4.3 rather than ship dead
buttons. Confirm I remove both options from the 4.3 menu, leaving Quiz,
One-page summary and Something else.

---

## D. Process

**20. Branching.** §9.1 says commit after each approved batch. Straight onto
`main`, or a branch per batch with a PR? You are the only committer, so `main`
is defensible — but batches are reviewed, and a branch makes "approved" a real
gate rather than a convention.

---

# Answers — 2026-09-19

Recorded here rather than left in conversation. Decisions that change an agreed
approach are also in `decision-log.md`.

**1. Expo Go vs Dev Client — approved as proposed.** Expo Go for Phase 0 and
every batch before the paywall; first EAS dev build at 2.10. `usePro()` and the
auth providers are stubbed behind the same seam as `appBlocking.ts`. **§2 of the
brief is amended accordingly.**

**2. `expo-av` → `expo-audio`.** Approved. Confirmed absent from SDK 57.

**3. `jest` + `jest-expo`.** Approved — the algorithm's tests are in the spec and
are to be real.

**4. Board.** `CHUNK Board v3 (standalone).html` is the single source of truth,
now at `design/board.html`. The other three copies are deleted. Mascot art is
committed at `design/mascot/`. `origin/codex/functional-mobile-web` is dead: not
merged, not deleted.

**5. Icons.** Custom inline SVG, not SF Symbols. One `react-native-svg`
component per icon in `src/components/icons/`, 24×24 viewBox, `fill="none"`,
`stroke="currentColor"`, round caps, **stroke width preserved exactly** (the
board ranges 2.4–3.4). No icon library.

**6. Day boundary.** 03:00 local, not midnight — a student working at 12:30 AM
is still on "today", for both the scheduler and the streak. Device timezone; no
multi-timezone handling in v1.

**7. `weekday_factors`.** Multipliers on `daily_target_minutes`:
**busy 0.4 / normal 1.0 / light 1.3**. A guess, to be tuned against real
completion data. Single source of truth: `WEEKDAY_FACTORS` in
`src/planner/constants.ts`.

**8. `start_style`.** Maps to how many days before the due date the spread
begins: "as soon as I can" → all available days, "a few days before" → 3
(default), "the day before" → 1. It narrows the window; it never overrides the
rule that nothing is scheduled on the night a thing is due.

**9. "Mixed" chunk length.** 30-minute target per the spec. "Mixed" means the
difficulty adjustment has its widest effect (easy 34, hard 24) — *not* that
chunk lengths vary randomly within an assignment.

**10. Subject chips.** The four the board draws (Bio / Alg / Eng / His) are the
palette. Deterministic keyword match from the class name — no hashing. An
unrecognised class gets a neutral grey chip and its first three letters
capitalised.

**11. Chunk history.** An append-only completion log. Live `chunks` are
rewritten by every re-plan and deleted with their assignment; `chunk_completions`
never is, and Postgres enforces it (no UPDATE or DELETE policy). The lifetime
counter and past streaks read from the log, so nothing can rewrite them.

**12. Age gate.** Birth year joins screen 2.4 as a year picker beside grade.
Under-13 signup is blocked with a plain message. Design to be supplied; the
field is built and the visual flagged.

**18. LLM provider.** Anthropic (Claude). The AI consent screen names Anthropic
specifically.

Anthropic's published position, cited rather than asserted: *"By default, we
will not use your inputs or outputs from our commercial products (e.g. Claude
for Work, Anthropic API, Claude Gov, etc.) to train our models."* —
`https://privacy.claude.com/en/articles/7996868-is-my-data-used-for-model-training`,
retrieved 2026-09-19. The documented exception is explicitly submitted feedback,
so the Edge Function must never submit feedback, and the consent copy should say
"by default" rather than an unqualified "never". Re-verify before submission.

**13–17, 19, 20 — still open, by instruction raised one at a time at the screen
that needs each, not batched.** This supersedes §9.1's "batch your questions"
for these specific items.
