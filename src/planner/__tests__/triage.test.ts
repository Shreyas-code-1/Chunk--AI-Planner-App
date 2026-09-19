/**
 * When they can't finish everything.
 *
 * The point of Moore-Hodgson here is not throughput, it's that the student is
 * asked rather than silently buried.
 */

import { triage } from '../triage';
import { NOW, assignment, dueIn, noHistory, prefs } from './fixtures';

describe('triage', () => {
  it('keeps everything when the work fits', () => {
    const work = [
      assignment({ minutes: 60, dueAt: dueIn(4) }),
      assignment({ minutes: 60, dueAt: dueIn(6) }),
    ];

    const { kept, atRisk } = triage(work, prefs(), noHistory, NOW);

    expect(kept).toHaveLength(2);
    expect(atRisk).toHaveLength(0);
  });

  it('flags the largest assignment, not the one that tipped it over', () => {
    // 120 minutes a day, everything due in two days: 240 minutes available.
    const essay = assignment({ title: 'History essay', minutes: 300, dueAt: dueIn(2) });
    const small = [
      assignment({ title: 'Bio reading', minutes: 60, dueAt: dueIn(2) }),
      assignment({ title: 'Alg problems', minutes: 60, dueAt: dueIn(2) }),
    ];

    const { kept, atRisk } = triage([essay, ...small], prefs(), noHistory, NOW);

    expect(atRisk.map((a) => a.title)).toEqual(['History essay']);
    expect(kept.map((a) => a.title).sort()).toEqual(['Alg problems', 'Bio reading']);
  });

  it('saves several small assignments rather than one big one', () => {
    const work = [
      assignment({ title: 'big', minutes: 400, dueAt: dueIn(3) }),
      assignment({ title: 's1', minutes: 40, dueAt: dueIn(3) }),
      assignment({ title: 's2', minutes: 40, dueAt: dueIn(3) }),
      assignment({ title: 's3', minutes: 40, dueAt: dueIn(3) }),
    ];

    const { kept, atRisk } = triage(work, prefs(), noHistory, NOW);

    expect(kept.length).toBeGreaterThan(atRisk.length);
    expect(atRisk.map((a) => a.title)).toContain('big');
  });

  it('accounts for weekday factors when deciding what fits', () => {
    const work = [assignment({ minutes: 300, dueAt: dueIn(3) })];

    // Three light days can hold it; three busy days cannot.
    const light = triage(work, prefs({ weekdayFactors: [1.3, 1.3, 1.3, 1.3, 1.3, 1.3, 1.3] }), noHistory, NOW);
    const busy = triage(work, prefs({ weekdayFactors: [0.4, 0.4, 0.4, 0.4, 0.4, 0.4, 0.4] }), noHistory, NOW);

    expect(light.atRisk).toHaveLength(0);
    expect(busy.atRisk).toHaveLength(1);
  });

  it('falls back to the class median when sizing unestimated work', () => {
    const work = [assignment({ classId: 'bio', minutes: null, dueAt: dueIn(3) })];
    const { kept } = triage(work, prefs(), noHistory, NOW);

    expect(kept).toHaveLength(1); // 45-minute default fits comfortably
  });
});
