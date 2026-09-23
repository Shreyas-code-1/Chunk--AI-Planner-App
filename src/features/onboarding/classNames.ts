/**
 * Whether a typed name on 2.5 CLASSES is a real school class.
 *
 * A name passes if one of its words starts with a known subject stem, so
 * "AP Chem", "Honors English 10" and "Intro to Psych" are accepted and
 * "asdf" or "lol" are not. The list is data and meant to be extended.
 */

/** Matched against the start of any word. */
const SUBJECT_STEMS: readonly string[] = [
  // science
  'bio', 'chem', 'physic', 'science', 'sci', 'anatomy', 'physiolog', 'botany', 'zoolog',
  'ecolog', 'environment', 'earth', 'astronom', 'geolog', 'forensic', 'marine',
  // math
  'math', 'algebra', 'alg', 'geometry', 'geo', 'calc', 'precalc', 'pre-calc', 'trig',
  'statistic', 'stat', 'arithmetic', 'integrated',
  // english and languages
  'english', 'eng', 'lit', 'composition', 'writing', 'reading', 'language',
  'rhetoric', 'journalism', 'creative', 'poetry', 'speech', 'debate',
  'spanish', 'french', 'german', 'latin', 'chinese', 'mandarin', 'japanese', 'korean',
  'italian', 'arabic', 'russian', 'portuguese', 'hindi', 'hebrew', 'sign',
  // social studies
  'history', 'hist', 'social', 'government', 'gov', 'civic', 'econ', 'geograph',
  'psych', 'sociolog', 'anthropolog', 'philosoph', 'law', 'politic', 'world',
  'european', 'humanities', 'religio', 'theolog', 'ethics', 'financ', 'business',
  'accounting', 'marketing',
  // arts
  'art', 'drawing', 'painting', 'ceramic', 'sculpt', 'photo', 'design', 'music', 'band',
  'orchestra', 'choir', 'chorus', 'theat', 'drama', 'dance', 'film', 'media',
  // tech and electives
  'computer', 'comp', 'coding', 'programming', 'robotic', 'engineering', 'tech',
  'digital', 'web', 'data', 'gym', 'fitness', 'health', 'wellness', 'culinary',
  'cooking', 'nutrition', 'shop', 'wood', 'auto', 'agri', 'yearbook', 'leadership',
  'study', 'homeroom', 'seminar', 'research', 'capstone',
];

/** Abbreviations that must be the whole word, so "us" doesn't pass "bus". */
const ABBREVIATIONS: readonly string[] = ['us', 'pe', 'cs', 'asl', 'ela', 'tok', 'apes', 'apush'];

export function isRealClass(name: string): boolean {
  const words = name.toLowerCase().match(/[a-z-]+/g) ?? [];
  return words.some(
    (word) =>
      ABBREVIATIONS.includes(word) || SUBJECT_STEMS.some((stem) => word.startsWith(stem)),
  );
}
