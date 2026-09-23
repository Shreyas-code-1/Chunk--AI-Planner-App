/**
 * Mode inference and first actions (engine v2 §1, §3).
 *
 * Keyword match on the title, then the class. Deterministic and instant — no
 * model call. It will be wrong sometimes, which is why the mode chip on 3.6
 * cycles with one tap.
 */

import type { Mode } from './types';

/** Checked in this order, so "lab report" is writing before "report" matches anything else. */
const TITLE_KEYWORDS: readonly (readonly [Mode, RegExp])[] = [
  ['memorizing', /\b(vocab\w*|flash ?cards?|terms|formulas?|dates|memori[sz]e\w*|quizlet)\b/],
  [
    'writing',
    /\b(essays?|papers?|write[- ]?ups?|lab reports?|responses?|reflections?|paragraphs?|drafts?)\b/,
  ],
  [
    'problems',
    /\b(problem sets?|psets?|homework|hw|mcqs?|questions?|exercises?|worksheets?|ch\.? ?\d+)\b/,
  ],
  ['reading', /\b(read\w*|chapters?|articles?|annotat\w*|pages?|pp\.?|novel|textbook)\b/],
];

const MATH_FAMILY =
  /\b(math\w*|alg\w*|geometry|calc\w*|precalc\w*|trig\w*|stat\w*|chem\w*|physics|physical science)\b/;

export function isMathFamily(className: string | null): boolean {
  return className != null && MATH_FAMILY.test(className.toLowerCase());
}

export function inferMode(title: string, className: string | null): Mode {
  const text = title.toLowerCase();
  for (const [mode, pattern] of TITLE_KEYWORDS) {
    if (pattern.test(text)) return mode;
  }
  return isMathFamily(className) ? 'problems' : 'reading';
}

export const FIRST_ACTIONS: Record<Mode, string> = {
  problems: 'Do question 1',
  writing: 'Write one sentence — any sentence',
  reading: 'Read the first page',
  memorizing: 'Flip the first card',
};

/** The line the student reads before the timer starts. */
export function firstActionFor(mode: Mode, custom: string | null): string {
  const trimmed = custom?.trim();
  return trimmed ? trimmed : FIRST_ACTIONS[mode];
}

const CYCLE: readonly Mode[] = ['problems', 'writing', 'reading', 'memorizing'];

/** The chip on 3.6 cycles through the four in a fixed order. */
export function nextMode(mode: Mode): Mode {
  return CYCLE[(CYCLE.indexOf(mode) + 1) % CYCLE.length];
}
