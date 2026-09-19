# Stroked elements — asset hand-off

Every element in the board that uses `-webkit-text-stroke` / `paint-order`.

**Screen numbers here are the board's.** The brief still uses the older,
shorter onboarding numbering (2.1-2.10 with 2.6b/2.6c); the mapping between
the two is in `docs/decision-log.md`.
Neither property exists in React Native, and the usual approximations (layered
duplicate text, shadow rings) look wrong at these sizes — so **none of these is
being built**. Each is a placeholder that renders nothing until assets land in
`design/assets/`.

Extracted from `design/board.html` via `scripts/extract-board.mjs` (output in `design/extracted/`). Eight
occurrences total; two are the board's own title card, which is not an app
screen, leaving **six real elements**.

---

## 1. Splash logo — screen 2.1

The only one that is not the highlight-chip pattern.

| property | value |
|---|---|
| text | `chunk` |
| font | Baloo 2, weight 800 |
| size | 104px, line-height 0.95, letter-spacing −0.03em |
| fill | `#FFF6E6` |
| stroke | **11px** `#211710` |
| drop shadow | `text-shadow: 0 10px 0 #211710` (hard, no blur) |
| sits on | orange gradient `#FC9633 → #FA7814 45% → #E56C08` |

Needs a transparent-background PNG at @1x/@2x/@3x, or an SVG with the stroke
already outlined to paths. The hard drop shadow can be baked in or left to me —
tell me which; it is reproducible natively as a second layer.

---

## 2–6. The highlight chip

One repeating pattern: an inline rounded chip with stroked white display text.
The **box** is fully reproducible natively (background, 3px border, 16px radius,
`0 5px 0` hard bottom edge). **Only the text inside it is stroked.**

Shared: font Baloo 2 weight 800, fill `#FFF`, stroke **3px** `#3A2A20`,
line-height 1.15, chip padding `0 15px 2px`, border `3px solid #3A2A20`,
border-radius 16px.

| # | screen | rendered text | size | chip bg | chip shadow |
|---|---|---|---|---|---|
| 2 | 2.2 WELCOME | `chunk` | 40px | `#FA7814` | `0 5px 0 #3A2A20` |
| 3 | 2.5 CLASSES | `chunking` | 34px | `#FA7814` | `0 5px 0 #3A2A20` |
| 4 | 2.15 YOUR FIRST PLAN | `21 chunks` | 38px | `#FA7814` | `0 5px 0 #3A2A20` |
| 5 | 2.16 PAYWALL | `7 days free` | 31px | `#FCCC36` | none |
| 6 | 3.7 THE CHUNKING MOMENT | `5 chunks` | 38px | `#FA7814` | `0 5px 0 #3A2A20` |

---

## The problem with 4 and 6 — they are not static text

`21 chunks` and `5 chunks` are **runtime values**. 2.15 renders the real number
from the generated plan, and the brief is explicit that these numbers must not
be faked (§5, which numbers this screen 2.9: "Do not fake larger
numbers"). 3.7 is the same — "2 hours
became 5 chunks" changes with every assignment.

A static PNG or SVG cannot render a number we don't know until the plan runs. So
1, 2, 3 and 5 can be assets and are unblocked the moment you send them, but 4
and 6 need a decision.

### Exactly what varies

The full line is `<N> hours became` / **`<N> chunks`**, where only the chip is
stroked. The surrounding "10 hours became" is ordinary unstroked Baloo 2 at
38px and needs nothing from you.

| | screen 2.15 | screen 3.7 |
|---|---|---|
| chip text | `21 chunks` on the board | `5 chunks` on the board |
| what the number is | total chunks across everything added in 2.7 | chunks in the one assignment just added |
| range | 1 and up (see below) | **1-12** |
| singular at 1 | `1 chunk` | `1 chunk` |

The chip text is always the same shape: an integer, a space, then `chunk` or
`chunks`. Nothing else about it changes — same fill, same stroke, same size on
both screens.

**3.7 is strictly bounded at 12.** `MAX_CHUNKS_PER_ASSIGNMENT` in
`src/planner/constants.ts` caps a single assignment at 12 chunks, so 3.7 has
exactly **12 possible strings**: "1 chunk" through "12 chunks".

**2.15 is bounded in practice but not in principle.** It sums the assignments
added during 2.7, and the brief requires *at least* one. One assignment is the
expected case and stays within the same 12 strings; a student who adds three
could reach the thirties.

This opens a third option you may prefer to either of the ones below: **a set
of 12 assets** ("1 chunk" ... "12 chunks") covers 3.7 completely and 2.15 in the
normal case, with a fallback needed only when 2.15 exceeds 12. No runtime
stroking, no design change, and every number renders exactly as drawn.

The options, then:

- **a. Stroke the text at runtime.** We already have `react-native-svg`, and SVG
  text takes `stroke`/`strokeWidth`. I have not verified it matches: the
  library's text stroke is documented as an *inner* stroke, whereas the board
  uses `paint-order: stroke fill`, which paints the stroke behind the fill —
  visually a thicker, outer edge. I would build one sample and put it next to
  the board on device before we commit to it.
- **b. Drop the stroke on these two only.** White Baloo 2 on the orange chip is
  legible without it. It breaks consistency with 2, 3 and 5.
- **c. Change the design** so the dynamic number sits outside the chip and the
  chip holds fixed text.
- **d. Twelve assets.** "1 chunk" through "12 chunks", as described above. The
  open question is only what 2.15 does above 12 — cap the phrasing, or fall
  back to unstroked for that case.

I am not picking. Tell me which, and whether option (a) is worth the device
check first.

## What unblocks what

Send assets for 1, 2, 3 and 5 whenever convenient — I will build everything
around them in the meantime, and they drop in without touching layout.
4 and 6 need the answer above.
