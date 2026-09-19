# Chunk — Implementation Brief

## 1. What we're building

Chunk is a mobile app for high school students. It takes their assignments and
cuts them into short, finishable "chunks," then lays those chunks out as a
simple daily path they follow. There's also a study layer (scan, ask, quiz,
flashcards) built from the student's own materials.

Single user. No sharing, no social, no collaboration. Solo project.

**iOS only.** Do not write Android code, Android config, or platform branches
for Android. No `Platform.OS === 'android'` paths, no Android permissions, no
`android/` config in app.json beyond what Expo requires by default. If
something has an Android-specific consideration, skip it.

Dev note: I'm on Windows, so there's no local iOS simulator. I test in Expo Go
on a physical iPhone, and via EAS + TestFlight for dev builds. Keep this in
mind — anything that can only be verified in a native build costs me a cloud
build cycle, so flag it when you write something I can't test in Expo Go.

Later (not now): during a focus session, distracting apps get blocked.

Brand: orange palette, hand-drawn feel, a beaver mascot named Chunk who guides
the user and speaks in short encouraging lines.

## 2. Stack — fixed, do not substitute

- React Native + Expo, running on an **Expo Dev Client build** (not Expo Go —
  RevenueCat and Apple Sign In are native modules)
- TypeScript, strict mode
- Expo Router (file-based routing)
- Supabase — auth, Postgres, row-level security
- RevenueCat (`react-native-purchases`) — **mandatory**, do not propose
  alternatives
- TanStack Query for server state, Zustand for local UI state
- `react-native-reanimated` for animation
- Expo Notifications for reminders
- iOS only — no Android targets, no Play Console, no Android testing
- `expo-camera` + `expo-image-picker` for scanning

Ask before adding any library not on this list.

## 3. Design — read this before anything else

The design is **final**. It was produced in Claude Design and lives in the
attached board file: all 26 screens, labeled 2.1 through 5.4.

The board is HTML/CSS. This app is React Native. You are **translating**, not
reimplementing and not redesigning.

Rules:

1. Do not change any visual decision — spacing, colors, type sizes, weights,
   corner radii, shadow offsets, layout. Preserve exact values. Do not round,
   harmonize, or "clean up" the scale.
2. Where a web construct has no RN equivalent (CSS grid, `position: fixed`,
   `-webkit-text-stroke`, `paint-order`, certain box-shadows), tell me the
   substitution you're making and why. Do not silently approximate.
   - Note specifically: the logo and display type use a stroke effect that RN
     can't do natively. Flag this early — we may need an SVG or image asset.
   - The "hard bottom edge" button shadow is a solid offset shadow, not a blur.
     Match it exactly using iOS shadow properties (shadowColor, shadowOffset,
     shadowOpacity, shadowRadius: 0).
3. If a state is missing from the board (loading, error, offline, disabled,
   permission-denied), **stop and ask me**. Do not invent UI.
4. Fonts: Baloo 2 (display/titles) and Nunito (body/labels). Load via
   `expo-font` or `@expo-google-fonts`.

## 4. Phase 0 — before any screen

Do these in order, stopping after each for my review.

**0a.** Ask me every clarifying question you have. Wait for answers.

**0b.** Propose the Supabase schema — tables, columns, relationships, RLS
policies. Wait for approval before creating anything.

**0c.** Build the design foundation and stop:
- `src/theme/tokens.ts` — colors, typography scale, spacing, radii, shadows,
  extracted from the board
- `src/components/ui/` — shared primitives matching the board exactly:
  `Button` (pressable with hard bottom edge, pressed state), `Card`,
  `Input`, `Chip` (subject chips), `Slider`, `Toggle`, `SpeechBubble`
  (mascot speech), `PathNode` (done / now / locked), `StatsStrip`,
  `BottomDock`, `ProgressRing`

I will review these against the board before you touch any screen.

**0d.** Scaffold: Expo Router structure, Supabase client, typed API layer,
auth session handling with `expo-secure-store`, error boundaries, and a
`src/native/appBlocking.ts` stub (see §8).

**0e.** Write `CLAUDE.md` capturing the conventions you establish.

## 5. The screens

25 screens in 5 groups (2.7 reworked, see below). Build them in batches of 3–5, in this order. Stop after
each batch, tell me what you built, what's stubbed, and what you need from me.

### Row 02 — Onboarding (10 screens, one reworked)

**2.1 SPLASH**
Logo only. Show while checking auth session and cached onboarding state. Route
to 2.2 (new), 3.1 (returning + onboarded), or the onboarding step they left
off at. Add a minimum display duration so it doesn't flash.

**2.2 WELCOME**
Headline "Let's chunk today's work." Two buttons: GET STARTED → 2.3, and
I ALREADY HAVE AN ACCOUNT → sign-in. Sign-in supports email, Apple, and
Google via Supabase (see §6).

**2.3 GOALS**
Multi-select from five options: getting started at all, staying organized,
hitting deadlines, studying for tests, focusing for longer. At least one must
be selected to continue. Persist to the user profile — these steer the
mascot's copy later, so store them as an enum array, not free text.

**2.4 NAME + GRADE**
Text input for name, single-select for grade (10/11/12). If a school account
was connected, it shows a prefilled card with avatar initials, school name, and
a CHANGE affordance. Validate name is non-empty. Continue is disabled until
both are set.

**2.5 CLASSES**
List of classes, each with a colored subject chip (Bio, Alg, Eng, His), class
name, and period + teacher line. User adds, edits, removes. Chip color and
abbreviation are derived from the class name — build a deterministic mapping
and let me review it. Need at least one class to continue.

**2.6 STUDY STYLE**
Two controls. CHUNK LENGTH: a three-position selector (20 short / 20–45 mixed /
50 long). BEST TIME OF DAY: a range slider from 6 AM to 11 PM. Plus a
time-per-day target. These feed the chunking algorithm directly, so store them
in a typed preferences object.

**2.7 ADD YOUR FIRST WORK** *(replaces the old IMPORT WORK screen)*
The old screen offered Google Classroom / Canvas / Schoology. Those are cut —
do not build them, and do not leave any UI referencing them. A visible control
that does nothing is an App Store rejection under App Completeness.

This screen now offers the three real input methods (§5a): take a photo,
say it out loud, or type it. The student must add **at least one** assignment
here — onboarding cannot proceed with an empty plan, because 2.8 and 2.9 have
nothing to show without it.

Copy shift: this is no longer "import everything you have," it's "let's add one
thing so I can show you how this works." Lower ask, and it doubles as a tutorial
for the input methods they'll use daily.

Design note: the existing 2.7 frame has three option cards, so the layout
survives — the content changes, not the structure. Confirm with me before
altering any visual.

**2.6b YOUR WEEK** *(new screen — I will supply the design)*
Seven day pills, each tapped to light / normal / busy. Feeds the spreading and
day-balancing algorithm directly — without it, work gets scheduled onto
practice nights and the plan is wrong by day three.

**2.6c WHEN YOU START** *(new screen — I will supply the design)*
"Something's due Friday. When do you start?" — as soon as I can / a few days
before / the day before. Calibrates how aggressively the scheduler front-loads.

**2.8 BUILDING YOUR PLAN**
Processing screen. A checklist that fills in sequence: reading your schedule,
sorting by due date, cutting work into chunks, fitting them in your week. Shows
a live count. This is real work happening (the chunking run), not a fake timer —
but it needs a minimum duration so the steps are readable. Handle the failure
case: if chunking fails, where do we go? Ask me.

**2.9 YOUR FIRST PLAN**
The payoff screen. "2 hours became 5 chunks." A LOAD PER DAY bar chart and a
preview of today's first chunks. Numbers come from the actual generated plan.

Note: with 2.7 reduced to one assignment, the numbers here will be smaller than
the board shows. The board's "10 hours became 21 chunks" assumed a bulk import.
Do not fake larger numbers. If one assignment makes this screen feel thin, tell
me — we may add a "want to add more?" affordance rather than inflate it.

**2.10 PAYWALL**
RevenueCat. Two plans shown: Family ($9.99/mo, 12mo $119.99) and Individual
($7.99/mo, 12mo $95.99), with a 7-day free trial and a MOST POPULAR badge.
Three benefit lines.
- Read products, prices, and periods from the RevenueCat offering at runtime.
  Never hardcode IDs or prices — the board's numbers are placeholders.
- Implement purchase, restore purchases (Apple requires it), and an app-wide
  entitlement hook (`usePro()`).
- Ask me before adding any gate: which screens and features are Pro-only, and
  whether the paywall is skippable, is not decided yet.

### Row 03 — Core product (7 screens)

**3.1 HOME**
The daily dashboard. Avatar + date header, "Hi Maya" greeting, a mascot speech
bubble ("3 chunks left — 1 hr 25"), a stats strip (chunks today, minutes
focused, all-time chunks, streak), and an UP NEXT card with the next chunk and
its start time. Bottom dock navigation.
The speech bubble copy is dynamic — build a small rules-based copy generator
keyed on time of day, chunks remaining, and streak state. Show me the rules
before implementing.

**3.2 TODAY — PATH**
The week strip (12–18) with the selected day, then today's chunks as a vertical
path: done / now / locked nodes. Each node shows class chip, task title, and
duration. Tapping the current node starts a focus session (3.3). Header shows
total time remaining. Locked nodes are not tappable — confirm with me whether
users can start out of order.

**3.3 FOCUS — RUNNING**
The timer screen. Countdown (18:42 of 24 min), the chunk description and a
one-line hint, ambient sound options (lo-fi, rain), PAUSE and FINISH CHUNK.
- Timer must survive backgrounding — persist start time and compute elapsed
  from wall clock, never from a JS interval alone.
- Keep the screen awake (`expo-keep-awake`).
- Ask me: what happens if the user leaves the app? Pause, keep running, or warn?
- This is where app blocking will hook in later (§8).

**3.4 CHUNK COMPLETE**
Celebration. "Chunk 3 done!", mascot line, stats (minutes focused, chunks
today, day streak), an offer to turn the notes into flashcards, and two
buttons: TAKE A 10-MIN BREAK or STRAIGHT INTO CHUNK 4. The break option should
schedule a notification.

**3.5 ALL WORK**
Assignment list grouped by TODAY / TOMORROW / THIS WEEK / LATER, with an
Upcoming / Done tab. Each row: subject chip, title, chunks left, time, due
date, and a progress percentage. Header shows total hours left.

**3.6 ADD ASSIGNMENT**
Form: title, class (chips), due date (picker), estimated length, difficulty
(easy/medium/hard selector), optional notes. On submit, run chunking and go
to 3.7.

**3.7 THE CHUNKING MOMENT**
Result screen. "2 hours became 5 chunks," then the chunk list with each one's
title, scheduled time, and duration, with the next-up one marked. Confirm or
adjust before saving.

**Ask me before building 3.6/3.7:** the chunking algorithm is the heart of the
product and I haven't specified it. I need to tell you how it splits work, how
it schedules around the user's available time, and what happens on conflicts.
Don't invent it.

### Row 04 — Study tools (5 screens)

**4.1 SCAN TO CHUNK**
Camera view with a framing guide, a reading state, then detected assignments
listed with due dates, and CHUNK BOTH. Needs camera permission handling — ask
me for the denied-permission design. The extraction itself is an LLM call;
ask me which provider and how we handle failure.

**4.2 ASK CHUNK**
Chat with the mascot, scoped to the user's assignments and notes. Shows source
chips ("FROM YOUR NOTES"), suggested follow-ups, and quick actions: Explain,
Quiz me, Cards, Simplify. Streaming responses. Needs message persistence and a
clear empty state.

**4.3 STUDY MODES**
Menu for one assignment: Flashcards, Quiz me, One-page summary, Audio recap,
Something else. Each shows a subtitle with generated specifics ("18 cards from
your headings"). A mascot recommendation line at the bottom based on what's due
soonest.

**4.4 QUIZ**
One multiple-choice question at a time with a 4/5 progress indicator, four
options, and immediate feedback with an explanation. NEXT QUESTION advances.
Track which questions were missed.

**4.5 QUIZ RESULT**
Score (80%, 4 of 5), a NAILED IT / TO REVIEW split, the missed questions listed
under WORTH ANOTHER LOOK, and two buttons: REVIEW THE ONE I MISSED, BACK TO MY
PATH.

**Flashcards and audio recap are referenced in 4.3 but have no screen on the
board.** Flag this — I need to either supply designs or cut them from v1.

### Row 05 — Progress, profile & states (4 screens)

**5.1 PROGRESS**
Week view (May 12–18) with streak, total focused time, week-over-week delta, a
TIME PER DAY bar chart with a goal line, chunks done, finish rate, and a BY
CLASS breakdown.

**5.2 PROFILE**
Avatar, name, grade + school, three stats (streak, chunks, badges), and a badge
grid (First chunk, Week streak, On time ×10, Deep work) with earned and unearned
states. Settings entry point — the settings screen isn't on the board, flag it.

**5.3 EMPTY STATE**
All Work with nothing in it. Mascot, a line of copy, and two actions: ADD AN
ASSIGNMENT, SCAN A SYLLABUS. Use this pattern for every other empty state, and
ask me where the board doesn't cover one.

**5.4 URGENT DEADLINE**
A variant of Home with a DUE IN 3 HOURS alert card at the top: the assignment,
DO IT NOW and MOVE TO 7 PM actions, then the rest of today's path below. Define
the trigger threshold with me — when does Home become this?

### Screens not on the board — I owe you designs

These are required and do not exist in the design file. Do not invent them.
Flag each when you reach it and I will supply a design.

**AI consent** (onboarding, after 2.2). Mandatory — see §13a. Names the AI
provider, says what data is sent. Must exist before we can submit.

**Sign in** (from 2.2's "I already have an account"). Email, Apple, Google.
The board shows the entry point but not the screen.

**Settings** (from Profile 5.2). Needs: edit classes, edit availability and
study preferences, notification settings, manage subscription, privacy policy,
terms, sign out, and **delete account**.

**Delete account confirmation.** Required by Apple. Real cascade delete,
two-step confirm, not a soft flag.

**Privacy policy screen.** Placeholder now, copy later.

**Flashcards** and **Audio recap**. Both are offered on 4.3 Study Modes but have
no screen. Until I supply designs, remove those two options from 4.3 rather
than shipping dead buttons.

**Permission denied states** for camera and microphone.

---

## 5a. How work gets in

Three methods, all producing the same Assignment record:

- **Photo** — `expo-camera` → OCR → LLM extraction. Most structure: page ranges,
  problem numbers, dates. The only source that supports meaningful chunk titles.
- **Voice** — `expo-av` record → transcription → LLM extraction. Fastest, least
  structured. Always route through a confirmation screen; transcription errors
  on class names and dates silently corrupt the schedule.
- **Typed** — screen 3.6. Clean fields, but the duration is the student's guess.

All extraction runs in a Supabase Edge Function, never from the client (§11a).

Only a **due date** is required. Missing duration or difficulty falls back —
see the algorithm spec.

## 5b. The chunking algorithm

Specified separately in `chunk-algorithm-spec.md`. Read it before building 2.8,
3.6 or 3.7. Summary: split by target chunk length, spread each assignment across
the days before its due date, balance load across days, never schedule work the
night it's due. Do not invent an alternative.

## 5c. Points, streaks and badges

Specified separately in `chunk-points-system.md`. Key rule: a streak is never
broken by a day with no assigned work. Never award points for time in app or
sessions opened. No leaderboards, no purchasable advantages.

The board already has the displays (streak and count on 3.1 and 5.2, badges on
5.2, stats on 5.1) — no new screens needed.

## 6. Auth

Supabase Auth. Login screen offers email, Apple, and Google.
- Apple: `expo-apple-authentication`. Required by App Store review if Google
  sign-in is offered.
- Google: native sign-in through Supabase OAuth (iOS configuration only).
- All three resolve to one Supabase user; handle account linking by email
  address.
- Persist the session in `expo-secure-store`. Handle token refresh and the
  signed-out → signed-in navigation transition cleanly.

## 7. Animations

**Build only button and press feedback. Nothing else.**

Allowed without asking:
- Button press states — the hard bottom edge compressing on press, per the
  board's COMPONENTS row
- Standard touch feedback on cards, chips, list rows and tabs
- Haptics (see below)
- Default Expo Router screen transitions

### 7a. Haptics — build this in

Use `expo-haptics`. Every interactive element gets tactile feedback, fired on
press-in at the same moment the visual press state starts — not on release.
Visual and haptic must be simultaneous or it feels broken.

Map:
- `ImpactFeedbackStyle.Light` — chips, tabs, list rows, toggles, slider
  detents, week-strip day taps
- `ImpactFeedbackStyle.Medium` — primary buttons (CONTINUE, START, the big
  pressable ones with the hard bottom edge)
- `NotificationFeedbackType.Success` — completing a chunk (3.4), finishing an
  assignment, earning a badge, a correct quiz answer (4.4)
- `NotificationFeedbackType.Warning` — destructive confirmations, a wrong quiz
  answer
- `ImpactFeedbackStyle.Heavy` — use sparingly. Chunk complete (3.4) only.

Rules:
- Wrap it in one helper (`src/lib/haptics.ts`) so it's called consistently and
  can be disabled in one place. Don't call expo-haptics directly from screens.
- Add a haptics toggle in Settings, on by default.
- Respect the system reduce-motion setting.
- Never fire haptics on scroll, on a screen appearing, or repeatedly in quick
  succession. Overused haptics feel cheap fast.

The press animation itself: scale down slightly and compress the button's hard
bottom edge on press-in, release on press-out. Fast — around 100ms in, 150ms
out. This plus the haptic is what makes the app feel physical. Match the
pressed state the board draws in the COMPONENTS row; if the board doesn't show
one for an element, ask.

Everything else waits for me. Do not build:
- Screen entrance or exit animations
- The 2.8 Building Your Plan sequence
- The 3.4 Chunk Complete celebration
- Path node transitions on 3.2
- Progress bars, rings, or counters that animate
- Mascot movement of any kind
- Loading or skeleton animations beyond a plain spinner
- Anything with a spring, stagger, or timed sequence

I will send reference videos for these, telling you the screen and the element.
Until a video arrives, build the static end state — the screen as the board
draws it — and leave a clear seam where the animation will go. Don't approximate
motion from a still frame, and don't add "something simple in the meantime."

When a video does arrive: describe your reading of the motion and wait for my
confirmation before implementing. Use react-native-reanimated.

## 8. App blocking — stub only

Later, focus sessions will block distracting apps. That needs native code:
iOS FamilyControls / Screen Time, which requires a special Apple entitlement
we have to apply for and that isn't guaranteed to be approved.

For now, create `src/native/appBlocking.ts` exposing:
`requestPermission()`, `startBlockingSession(durationMs)`, `endSession()`,
`getStatus()` — returning mocked values. All app code calls this interface only,
never a platform API directly, so the real implementation drops in without
touching screens.

## 9. Working rules

### 9.0 Ask about things that are expensive to undo

Use judgment. Don't ask me about every small thing — ask about the things that
are hard to reverse or that I'd want a say in.

**Always ask, before deciding:**
- Anything that affects the **visual design**. The design is final and I've
  spent real time on it. A color, spacing value, font size, or layout choice
  you invent is worse than a pause. Same for any HTML→RN substitution where
  there's no direct equivalent.
- A **screen or state that doesn't exist** in the board — loading, empty,
  error, offline, permission-denied. Don't design one. I'll supply it.
- **Data model and business rules** — schema shape, what a field means, how
  something should behave when the specs are silent.
- **Architecture** — any library, pattern, or structural choice beyond §2.
- **Anywhere the board and the specs disagree.**
- **Anything you'd have to rip out later** if I said no.

**Just decide, and mention it in your summary:**
- Variable and function names, file organization within the structure we agreed
- Which hook to extract, how to split a component
- Obvious microcopy that matches existing voice on the board
- Implementation details with no user-visible effect
- Test cases

**The test is scope of change, not file count.**

Fine to do without asking — work *within* what we agreed:
- Fixing bugs, crashes, type errors, failing tests
- Refactoring inside a file that doesn't change behavior
- Filling in the implementation of something already planned and approved
- Small corrections that keep the code doing what it already does

Ask first — work that *replaces* what we agreed:
- Rewriting a file wholesale, even one you wrote yourself
- Changing an approach, pattern, or structure we already settled on
- Anything that changes how a screen looks or behaves
- Changing a shared file (tokens, primitives, API layer, schema) in a way that
  affects other screens
- Deleting or replacing working code because you'd do it differently

**When debugging leads somewhere bigger, stop.** If fixing a bug turns out to
need a rewrite or an approach change, that's no longer a fix — tell me what
you found and what you'd change, and wait. Don't let a debugging session
become a redesign.

**I will provide anything you need** — designs, copy, assets, rules, example
data. Nothing is blocked on my end. If you're waiting on me, say so and stop.

Batch your questions into one numbered list at the end of your plan rather than
interrupting repeatedly. If you have none, say so explicitly.

### 9.1 Other rules

- Work in Plan mode. Show me the plan before writing code.
- Every plan ends with a "Questions for you" list, or an explicit "no questions."
  Keep it to what matters per §9.0 — don't pad it with trivia.
- One batch at a time. Do not build ahead.
- Before each batch, list the exact files you'll create or touch.
- After each batch: what you built, what's stubbed, what you need from me, and
  anywhere the RN result may differ visually from the board.
- No mock data left in committed code — wire it to Supabase or ask.
- Every screen that fetches data needs loading, empty, error, and offline
  states. Ask me for any state design the board doesn't have.
- Components under ~150 lines. Logic goes in hooks.
- Commit after each approved batch.

## 10. Out of scope for v1

- Real app blocking (stub only)
- LMS integrations — cut entirely, no UI references
- Flashcards and audio recap — removed from 4.3 until designed
- Any social, sharing, or multi-user feature
- Web version

---

## 11. Security

Split into two passes. The first is architectural and cannot be retrofitted.

### 11a. Phase 0 — build these in from the start

**Row-level security.** Every Supabase table gets RLS enabled with a policy
restricting rows to `auth.uid()`. No table ships without one. Adding RLS after
the app is written means auditing every query you already wrote — do it now.

**Secrets.** No keys in the repo, ever. Use `.env` with `EXPO_PUBLIC_` only for
values that are genuinely public (Supabase anon key, RevenueCat public SDK key).
Everything else — service role key, any LLM provider key — lives in Supabase
Edge Functions and is never bundled into the app. Anything shipped in a mobile
binary is readable by anyone who downloads it; treat `EXPO_PUBLIC_` as "printed
on the App Store page."

**No LLM calls from the client.** All AI requests go through an Edge Function
that holds the key, authenticates the user, and rate limits. A key in the app
bundle will be extracted.

**Sessions.** Store tokens in `expo-secure-store` (Keychain / Keystore), never
AsyncStorage. Short-lived access tokens with refresh. Sign-out must clear local
state and revoke server-side.

**Passwords.** Supabase handles hashing. Do not implement your own — if you find
yourself writing password logic, stop and ask me.

### 11b. Pre-launch pass — do these before shipping

- **Input validation with Zod** on every form and every Edge Function payload.
  Validate server-side even where the client already did; the client is not
  trusted.
- **Rate limiting** on Edge Functions, per user: AI calls, photo scans,
  transcription. These cost money and are the obvious abuse target.
- **File uploads** (photos): validate MIME type and magic bytes, cap size,
  strip EXIF (it carries GPS), store in a private Supabase bucket with signed
  URLs, never a public one.
- **Dependency scan**: `npm audit`, enable Dependabot on the repo.
- **HTTPS only**: no `NSAllowsArbitraryLoads` in the iOS ATS config.
- **CORS**: restrict Edge Function origins rather than `*`.
- **Secret rotation**: document how to rotate each key. Rotate anything that
  has ever been committed, even in a deleted commit.
- **Error messages**: never return stack traces or DB errors to the client.

### 11c. Does not apply to this stack — do not build

Tell me if you disagree, but don't implement these unprompted:
- **CSRF protection** — a cookie-based browser attack. This is a native app
  using bearer tokens.
- **SQL injection defenses** — the Supabase client parameterizes queries. Only
  relevant if we write raw SQL, which we aren't. Ask before adding any raw SQL.
- **Password hashing** — Supabase's job.
- **Security headers** (CSP, HSTS, X-Frame-Options) — these are for web pages.
  Relevant only for the marketing site and privacy policy page, not the app.

### 11d. XSS in React Native

Standard web XSS doesn't apply — RN doesn't have a DOM. The exception is
`react-native-webview`: if any screen renders one, never inject user content or
LLM output into it as HTML. Flag it if a WebView becomes necessary.

---

## 12. Privacy and compliance

**Our users are high school students. This is the real compliance exposure —
treat it as a product requirement, not paperwork.**

- **COPPA** applies to users under 13. Grade selection on 2.4 is 10–12, so
  under-13s shouldn't occur — but add a birth year or age gate and block
  under-13 signup rather than assuming. If we ever want younger users,
  verifiable parental consent is required and that's a separate project.
- **State student privacy laws** (California SOPIPA and equivalents) restrict
  targeted advertising to students and the sale of student data. We do neither
  — but if any LMS integration is built, school-data obligations attach and we
  need to revisit.
- **App Store / Play** require a privacy policy URL and an accurate data safety
  declaration before review. Missing or wrong declarations get builds rejected.

**AI consent — we do need this.** Student schoolwork (photos of handouts, voice
recordings, notes) is being sent to a third-party model provider. That must be
disclosed plainly, not buried:

- A short, readable screen during onboarding explaining what gets sent where
  and what we do with it. Not a wall of legal text.
- Confirm that our provider does not train on our data, and say so.
- Voice recordings: transcribe, then delete the audio. Don't retain it.
- Photos: same — extract, then delete the image unless the student saved it.
- Let students delete their data and their account from within the app. This
  is required by App Store policy and by several state laws.

**Implementation notes:**
- Add a placeholder privacy policy screen and a consent screen now, wired up,
  with copy to be supplied later. Don't leave them to the end — the flows they
  sit in need to exist.
- Log consent: what version, when accepted, per user.
- Keep a short data inventory in the repo: what we collect, where it goes, how
  long we keep it. You'll need it for the store declarations.

I am not a lawyer and neither are you. Build the mechanisms; I'll get the copy
reviewed before launch.

---

## 13. App Store requirements

These are hard stops in review. Build them in; don't discover them at
submission. Verify current requirements against Apple's guidelines before we
submit — these change.

### 13a. Blockers that will get us rejected

**AI consent screen — mandatory since November 2025.** Any app sharing user
data with an external AI service must show a consent screen that names the
specific provider and explains exactly what data is sent. Not a line in the
privacy policy — a screen. We send photos, voice recordings and notes to a
model provider, so this applies squarely to us. Build it into onboarding.

**In-app account deletion.** Any app with account creation must let the user
delete their account from inside the app. A link to a web form does not count.
This needs a real Supabase cascade delete, not a soft flag. Put it on Profile
(5.2) → Settings.

**Sign in with Apple.** Required because we offer Google sign-in. Already
in §6 — this is the rule that makes it non-optional.

**Privacy manifests.** Every third-party SDK we bundle needs one. Miss a single
library and the build is rejected automatically before a human reviews it.
Audit our dependencies for this before the first submission.

**Age rating.** Apple's tiers now include 13+, 16+ and 18+, and the App Store
Connect questionnaire must be completed and current. Our users are students;
answer the questionnaire honestly about the AI chat feature (4.2), since
open-ended AI output affects the rating.

**Privacy nutrition labels.** Must accurately match what we actually collect.
This is why §12 asks for a data inventory in the repo — you'll fill the labels
from it.

**Xcode 26 SDK** required as of April 2026. Make sure our EAS build config uses
a current Xcode image.

### 13b. The most common rejection reason

<40% of unresolved review issues fall under Guideline 2.1, App Completeness:
crashes, placeholder content, and incomplete submission information.>

Practical consequences for how you build:

- **No placeholder content anywhere in a submitted build.** No lorem ipsum, no
  "Coming soon" screens, no dead buttons. The stubbed LMS integrations in §5
  (screen 2.7) must either work or be removed from the UI before submission —
  a visible button that does nothing is a rejection.
- **Every screen must be reachable and functional.** If a screen exists in the
  build, a reviewer will find it.
- **A demo account is required** in App Review Information, with credentials
  that work and a pre-populated plan. Reviewers won't set up classes and
  assignments to see the app work.
- **Permission prompts need clear purpose strings.** Camera, microphone and
  notifications each need an `Info.plist` usage description that says what we
  actually do with it. Vague strings get rejected.

### 13c. Subscriptions (RevenueCat, screen 2.10)

- **Restore Purchases must be visible** on the paywall. Its absence is a
  standard rejection.
- Price, billing period, and trial length must be shown clearly before
  purchase, and must match what's in App Store Connect.
- Links to Terms of Use and Privacy Policy must be on the paywall screen
  itself, not only in settings.
- Products must be configured and in "Ready to Submit" state in App Store
  Connect before submitting the build.
- Auto-renewal terms must be disclosed on the paywall.

### 13d. Also required

- **Privacy policy URL**, publicly reachable, linked in App Store Connect and
  in-app. §12 covers the placeholder screen.
- **Terms of Use** — required once we sell subscriptions.
- **Support URL** with a working contact method.
- **Screenshots** for current required device sizes.
- **TestFlight run before production submission.** Catches crashes and visual
  regressions that would otherwise cost us a rejection cycle.

### 13e. Watch item — age assurance laws

Several US states have app-store accountability laws with 2026 and 2027
effective dates covering age verification, parental consent and data
minimization, and they apply to developers, not just app stores. Our users are
minors, so this is likely to affect us. Don't build for it yet — flag it and I
will get current legal guidance before launch.
