/**
 * Step 2 — the ramp (engine v3 §3–§4), and the hard 55-minute ceiling.
 */

import {
  MAX_CHUNKS_PER_ASSIGNMENT,
  MAX_CHUNK_MINUTES,
  MIN_CHUNK_MINUTES,
  MIN_DREADED_FIRST_CHUNK_MINUTES,
} from '../constants';
import { split } from '../split';
import type { ChunkLengthPref, Dread, Mode } from '../types';
import { assignment, noHistory, prefs } from './fixtures';

const MODES: Mode[] = ['memorizing', 'problems', 'reading', 'writing'];
const DREADS: Dread[] = ['fine', 'meh', 'dreading'];
const PREFS: ChunkLengthPref[] = ['short', 'mixed', 'long'];

const lengths = (
  minutes: number,
  mode: Mode,
  dread: Dread,
  chunkLength: ChunkLengthPref = 'mixed',
) =>
  split(assignment({ minutes, mode, dread }), prefs({ chunkLength }), noHistory).map(
    (c) => c.plannedMinutes,
  );

type Case = {
  mode: Mode;
  dread: Dread;
  chunkLength: ChunkLengthPref;
  minutes: number;
  chunks: number[];
};

/** Every combination the student can produce, 1 to 400 minutes. */
function* everyCase(): Generator<Case> {
  for (const mode of MODES)
    for (const dread of DREADS)
      for (const chunkLength of PREFS)
        for (let minutes = 1; minutes <= 400; minutes++)
          yield {
            mode,
            dread,
            chunkLength,
            minutes,
            chunks: lengths(minutes, mode, dread, chunkLength),
          };
}

describe('split — the ramp', () => {
  /** Cases breaking a rule, so a failure names the input rather than just "false". */
  const violations = (broken: (c: Case) => boolean) => [...everyCase()].filter(broken).slice(0, 5);

  it('ascends within an assignment, and the first chunk is always the shortest', () => {
    expect(
      violations(({ chunks }) =>
        chunks.some((v, i) => i > 0 && (i === 1 ? v <= chunks[0] : v < chunks[i - 1])),
      ),
    ).toEqual([]);
  });

  it('never breaks the ascending order to absorb rounding, and keeps the total', () => {
    // Totals that aren't multiples of 5 are the ones that force drift.
    expect(
      violations(({ chunks, minutes }) => chunks.reduce((t, v) => t + v, 0) !== minutes),
    ).toEqual([]);
  });

  it('never exceeds 55 or falls below 12 (10 for a dreaded first chunk)', () => {
    expect(
      violations(({ chunks, dread }) => {
        if (Math.max(...chunks) > MAX_CHUNK_MINUTES) return true;
        if (chunks.length > MAX_CHUNKS_PER_ASSIGNMENT) return true;
        if (chunks.length === 1) return false; // a whole small task is its own size
        const firstFloor =
          dread === 'dreading' ? MIN_DREADED_FIRST_CHUNK_MINUTES : MIN_CHUNK_MINUTES;
        return chunks[0] < firstFloor || chunks.slice(1).some((v) => v < MIN_CHUNK_MINUTES);
      }),
    ).toEqual([]);
  });

  it('keeps a 20-minute task as one chunk', () => {
    for (const mode of MODES)
      for (const dread of DREADS) expect(lengths(20, mode, dread)).toEqual([20]);
  });

  it('keeps a task as one chunk when the rest would be smaller than the first chunk', () => {
    // Writing base 45, dreaded first chunk 25: 45 - 25 = 20 < 25.
    expect(lengths(45, 'writing', 'dreading')).toEqual([45]);
  });

  it('opens a dreaded task shorter than a non-dreaded one of equal length', () => {
    for (const mode of MODES) {
      for (const minutes of [120, 180, 240]) {
        expect(lengths(minutes, mode, 'dreading')[0]).toBeLessThan(
          lengths(minutes, mode, 'fine')[0],
        );
      }
    }
  });

  it('opens a dreaded writing task at 25 minutes (45 × 0.55)', () => {
    expect(lengths(120, 'writing', 'dreading')[0]).toBe(25);
  });

  it('gives reading longer chunks than problems for equal total minutes', () => {
    for (const minutes of [60, 90, 120, 180, 240]) {
      const reading = lengths(minutes, 'reading', 'meh');
      const problems = lengths(minutes, 'problems', 'meh');
      expect(Math.max(...reading)).toBeGreaterThan(Math.max(...problems));
      expect(reading.length).toBeLessThanOrEqual(problems.length);
    }
  });

  it('lets mode set length, and dread only the first chunk', () => {
    // The top of the ramp is the mode's, whatever the dread.
    for (const mode of MODES) {
      const tops = DREADS.map((dread) => Math.max(...lengths(240, mode, dread)));
      expect(Math.max(...tops) - Math.min(...tops)).toBeLessThanOrEqual(5);
    }
    expect(Math.max(...lengths(240, 'writing', 'meh'))).toBeGreaterThan(
      Math.max(...lengths(240, 'memorizing', 'meh')),
    );
  });

  it('scales with the 2.6 chunk-length answer', () => {
    expect(Math.max(...lengths(240, 'reading', 'meh', 'long'))).toBeGreaterThan(
      Math.max(...lengths(240, 'reading', 'meh', 'short')),
    );
  });
});

describe('split — titles', () => {
  it('gives a single-chunk assignment its own title, not "Part 1 of 1"', () => {
    const chunks = split(
      assignment({ title: 'Finish lab write-up', minutes: 25 }),
      prefs(),
      noHistory,
    );
    expect(chunks).toHaveLength(1);
    expect(chunks[0].title).toBe('Finish lab write-up');
  });

  it('numbers multi-chunk parts plainly', () => {
    const chunks = split(
      assignment({ title: 'Essay', minutes: 90, mode: 'reading' }),
      prefs(),
      noHistory,
    );
    expect(chunks.map((c) => c.title)).toEqual([
      'Essay · Part 1 of 3',
      'Essay · Part 2 of 3',
      'Essay · Part 3 of 3',
    ]);
  });
});
