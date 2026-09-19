/**
 * Step 2 — splitting, and the hard 55-minute ceiling.
 */

import { MAX_CHUNKS_PER_ASSIGNMENT, MAX_CHUNK_MINUTES } from '../constants';
import { split } from '../split';
import { assignment, noHistory, prefs } from './fixtures';

describe('split', () => {
  it('cuts an assignment into roughly target-sized chunks', () => {
    const chunks = split(assignment({ minutes: 90, difficulty: 'medium' }), prefs(), noHistory);

    expect(chunks).toHaveLength(3); // 90 / 30
    expect(chunks.map((c) => c.plannedMinutes)).toEqual([30, 30, 30]);
    expect(chunks.map((c) => c.index)).toEqual([1, 2, 3]);
  });

  it('never produces a chunk longer than the one-sitting ceiling', () => {
    // 12 hours of work at the "long" preference: the count cap would otherwise
    // force 60-minute chunks.
    const chunks = split(
      assignment({ minutes: 720, difficulty: 'easy' }),
      prefs({ chunkLength: 'long' }),
      noHistory,
    );

    for (const chunk of chunks) {
      expect(chunk.plannedMinutes).toBeLessThanOrEqual(MAX_CHUNK_MINUTES);
    }
    expect(chunks.length).toBeLessThanOrEqual(MAX_CHUNKS_PER_ASSIGNMENT);
  });

  it('gives a single-chunk assignment its own title, not "Part 1 of 1"', () => {
    const chunks = split(
      assignment({ title: 'Finish lab write-up', minutes: 25, difficulty: 'medium' }),
      prefs(),
      noHistory,
    );

    expect(chunks).toHaveLength(1);
    expect(chunks[0].title).toBe('Finish lab write-up');
  });

  it('numbers multi-chunk parts plainly', () => {
    const chunks = split(assignment({ minutes: 90 }), prefs(), noHistory);
    expect(chunks.map((c) => c.title)).toEqual(['Part 1 of 3', 'Part 2 of 3', 'Part 3 of 3']);
  });

  describe('"mixed" is a 30-minute target, not random variation', () => {
    // Screen 2.6 labels mixed "20-45", which reads like a range. It isn't: the
    // spread comes from difficulty across assignments, and within one
    // assignment every chunk is the same length.
    const lengthsFor = (difficulty: 'easy' | 'medium' | 'hard') =>
      split(assignment({ minutes: 120, difficulty }), prefs({ chunkLength: 'mixed' }), noHistory)
        .map((c) => c.plannedMinutes);

    it('makes easy work longer and hard work shorter', () => {
      expect(lengthsFor('easy')[0]).toBeGreaterThan(lengthsFor('medium')[0]);
      expect(lengthsFor('hard')[0]).toBeLessThan(lengthsFor('medium')[0]);
    });

    it('keeps every chunk in one assignment the same length', () => {
      for (const difficulty of ['easy', 'medium', 'hard'] as const) {
        expect(new Set(lengthsFor(difficulty)).size).toBe(1);
      }
    });
  });
});
