/**
 * Engine v3 §9 — the learning mechanism, built and dormant.
 */

import { DREAD_FIRST_CHUNK_FACTOR, LEARNING_ENABLED, LEARNING_MIN_SAMPLES } from '../constants';
import { learn, type AbandonedChunk } from '../learning';
import { split } from '../split';
import type { CompletedChunk, Mode } from '../types';
import { NOW, assignment, noHistory, prefs } from './fixtures';

let n = 0;
const done = (mode: Mode, actualMinutes: number, extra: Partial<CompletedChunk> = {}) => ({
  id: `c${++n}`,
  assignmentId: 'a',
  title: 'Chunk',
  plannedMinutes: 25,
  actualMinutes,
  startedAt: NOW,
  endedAt: NOW,
  mode,
  dread: 'meh' as const,
  firstChunk: false,
  ...extra,
});
const left = (): AbandonedChunk => ({
  assignmentId: 'a',
  dread: 'dreading',
  firstChunk: true,
  startedAt: NOW,
});
const dreadedFirst = { dread: 'dreading' as const, firstChunk: true };

describe('learning', () => {
  it('needs five samples before the median chunk length counts', () => {
    const four = [20, 22, 24, 26].map((m) => done('problems', m));
    expect(learn(four, []).chunkMinutes('problems')).toBeNull();
    expect(learn([...four, done('problems', 30)], []).chunkMinutes('problems')).toBe(24);
    expect(learn([...four, done('problems', 30)], []).chunkMinutes('reading')).toBeNull();
  });

  it('eases the dreaded first chunk for a student who finishes dreaded work', () => {
    const finished = Array.from({ length: LEARNING_MIN_SAMPLES }, () =>
      done('writing', 25, dreadedFirst),
    );
    expect(learn(finished, []).dreadedFirstFactor()).toBeGreaterThan(
      DREAD_FIRST_CHUNK_FACTOR.dreading,
    );
  });

  it('deepens it for a student who abandons dreaded work', () => {
    const finished = [done('writing', 25, dreadedFirst), done('writing', 25, dreadedFirst)];
    const abandoned = [left(), left(), left()];
    expect(learn(finished, abandoned).dreadedFirstFactor()).toBeLessThan(
      DREAD_FIRST_CHUNK_FACTOR.dreading,
    );
  });

  it('is dormant: the planner ignores what it learned until the flag is on', () => {
    expect(LEARNING_ENABLED).toBe(false);
    const learned = {
      ...noHistory,
      learnedChunkMinutes: () => 10,
      learnedDreadedFirstFactor: () => 0.9,
    };
    const task = assignment({ minutes: 120, mode: 'reading', dread: 'dreading' });
    expect(split(task, prefs(), learned)).toEqual(split(task, prefs(), noHistory));
  });
});
