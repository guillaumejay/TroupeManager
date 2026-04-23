import { describe, it, expect } from 'vitest';
import { campaignReducer } from './campaignReducer';
import { deriveView } from '../utils/deriveState';
import type { CampaignState, Scenario, MarineUpdate, Marine } from '../types';

function baseState(overrides?: Partial<CampaignState>): CampaignState {
  return {
    events: [],
    dateCourante: '2186-03-05',
    dateObservation: '2186-03-05',
    highlightedMarineIds: [],
    ...overrides,
  };
}

function seedMarine(state: CampaignState, id: string, extra: Partial<Marine> = {}): CampaignState {
  return campaignReducer(state, {
    type: 'ADD_MARINE',
    marine: {
      id,
      nom: `Nom-${id}`,
      grade: '2nd',
      specialisation: 'Fusilier',
      conditionPhysique: 'RAS',
      etatPsychologique: 'RAS',
      ...extra,
    },
  });
}

describe('campaignReducer', () => {
  describe('ADD_MARINE', () => {
    it('pushes a marine-added event at dateObservation', () => {
      const s = baseState({ dateObservation: '2186-03-02' });
      const next = seedMarine(s, 'm01');
      expect(next.events).toHaveLength(1);
      expect(next.events[0].type).toBe('marine-added');
      expect(next.events[0].dateCampagne).toBe('2186-03-02');
    });
  });

  describe('UPDATE_MARINE', () => {
    it('appends a field-updated event and reflects in derived view', () => {
      let s = seedMarine(baseState(), 'm01');
      s = campaignReducer(s, { type: 'UPDATE_MARINE', marineId: 'm01', field: 'grade', value: 'Sergent' });
      const view = deriveView(s.events, s.dateObservation);
      expect(view.marines.find((m) => m.id === 'm01')!.grade).toBe('Sergent');
    });
  });

  describe('UPDATE_MARINE_FIELDS', () => {
    it('merges fields into derived marine', () => {
      let s = seedMarine(baseState(), 'm01');
      s = campaignReducer(s, {
        type: 'UPDATE_MARINE_FIELDS',
        marineId: 'm01',
        reason: 'health',
        fields: { conditionPhysique: 'Blessure légère', etatPsychologique: 'Anxieux' },
      });
      const view = deriveView(s.events, s.dateObservation);
      const m = view.marines.find((x) => x.id === 'm01')!;
      expect(m.conditionPhysique).toBe('Blessure légère');
      expect(m.etatPsychologique).toBe('Anxieux');
    });
  });

  describe('ADVANCE_DAY', () => {
    it('advances the clock by one day', () => {
      const s = baseState({ dateCourante: '2186-03-05', dateObservation: '2186-03-05' });
      const next = campaignReducer(s, { type: 'ADVANCE_DAY' });
      expect(next.dateCourante).toBe('2186-03-06');
      expect(next.dateObservation).toBe('2186-03-06');
    });

    it('does not move dateObservation if it was trailing', () => {
      const s = baseState({ dateCourante: '2186-03-05', dateObservation: '2186-03-02' });
      const next = campaignReducer(s, { type: 'ADVANCE_DAY' });
      expect(next.dateCourante).toBe('2186-03-06');
      expect(next.dateObservation).toBe('2186-03-02');
    });
  });

  describe('ADD_SCENARIO', () => {
    it('appends scenario-added event and applies marine updates', () => {
      // Seed marines at a date earlier than the scenario so the fold sees them first.
      let s = baseState({ dateObservation: '2186-03-01', dateCourante: '2186-03-05' });
      s = seedMarine(s, 'm01');
      s = seedMarine(s, 'm02');
      s = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-04' });
      const scenario: Scenario = {
        id: 's01',
        nom: 'Test',
        date: '2186-03-04',
        morts: ['m01'],
        blesses: [{ marineId: 'm02', details: 'grave' }],
      };
      const updates: MarineUpdate[] = [
        { marineId: 'm01', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-04', scenarioMort: 's01' },
        { marineId: 'm02', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-04', dureeJours: 7 },
      ];
      s = campaignReducer(s, { type: 'ADD_SCENARIO', scenario, marineUpdates: updates });
      const view = deriveView(s.events, s.dateObservation);
      expect(view.scenarios).toHaveLength(1);
      expect(view.marines.find((m) => m.id === 'm01')!.conditionPhysique).toBe('MORT');
      expect(view.marines.find((m) => m.id === 'm02')!.dureeJours).toBe(7);
    });

    it('bumps dateCourante if scenario is in the future', () => {
      const s = baseState({ dateCourante: '2186-03-05' });
      const next = campaignReducer(s, {
        type: 'ADD_SCENARIO',
        scenario: { id: 's01', nom: 'X', date: '2186-03-10', morts: [], blesses: [] },
        marineUpdates: [],
      });
      expect(next.dateCourante).toBe('2186-03-10');
    });

    it('leaves dateCourante alone if scenario is in the past', () => {
      const s = baseState({ dateCourante: '2186-03-05' });
      const next = campaignReducer(s, {
        type: 'ADD_SCENARIO',
        scenario: { id: 's01', nom: 'X', date: '2186-03-02', morts: [], blesses: [] },
        marineUpdates: [],
      });
      expect(next.dateCourante).toBe('2186-03-05');
    });
  });

  describe('SET_OBSERVATION_DATE', () => {
    it('sets a valid observation date', () => {
      const s = baseState({ dateCourante: '2186-03-05' });
      const next = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-02' });
      expect(next.dateObservation).toBe('2186-03-02');
    });

    it('clamps to dateCourante if in the future', () => {
      const s = baseState({ dateCourante: '2186-03-05' });
      const next = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-04-01' });
      expect(next.dateObservation).toBe('2186-03-05');
    });
  });

  describe('SHIFT_OBSERVATION_DATE', () => {
    it('steps the observation date relatively', () => {
      let s = baseState({ dateCourante: '2186-03-05', dateObservation: '2186-03-05' });
      s = campaignReducer(s, { type: 'SHIFT_OBSERVATION_DATE', days: -1 });
      s = campaignReducer(s, { type: 'SHIFT_OBSERVATION_DATE', days: -1 });
      s = campaignReducer(s, { type: 'SHIFT_OBSERVATION_DATE', days: -1 });
      expect(s.dateObservation).toBe('2186-03-02');
    });

    it('clamps to dateCourante when stepping forward past the clock', () => {
      const s = baseState({ dateCourante: '2186-03-05', dateObservation: '2186-03-05' });
      const next = campaignReducer(s, { type: 'SHIFT_OBSERVATION_DATE', days: 3 });
      expect(next.dateObservation).toBe('2186-03-05');
    });
  });

  describe('REWIND_TO_OBSERVATION', () => {
    it('drops future events and aligns dateCourante with observation', () => {
      let s = baseState({ dateObservation: '2186-03-01', dateCourante: '2186-03-05' });
      s = seedMarine(s, 'm01');
      s = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-03' });
      s = campaignReducer(s, { type: 'UPDATE_MARINE', marineId: 'm01', field: 'grade', value: 'Sergent' });
      s = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-04' });
      s = campaignReducer(s, { type: 'UPDATE_MARINE', marineId: 'm01', field: 'grade', value: 'Lieutenant' });
      expect(s.events).toHaveLength(3);

      s = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-03' });
      s = campaignReducer(s, { type: 'REWIND_TO_OBSERVATION' });

      expect(s.dateCourante).toBe('2186-03-03');
      expect(s.dateObservation).toBe('2186-03-03');
      expect(s.events).toHaveLength(2); // marine-added + first field update kept, second dropped
      expect(deriveView(s.events, s.dateCourante).marines[0].grade).toBe('Sergent');
    });

    it('no-ops when observation is already at courante', () => {
      const s = baseState({ dateObservation: '2186-03-05', dateCourante: '2186-03-05' });
      const next = campaignReducer(s, { type: 'REWIND_TO_OBSERVATION' });
      expect(next).toBe(s);
    });
  });

  describe('editing the past', () => {
    it('propagates a past edit forward through the fold', () => {
      let s = seedMarine(baseState({ dateObservation: '2186-03-01', dateCourante: '2186-03-05' }), 'm01');
      s = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-05' });

      expect(deriveView(s.events, '2186-03-05').marines[0].grade).toBe('2nd');

      s = campaignReducer(s, { type: 'SET_OBSERVATION_DATE', date: '2186-03-02' });
      s = campaignReducer(s, { type: 'UPDATE_MARINE', marineId: 'm01', field: 'grade', value: 'Sergent' });

      expect(deriveView(s.events, '2186-03-01').marines[0].grade).toBe('2nd');
      expect(deriveView(s.events, '2186-03-02').marines[0].grade).toBe('Sergent');
      expect(deriveView(s.events, '2186-03-05').marines[0].grade).toBe('Sergent');
    });
  });

  describe('HIGHLIGHT_MARINES / CLEAR_HIGHLIGHT', () => {
    it('sets and clears highlighted ids', () => {
      let s = baseState();
      s = campaignReducer(s, { type: 'HIGHLIGHT_MARINES', marineIds: ['m01', 'm02'] });
      expect(s.highlightedMarineIds).toEqual(['m01', 'm02']);
      s = campaignReducer(s, { type: 'CLEAR_HIGHLIGHT' });
      expect(s.highlightedMarineIds).toEqual([]);
    });
  });

  describe('LOAD_STATE', () => {
    it('replaces state', () => {
      const a = baseState({ dateCourante: '2186-03-05' });
      const b = baseState({ dateCourante: '2199-01-01' });
      const next = campaignReducer(a, { type: 'LOAD_STATE', state: b });
      expect(next.dateCourante).toBe('2199-01-01');
    });
  });
});
