/**
 * Estimates that learn (engine v3 §9). Built, and dormant behind
 * LEARNING_ENABLED: the numbers are computed from real completions, but the
 * planner only uses them once that flag is on.
 *
 * Known gap: "never starts it" can only be seen as an abandoned start. A
 * dreaded chunk the student never opens at all leaves no record yet.
 */

import {
  DREAD_FIRST_CHUNK_FACTOR,
  DREAD_LEARN_DEEPEN_AT,
  DREAD_LEARN_EASE_AT,
  DREAD_LEARN_MAX_FACTOR,
  DREAD_LEARN_MIN_FACTOR,
  DREAD_LEARN_STEP,
  LEARNING_MIN_SAMPLES,
} from './constants';
import type { CompletedChunk, Dread, Mode } from './types';

/** A started chunk that was left without finishing. */
export type AbandonedChunk = {
  assignmentId: string;
  dread: Dread;
  firstChunk: boolean;
  startedAt: Date;
};

export type Learned = {
  chunkMinutes(mode: Mode): number | null;
  dreadedFirstFactor(): number | null;
};

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle];
}

export function learn(completions: CompletedChunk[], abandoned: AbandonedChunk[]): Learned {
  return {
    chunkMinutes(mode) {
      const minutes = completions.filter((c) => c.mode === mode).map((c) => c.actualMinutes);
      return minutes.length < LEARNING_MIN_SAMPLES ? null : median(minutes);
    },
    dreadedFirstFactor() {
      const dreaded = (c: { dread: Dread; firstChunk: boolean }) =>
        c.dread === 'dreading' && c.firstChunk;
      const finished = completions.filter(dreaded).length;
      const started = finished + abandoned.filter(dreaded).length;
      if (started < LEARNING_MIN_SAMPLES) return null;

      const rate = finished / started;
      const base = DREAD_FIRST_CHUNK_FACTOR.dreading;
      const factor =
        rate >= DREAD_LEARN_EASE_AT
          ? base + DREAD_LEARN_STEP
          : rate <= DREAD_LEARN_DEEPEN_AT
            ? base - DREAD_LEARN_STEP
            : base;
      return Math.min(DREAD_LEARN_MAX_FACTOR, Math.max(DREAD_LEARN_MIN_FACTOR, factor));
    },
  };
}
