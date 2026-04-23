import { describe, it, expect } from 'vitest';
import { joursRestants } from './dates';
import { campaignReducer } from '../context/campaignReducer';
import { INITIAL_STATE } from '../data/initialState';

describe('convalescence recalculation on ADVANCE_DAY', () => {
  it('Crash Test goes from 4j to 3j after +1 jour', () => {
    // Initial: date = 2186-03-05, Crash Test started 2186-03-04, 5 days
    const crashTest = INITIAL_STATE.marines.find((m) => m.id === 'm05')!;
    const before = joursRestants(crashTest.dateDebutIndispo, crashTest.dureeJours, INITIAL_STATE.dateCourante);
    expect(before).toBe(4); // 2186-03-04 + 5 = 2186-03-09, current 2186-03-05, diff = 4

    const nextState = campaignReducer(INITIAL_STATE, { type: 'ADVANCE_DAY' });
    expect(nextState.dateCourante).toBe('2186-03-06');

    const after = joursRestants(crashTest.dateDebutIndispo, crashTest.dureeJours, nextState.dateCourante);
    expect(after).toBe(3);
  });

  it('Eric becomes Opérationnel after +1 jour (1 day convalescence)', () => {
    // Eric: started 2186-03-05, 1 day → ends 2186-03-06
    const eric = INITIAL_STATE.marines.find((m) => m.id === 'm13')!;
    const before = joursRestants(eric.dateDebutIndispo, eric.dureeJours, INITIAL_STATE.dateCourante);
    expect(before).toBe(1); // ends 2186-03-06, current 2186-03-05

    const nextState = campaignReducer(INITIAL_STATE, { type: 'ADVANCE_DAY' });
    const after = joursRestants(eric.dateDebutIndispo, eric.dureeJours, nextState.dateCourante);
    expect(after).toBe(0); // 0 means opérationnel
  });
});
