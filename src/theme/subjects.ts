/**
 * Class name -> subject chip.
 *
 * Deterministic keyword match, never a hash. Hashing would spread colours
 * evenly and be completely arbitrary: "AP Biology 2" and "Bio" would land on
 * different chips, and no one could predict or correct the result. This table
 * is data on purpose — read it, disagree with it, edit it.
 *
 * Anything unrecognised gets the neutral chip and the first three letters, the
 * way the board draws "Che".
 */

import { subjectChips, type SubjectKey } from './tokens';

/**
 * Longer, more specific terms first: "social studies" must win over "studies",
 * and "pre-calculus" must not be beaten by "calc".
 */
const KEYWORDS: ReadonlyArray<readonly [SubjectKey, readonly string[]]> = [
  ['bio', ['biology', 'bio', 'anatomy', 'physiology', 'life science', 'botany', 'zoology']],
  [
    'alg',
    [
      'algebra',
      'pre-calculus',
      'precalculus',
      'calculus',
      'calc',
      'geometry',
      'trigonometry',
      'trig',
      'statistics',
      'stats',
      'math',
    ],
  ],
  [
    'eng',
    ['english', 'literature', 'lit', 'composition', 'writing', 'language arts', 'ela', 'reading'],
  ],
  [
    'his',
    [
      'history',
      'social studies',
      'government',
      'civics',
      'economics',
      'econ',
      'geography',
      'world studies',
    ],
  ],
];

/** Abbreviations for the four named subjects, as the board draws them. */
const ABBREV: Record<SubjectKey, string> = {
  bio: 'Bio',
  alg: 'Alg',
  eng: 'Eng',
  his: 'His',
  neutral: '',
};

export type SubjectChip = {
  key: SubjectKey;
  abbrev: string;
  background: string;
  text: string;
};

/** "CHEMISTRY 2" -> "Che". Strips course numbers and AP/Honors prefixes first. */
function fallbackAbbrev(className: string): string {
  const cleaned = className
    .toLowerCase()
    .replace(/\b(ap|ib|honors|honours|advanced|period)\b/g, ' ')
    .replace(/[^a-z\s]/g, ' ')
    .trim();

  const word = cleaned.split(/\s+/).find((part) => part.length > 0) ?? className.trim();
  const short = word.slice(0, 3);
  return short.charAt(0).toUpperCase() + short.slice(1);
}

export function subjectFor(className: string): SubjectChip {
  const haystack = className.toLowerCase();

  for (const [key, keywords] of KEYWORDS) {
    if (keywords.some((keyword) => haystack.includes(keyword))) {
      return { key, abbrev: ABBREV[key], ...subjectChips[key] };
    }
  }

  return { key: 'neutral', abbrev: fallbackAbbrev(className), ...subjectChips.neutral };
}
