/**
 * Step 2 — cut one assignment into chunks (engine v3 §3–§4).
 *
 * Chunks ascend: the first is the commitment, sized down by dread, and the rest
 * climb in roughly equal steps toward 1.15× the mode base. Later chunks may be
 * equal; nothing ever descends.
 */

import {
  CHUNK_LENGTH_FACTOR,
  DREAD_FIRST_CHUNK_FACTOR,
  MAX_CHUNKS_PER_ASSIGNMENT,
  MAX_CHUNK_MINUTES,
  MIN_CHUNK_MINUTES,
  MIN_DREADED_FIRST_CHUNK_MINUTES,
  MODE_BASE_MINUTES,
  RAMP_TOP_FACTOR,
  ROUND_TO_MINUTES,
} from './constants';
import { resolve } from './resolve';
import type { Assignment, History, Mode, Prefs, SplitChunk } from './types';

const round = (minutes: number) => Math.round(minutes / ROUND_TO_MINUTES) * ROUND_TO_MINUTES;

/** Base chunk length for a mode, scaled by the 2.6 answer (v3 Q1). */
export function baseMinutes(mode: Mode, prefs: Prefs): number {
  return MODE_BASE_MINUTES[mode] * CHUNK_LENGTH_FACTOR[prefs.chunkLength];
}

export type RampInput = {
  total: number;
  /** Mode base × chunk-length factor. */
  base: number;
  /** Unrounded target for the first chunk. */
  firstTarget: number;
  /** Lowest the first chunk may go. */
  firstFloor: number;
};

/**
 * `n` chunks: `first`, then a climb in equal steps between first + 5 and `top`
 * that makes up the rest of the total. Null if no such climb exists.
 */
function build(total: number, first: number, n: number, top: number): number[] | null {
  const rest = total - first;
  const m = n - 1;
  const lo = first + ROUND_TO_MINUTES;

  let later: number[];
  if (m === 1) {
    if (rest > top) return null;
    later = [rest];
  } else {
    // Best: one even climb from the first chunk. Failing that, aim the last
    // chunk at the top; if that leaves the second too low, lift it to
    // first + 5 and bring the top down instead.
    let b = (2 * total) / n - first;
    let a = first + (b - first) / m;
    if (b > top || a < lo) {
      b = top;
      a = (2 * rest) / m - b;
    }
    if (a < lo) {
      a = lo;
      b = (2 * rest) / m - lo;
    }
    if (b < a || a > top) return null;
    later = Array.from({ length: m }, (_, j) => round(a + ((b - a) * j) / (m - 1)));
  }

  // Rounding drift goes into a middle chunk, or the next one out if that would
  // break the climb. Sorting keeps it non-decreasing without changing the sum.
  const drift = rest - later.reduce((t, v) => t + v, 0);
  const mid = Math.floor((m - 1) / 2);
  const order = [...later.keys()].sort((x, y) => Math.abs(x - mid) - Math.abs(y - mid) || y - x);
  for (const j of order) {
    const candidate = [...later];
    candidate[j] += drift;
    candidate.sort((x, y) => x - y);
    if (
      candidate[0] > first &&
      candidate[0] >= MIN_CHUNK_MINUTES &&
      candidate[m - 1] <= MAX_CHUNK_MINUTES
    )
      return [first, ...candidate];
  }
  return null;
}

/** Chunk lengths for one task. Exported for the rule tests. */
export function ramp({ total, base, firstTarget, firstFloor }: RampInput): number[] {
  const top = Math.min(MAX_CHUNK_MINUTES, round(base * RAMP_TOP_FACTOR));
  const first = Math.min(top, Math.max(firstFloor, round(firstTarget)));

  // Under its base, or too small to follow the first chunk: one chunk (v3 Q4).
  if (total <= MAX_CHUNK_MINUTES && (total < base || total - first < first)) return [total];

  // Keep the dread-sized first chunk if a climb to the top fits behind it;
  // otherwise shrink it in steps of 5, never below its floor.
  for (let f = first; f >= firstFloor; f -= ROUND_TO_MINUTES) {
    for (let n = 2; n <= MAX_CHUNKS_PER_ASSIGNMENT; n++) {
      const chunks = build(total, f, n, top);
      if (chunks) return chunks;
    }
  }

  // No climb fits under the top (narrow modes like memorizing, where the first
  // chunk and the top are 5 apart): let the last chunk pass the top, up to the
  // cap, taking the gentlest climb — the most chunks — that works.
  for (let f = first; f >= firstFloor; f -= ROUND_TO_MINUTES) {
    for (let n = MAX_CHUNKS_PER_ASSIGNMENT; n >= 2; n--) {
      const chunks = build(total, f, n, MAX_CHUNK_MINUTES);
      if (chunks) return chunks;
    }
  }

  // Only reachable for totals beyond MAX_CHUNKS × cap: equal chunks at the cap.
  const n = Math.ceil(total / MAX_CHUNK_MINUTES);
  const per = Math.floor(total / n);
  return Array.from({ length: n }, (_, i) => (i === n - 1 ? total - per * (n - 1) : per));
}

/**
 * Chunk titles.
 *
 * A photo gives us page ranges and problem numbers, so it is the only source
 * that can produce a title worth reading. Everything else gets "Part 2 of 5",
 * which is honest. Don't overthink it (spec, step 2). The assignment's name
 * leads, because on the Today path a bare "Part 2 of 5" doesn't say of what.
 */
function titleFor(assignment: Assignment, index: number, count: number): string {
  if (count === 1) return assignment.title;
  return `${assignment.title} · Part ${index} of ${count}`;
}

export function split(assignment: Assignment, prefs: Prefs, history: History): SplitChunk[] {
  const { minutes, dread } = resolve(assignment, history);
  const base = baseMinutes(assignment.mode, prefs);
  const lengths = ramp({
    total: minutes,
    base,
    firstTarget: base * DREAD_FIRST_CHUNK_FACTOR[dread],
    firstFloor: dread === 'dreading' ? MIN_DREADED_FIRST_CHUNK_MINUTES : MIN_CHUNK_MINUTES,
  });

  return lengths.map((plannedMinutes, i) => ({
    assignmentId: assignment.id,
    index: i + 1,
    title: titleFor(assignment, i + 1, lengths.length),
    plannedMinutes,
  }));
}
