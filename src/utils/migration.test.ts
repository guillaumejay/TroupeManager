import { describe, it, expect } from 'vitest';
import type { DomainEvent } from '../types';
import { migrateEvents } from './migration';

describe('migrateEvents', () => {
  it('back-fills participants from morts ∪ blesses when missing', () => {
    const legacy = {
      id: 'scn-legacy',
      timestamp: '2186-03-03T12:00:00Z',
      dateCampagne: '2186-03-03',
      type: 'scenario-added',
      scenario: {
        id: 's1',
        nom: 'Legacy',
        date: '2186-03-03',
        morts: ['m1'],
        blesses: [{ marineId: 'm2', details: 'grave' }, { marineId: 'm1', details: 'grave' }],
      },
      marineUpdates: [],
    } as unknown as DomainEvent;

    const migrated = migrateEvents([legacy]);
    expect(migrated[0].type).toBe('scenario-added');
    if (migrated[0].type !== 'scenario-added') return;
    expect(migrated[0].scenario.participants.sort()).toEqual(['m1', 'm2']);
  });

  it('leaves scenarios with participants unchanged', () => {
    const current: DomainEvent = {
      id: 'scn-current',
      timestamp: '2186-03-03T12:00:00Z',
      dateCampagne: '2186-03-03',
      type: 'scenario-added',
      scenario: {
        id: 's1',
        nom: 'Current',
        date: '2186-03-03',
        participants: ['m1', 'm2', 'm3'],
        morts: ['m1'],
        blesses: [{ marineId: 'm2', details: 'grave' }],
      },
      marineUpdates: [],
    };

    const migrated = migrateEvents([current]);
    expect(migrated[0]).toBe(current);
  });

  it('passes non-scenario events through unchanged', () => {
    const added: DomainEvent = {
      id: 'm-1',
      timestamp: '2186-03-01T00:00:00Z',
      dateCampagne: '2186-03-01',
      type: 'marine-added',
      marine: {
        id: 'm1',
        nom: 'Test',
        grade: '2nd',
        specialisation: 'Fusilier',
        conditionPhysique: 'RAS',
        etatPsychologique: 'RAS',
      },
    };

    expect(migrateEvents([added])[0]).toBe(added);
  });
});
