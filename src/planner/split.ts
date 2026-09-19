/**
 * Step 2 — cut one assignment into chunks.
 */

import {
  DIFFICULTY_ADJUST,
  MAX_CHUNKS_PER_ASSIGNMENT,
  MAX_CHUNK_MINUTES,
  MIN_CHUNK_MINUTES,
  TARGET_MINUTES,
} from './constants';
import { resolve } from './resolve';
import type { Assignment, History, Prefs, SplitChunk } from './types';

function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

function roundTo5(minutes: number): number {
  return Math.max(5, Math.round(minutes / 5) * 5);
}

/**
 * Chunk titles.
 *
 * A photo gives us page ranges and problem numbers, so it is the only source
 * that can produce a title worth reading. Everything else gets "Part 2 of 5",
 * which is honest. Don't overthink it (spec, step 2).
 */
function titleFor(assignment: Assignment, index: number, count: number): string {
  if (count === 1) return assignment.title;
  return `Part ${index} of ${count}`;
}

export function split(assignment: Assignment, prefs: Prefs, history: History): SplitChunk[] {
  const { minutes, difficulty } = resolve(assignment, history);

  const target = clamp(
    TARGET_MINUTES[prefs.chunkLength] * DIFFICULTY_ADJUST[difficulty],
    MIN_CHUNK_MINUTES,
    MAX_CHUNK_MINUTES,
  );

  const count = clamp(Math.round(minutes / target), 1, MAX_CHUNKS_PER_ASSIGNMENT);

  // Rounding to 5 can push a chunk over the ceiling on a long assignment cut
  // into few pieces. The ceiling is hard, so it wins.
  const per = Math.min(roundTo5(minutes / count), MAX_CHUNK_MINUTES);

  return Array.from({ length: count }, (_, i) => ({
    assignmentId: assignment.id,
    index: i + 1,
    title: titleFor(assignment, i + 1, count),
    plannedMinutes: per,
  }));
}
