import { describe, it, expect } from 'vitest';
import { joursRestants } from './dates';
import { campaignReducer } from '../context/campaignReducer';
import { INITIAL_STATE } from '../data/initialState';
import { deriveView } from './deriveState';
import type { CampaignState } from '../types';

// Advance the seed campaign clock to the end of the seed scenarios so the
// fold yields the pre-refactor "current" state (4 morts, 5 convalescents).
function atDay5(): CampaignState {
  let s = INITIAL_STATE;
  while (s.dateCourante < '2186-03-05') {
    s = campaignReducer(s, { type: 'ADVANCE_DAY' });
  }
  return s;
}

describe('convalescence recalculation on ADVANCE_DAY', () => {
  it('Crash Test goes from 4j to 3j after +1 jour', () => {
    // s02 on 2186-03-04 wounded m05 (Crash Test) for 5 days.
    // At 2186-03-05 → 4 days remaining.
    const s = atDay5();
    const before = deriveView(s.events, s.dateCourante).marines.find((m) => m.id === 'm05')!;
    expect(joursRestants(before.dateDebutIndispo, before.dureeJours, s.dateCourante)).toBe(4);

    const next = campaignReducer(s, { type: 'ADVANCE_DAY' });
    expect(next.dateCourante).toBe('2186-03-06');

    const after = deriveView(next.events, next.dateCourante).marines.find((m) => m.id === 'm05')!;
    expect(joursRestants(after.dateDebutIndispo, after.dureeJours, next.dateCourante)).toBe(3);
  });

  it('Eric becomes Opérationnel after +1 jour (1 day convalescence)', () => {
    // s03 on 2186-03-05 gave m13 (Eric) a 1-day convalescence.
    const s = atDay5();
    const eric = deriveView(s.events, s.dateCourante).marines.find((m) => m.id === 'm13')!;
    expect(joursRestants(eric.dateDebutIndispo, eric.dureeJours, s.dateCourante)).toBe(1);

    const next = campaignReducer(s, { type: 'ADVANCE_DAY' });
    const ericAfter = deriveView(next.events, next.dateCourante).marines.find((m) => m.id === 'm13')!;
    expect(joursRestants(ericAfter.dateDebutIndispo, ericAfter.dureeJours, next.dateCourante)).toBe(0);
  });
});
