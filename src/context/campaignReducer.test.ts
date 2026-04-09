import { describe, it, expect } from 'vitest';
import { campaignReducer } from './campaignReducer';
import { INITIAL_STATE } from '../data/initialState';
import type { CampaignState, Scenario, MarineUpdate } from '../types';

function makeState(overrides?: Partial<CampaignState>): CampaignState {
  return { ...INITIAL_STATE, ...overrides };
}

describe('campaignReducer', () => {
  describe('UPDATE_MARINE', () => {
    it('updates a marine field', () => {
      const state = makeState();
      const next = campaignReducer(state, {
        type: 'UPDATE_MARINE',
        marineId: 'm01',
        field: 'grade',
        value: 'Sergent',
      });
      expect(next.marines.find((m) => m.id === 'm01')!.grade).toBe('Sergent');
    });

    it('does not mutate other marines', () => {
      const state = makeState();
      const next = campaignReducer(state, {
        type: 'UPDATE_MARINE',
        marineId: 'm01',
        field: 'grade',
        value: 'Sergent',
      });
      expect(next.marines.find((m) => m.id === 'm02')!.grade).toBe('2nd');
    });
  });

  describe('ADVANCE_DAY', () => {
    it('advances the date by one day', () => {
      const state = makeState({ dateCourante: '2186-03-05' });
      const next = campaignReducer(state, { type: 'ADVANCE_DAY' });
      expect(next.dateCourante).toBe('2186-03-06');
    });
  });

  describe('ADD_SCENARIO', () => {
    it('adds a scenario and updates marines', () => {
      const state = makeState();
      const scenario: Scenario = {
        id: 's04',
        nom: 'Test Mission',
        date: '2186-03-06',
        morts: ['m01'],
        blesses: [],
      };
      const marineUpdates: MarineUpdate[] = [
        {
          marineId: 'm01',
          conditionPhysique: 'MORT',
          etatPsychologique: 'MORT',
          dateDebutIndispo: '2186-03-06',
          scenarioMort: 's04',
        },
      ];
      const next = campaignReducer(state, {
        type: 'ADD_SCENARIO',
        scenario,
        marineUpdates,
      });
      expect(next.scenarios).toHaveLength(4);
      expect(next.scenarios[3].nom).toBe('Test Mission');
      expect(next.marines.find((m) => m.id === 'm01')!.conditionPhysique).toBe('MORT');
    });
  });

  describe('HIGHLIGHT_MARINES', () => {
    it('sets highlighted marine ids', () => {
      const state = makeState();
      const next = campaignReducer(state, {
        type: 'HIGHLIGHT_MARINES',
        marineIds: ['m01', 'm02'],
      });
      expect(next.highlightedMarineIds).toEqual(['m01', 'm02']);
    });
  });

  describe('CLEAR_HIGHLIGHT', () => {
    it('clears highlighted marine ids', () => {
      const state = makeState({ highlightedMarineIds: ['m01'] });
      const next = campaignReducer(state, { type: 'CLEAR_HIGHLIGHT' });
      expect(next.highlightedMarineIds).toEqual([]);
    });
  });

  describe('LOAD_STATE', () => {
    it('replaces entire state', () => {
      const state = makeState();
      const newState = makeState({ dateCourante: '2186-12-25' });
      const next = campaignReducer(state, { type: 'LOAD_STATE', state: newState });
      expect(next.dateCourante).toBe('2186-12-25');
    });
  });
});
