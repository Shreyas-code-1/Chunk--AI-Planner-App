# Engine v3 — what it breaks, migration, screens, open questions

Written 2026-09-26 against `docs/scheduling-engine-v3.md`, before building.
Nothing below is implemented yet.

## What it breaks

**Planner (`src/planner/`)**

| File | Today | v3 |
|---|---|---|
| `types.ts` | `Difficulty` on `Assignment`, `ScheduledChunk`, `DoneChunk` | Removed. `dread` added; `load` derived. Chunks gain `scheduledEnd`, `pauseAt`; breaks gain `end`; `DayPlan` gains `finishAt`. |
| `constants.ts` | `TARGET_MINUTES` (by 2.6 pref), `DIFFICULTY_ADJUST`, `DIFFICULTY_SCORE`, `WARMUP_MAX_MINUTES` | Replaced by one v3 config block: mode bases, load factors, dread factors, ramp top, floors, pause threshold. |
| `split.ts` | Equal chunks: `minutes / round(minutes / target)` | Rewritten as the ramp. Every existing split test fails by design. |
| `resolve.ts` | Infers difficulty from size; duration fallback is **per class** | Difficulty inference deleted. Duration fallback moves to **per mode**. |
| `schedule.ts` | Due today → warm-up (shortest ≤10m) → batches, hardest batch first, hardest task first | Due today → due tomorrow → later tiers, batched within each tier; opener picked by low dread; most-dreaded **second** in batch. The batch "hardness" sort has no input left (see Q6). |
| `balance.ts` | Carries `difficulty` on placed chunks | Carries `dread`. Logic unchanged. |
| `replan.ts` | Keeps a chunk's old start if it moved <15 min | Conflicts with "everything recalculates live". Not used by any screen yet (they call `plan()`), so it is a doc/test change, but the 15-minute hold has to go for same-day times. |
| tests | `split`, `schedule`, `plan`, `today` assert equal chunks and difficulty ordering | Rewritten; the 12 rule tests from §11 added. |

**Behaviour the student will notice**
- 2.6's **chunk-length preference (short / mixed / long) stops doing anything.** Length now comes from mode. See Q1.
- Chunk sizes change for every existing assignment, so chunk indexes shift. Completions are keyed `assignmentId:index`; a re-cut can mark the wrong chunk done. See Q9.
- Changing dread or mode after starting a task re-cuts it. Same issue.

**App code**
- `features/work/store.ts` — `difficulty` → `dread`; add `setDread`. `Completion` gains `plannedMinutes`, `startedAt`, `mode`, `dread` (needed for "22m (said 25)" and for §9 learning).
- `features/work/usePlan.ts` — history becomes per mode; exposes `finishAt`, `nextAt`; needs a ticking `now` (once a minute) so times actually move live.
- Focus screen timer: needs the midpoint pause and must publish the active chunk's real start so the rest of the evening lays out from it.

## Migration

The app still runs on the memory store (no sign-in), so **there is no real user data to convert.** The migration is schema-only, but it does the difficulty mapping so it is correct if rows exist.

`supabase/migrations/0002_engine_v3.sql`:
1. `create type dread as enum ('fine','meh','dreading')`; `create type mode as enum (...)`.
2. `assignments`: add `dread dread`, `mode mode not null default 'reading'`, `first_action text`. Mode and first action were added to the planner in v2 but **never reached the schema** — this closes that gap.
3. `update assignments set dread = case difficulty when 'easy' then 'fine' when 'medium' then 'meh' when 'hard' then 'dreading' end;` then drop `difficulty` and its enum.
4. `chunks`: add `scheduled_end`, `first_action`, `pause_at`. Lower the planned-minutes floor check from 5 is fine as is; cap stays 55.
5. `chunk_completions` (append-only): add `started_at`, `mode`, `dread`, `chunk_idx`. Planned and actual minutes already exist.
6. New append-only `chunk_outcomes` (or a `status` on completions) to record **skipped / never started** — §9's "if they never start it" can't be learned from completions alone.
7. `preferences`: add `bedtime smallint` (open item 6 in the v2 questions file still has no screen). `chunk_length` stays until Q1 is answered.

Applied by hand from the dashboard, as with 0001 (decision log, 2026-09-19). `src/api/types.ts` updated by hand.

## Screens that change

| Screen | Change | Needs design? |
|---|---|---|
| 3.1 Home | "Next up at 4:23", "Done at 6:55" | Placement of the finish time — it's meant to be prominent |
| 3.2 Today Path | Clock time per chunk and break, pause marker, buffer row, finish line; done chunks show "4:00 · 22m (said 25)" | Yes — break/buffer/pause rows aren't drawn (overlaps v2 open item 8) |
| 3.3 Focus | Finish time under countdown; first action already there; 60-second midpoint pause | The pause state has no frame |
| 3.4 Complete | "Next chunk at 4:43" / "You're done. It's 6:41." | Copy only |
| 3.6 Add | Difficulty row → "How much are you dreading this?" fine / meh / dreading | Reuses the existing 3-tile row |
| 3.2 / 3.5 task rows | Dread chip, one tap to cycle, next to the existing mode chip | Chip exists; placement is `TODO(design)` |
| 5.4 Urgent | Uses the due-today times | No |
| 2.6 Study style | Chunk-length question — see Q1 | Depends on Q1 |
| Bedtime overrun message | Already has no frame (v2 item 9) | Yes |

## Contradictions in the spec — need an answer before building

1. **2.6's chunk-length preference.** Mode now sets length. Remove the question, keep it as a small multiplier (e.g. short 0.85 / mixed 1.0 / long 1.15), or keep it only as the first-run default before mode is known? *Proposal:* multiplier, so the answer the student gave still means something.
2. **Load has no mapping.** Only "writing is high" is stated. If load comes only from mode, base × load is one number per mode and the test "load affects length" can't be separated from "mode affects length". *Proposal:* writing high, problems high, reading medium, memorizing low — and accept that load is really part of the mode constant — or say what else load reads (class? AP/honors in the name?).
3. **Dread factor applies to base or to base × load?** "A dreaded 45-min writing task opens with 25" = 45 × 0.55, ignoring load. With high load it's 45 × 0.9 × 0.55 = 22 → **20**. *Proposal:* apply to base × load (so the opener is 20).
4. **The ramp can't always ascend.** A 45-minute dreaded writing task isn't *under* base, so it splits — but 25 + 20 descends. A 60-minute "meh" problem set gives 20 + 20 + 20: not ascending, first not strictly shortest. Something has to flex. *Proposal:* choose the chunk count first, keep the first chunk at its dread size, let the others rise toward (not exactly to) 1.15× base; if the remainder after the first chunk is smaller than the first chunk, keep it **one chunk**. Allow equal *later* chunks when rounding forces it ("non-decreasing"), but first is always strictly shortest.
5. **The opener can never exist.** It must be under 10 minutes, but the smallest chunk the ramp produces is ~15 (memorizing 18 × 0.85), and the floor is 12. Only a task the student typed as <10 minutes qualifies. Your own example opens with an 18-minute vocab chunk. *Proposal:* opener = the smallest first chunk ≤ 20 minutes among low-dread tasks.
6. **What orders batches now?** v2 put the "hardest batch" first using difficulty, which is gone. *Proposal:* within a tier, batch with the earliest due date first, then higher load first.
7. **Most-dreaded second in a two-task batch** = last. Keep it literal (second), or put it first when the batch has only two?
8. **Example vs rules.** English essay 35m shows a pause, but pauses are for chunks *over* 35. Math 20m → Chem 25m has no break, but the in-batch rule puts one there (45-min batch, 20 ≥ 25 − 5). The buffer is 12 min, not 15% of anything in the example. I'll follow the rules, not the example, unless you say otherwise.
9. **Re-cutting after progress.** Changing dread/mode or finishing chunk 1 re-splits the task and can shift indexes. *Proposal:* once any chunk of a task is done, freeze the finished ones and re-ramp only the remaining minutes, starting from the next chunk (no second "first chunk").
10. **First action "stored on the chunk".** Chunks are disposable and rewritten every re-plan, so a per-chunk edit would be lost. *Proposal:* default per mode, student edit stored per assignment (as today) and copied onto each chunk.
11. **Ramp across days.** When spread puts chunk 1 on Monday and chunk 3 on Wednesday, the dread-shrunk first chunk only applies to Monday. Confirm that's intended (not one small opener per evening per task).
12. **Evening limit and buffer.** "15% of the evening" — of start→(bedtime − 30), or of the planned work? *Proposal:* 15% of the usable window, capped so it never pushes work that fits within the daily target off the day.

## Build order (once answered)

1. Config block + types + ramp `split` + tests.
2. Ordering (tiers, opener, dread-second) + tests.
3. Clock output (`scheduledEnd`, breaks, pauses, `finishAt`) + live `now` + tests.
4. Store/migration: dread, completion fields, outcomes log; learning mechanism dormant behind the 5-sample gate.
5. Screens: times on 3.1–3.4, dread chip, Add screen question.
