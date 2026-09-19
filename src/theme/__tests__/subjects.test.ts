/**
 * The class-name mapping has to be predictable, because the student never sees
 * the rule — they only see that "AP Biology 2" and "Bio" are the same colour.
 */

import { subjectFor } from '../subjects';
import { subjectChips } from '../tokens';

describe('subjectFor', () => {
  it('maps the four subjects the board draws', () => {
    expect(subjectFor('Biology').key).toBe('bio');
    expect(subjectFor('Algebra II').key).toBe('alg');
    expect(subjectFor('English').key).toBe('eng');
    expect(subjectFor('History').key).toBe('his');
  });

  it('ignores case, course numbers and AP/Honors prefixes', () => {
    const names = ['Biology', 'AP Biology 2', 'bio', 'HONORS BIOLOGY'];
    const keys = names.map((name) => subjectFor(name).key);

    expect(new Set(keys)).toEqual(new Set(['bio']));
  });

  it('groups the maths under one chip', () => {
    for (const name of ['Pre-Calculus', 'Geometry', 'Statistics', 'Math 3']) {
      expect(subjectFor(name).key).toBe('alg');
    }
  });

  it('prefers the more specific term when two could match', () => {
    // "social studies" is History, not English, even though both tables are
    // full of school-sounding words.
    expect(subjectFor('Social Studies').key).toBe('his');
  });

  it('falls back to the neutral chip and three letters', () => {
    const chip = subjectFor('Chemistry');

    expect(chip.key).toBe('neutral');
    expect(chip.abbrev).toBe('Che');
    expect(chip.background).toBe(subjectChips.neutral.background);
  });

  it('strips the prefix before taking the three letters', () => {
    expect(subjectFor('AP Chemistry').abbrev).toBe('Che');
    expect(subjectFor('Spanish 3').abbrev).toBe('Spa');
  });

  it('is deterministic: the same name always gives the same chip', () => {
    const a = subjectFor('Physics 1');
    const b = subjectFor('Physics 1');
    expect(a).toEqual(b);
  });

  it('never returns an empty abbreviation', () => {
    for (const name of ['Physics', '???', 'A', 'AP']) {
      expect(subjectFor(name).abbrev.length).toBeGreaterThan(0);
    }
  });
});
