import { describe, it, expect } from 'vitest';
import type { DomainEvent, Marine } from '../types';
import { deriveView, sortEvents } from './deriveState';

function marineAdded(id: string, date: string, timestamp: string, marine: Partial<Marine> = {}): DomainEvent {
  return {
    id: `e-${id}-${timestamp}`,
    timestamp,
    dateCampagne: date,
    type: 'marine-added',
    marine: {
      id,
      nom: `Nom${id}`,
      grade: '2nd',
      specialisation: 'Fusilier',
      conditionPhysique: 'RAS',
      etatPsychologique: 'RAS',
      ...marine,
    },
  };
}

function fieldUpdated(marineId: string, date: string, timestamp: string, field: keyof Marine, value: Marine[keyof Marine]): DomainEvent {
  return {
    id: `fu-${marineId}-${timestamp}`,
    timestamp,
    dateCampagne: date,
    type: 'marine-field-updated',
    marineId,
    field,
    value,
  };
}

describe('deriveView', () => {
  it('returns empty state for empty events', () => {
    const view = deriveView([], '2186-03-05');
    expect(view.marines).toEqual([]);
    expect(view.scenarios).toEqual([]);
  });

  it('adds a marine from marine-added event', () => {
    const events = [marineAdded('m1', '2186-03-01', '2186-03-01T00:00:00Z')];
    const view = deriveView(events, '2186-03-05');
    expect(view.marines).toHaveLength(1);
    expect(view.marines[0].id).toBe('m1');
  });

  it('ignores events after upToDate', () => {
    const events = [
      marineAdded('m1', '2186-03-01', '2186-03-01T00:00:00Z'),
      marineAdded('m2', '2186-03-10', '2186-03-10T00:00:00Z'),
    ];
    const view = deriveView(events, '2186-03-05');
    expect(view.marines).toHaveLength(1);
    expect(view.marines[0].id).toBe('m1');
  });

  it('applies field updates in chronological order', () => {
    const events = [
      marineAdded('m1', '2186-03-01', '2186-03-01T00:00:00Z'),
      fieldUpdated('m1', '2186-03-02', '2186-03-02T00:00:00Z', 'grade', 'Sergent'),
      fieldUpdated('m1', '2186-03-04', '2186-03-04T00:00:00Z', 'grade', 'Lieutenant'),
    ];
    const viewAt2 = deriveView(events, '2186-03-02');
    expect(viewAt2.marines[0].grade).toBe('Sergent');

    const viewAt5 = deriveView(events, '2186-03-05');
    expect(viewAt5.marines[0].grade).toBe('Lieutenant');
  });

  it('applies scenario deaths and wounds', () => {
    const events: DomainEvent[] = [
      marineAdded('m1', '2186-03-01', '2186-03-01T00:00:00Z'),
      marineAdded('m2', '2186-03-01', '2186-03-01T00:00:01Z'),
      {
        id: 'scn-s1',
        timestamp: '2186-03-03T12:00:00Z',
        dateCampagne: '2186-03-03',
        type: 'scenario-added',
        scenario: {
          id: 's1',
          nom: 'Test',
          date: '2186-03-03',
          participants: ['m1', 'm2'],
          morts: ['m1'],
          blesses: [{ marineId: 'm2', details: 'grave' }],
        },
        marineUpdates: [
          { marineId: 'm1', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-03', scenarioMort: 's1' },
          { marineId: 'm2', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 5 },
        ],
      },
    ];
    const viewBefore = deriveView(events, '2186-03-02');
    expect(viewBefore.marines.find((m) => m.id === 'm1')!.conditionPhysique).toBe('RAS');
    expect(viewBefore.scenarios).toHaveLength(0);

    const viewAfter = deriveView(events, '2186-03-03');
    expect(viewAfter.marines.find((m) => m.id === 'm1')!.conditionPhysique).toBe('MORT');
    expect(viewAfter.marines.find((m) => m.id === 'm2')!.dureeJours).toBe(5);
    expect(viewAfter.scenarios).toHaveLength(1);
  });

  it('propagates scenarioOrigine from scenario-added updates', () => {
    const events: DomainEvent[] = [
      marineAdded('m1', '2186-03-01', '2186-03-01T00:00:00Z'),
      {
        id: 'scn-s1',
        timestamp: '2186-03-03T12:00:00Z',
        dateCampagne: '2186-03-03',
        type: 'scenario-added',
        scenario: {
          id: 's1',
          nom: 'Test',
          date: '2186-03-03',
          participants: ['m1'],
          morts: [],
          blesses: [{ marineId: 'm1', details: 'grave' }],
        },
        marineUpdates: [
          { marineId: 'm1', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 10, scenarioOrigine: 's1' },
        ],
      },
    ];
    const view = deriveView(events, '2186-03-05');
    expect(view.marines.find((m) => m.id === 'm1')!.scenarioOrigine).toBe('s1');
  });

  it('ignores updates targeting an unknown marine', () => {
    const events = [
      fieldUpdated('ghost', '2186-03-01', '2186-03-01T00:00:00Z', 'grade', 'Sergent'),
    ];
    const view = deriveView(events, '2186-03-05');
    expect(view.marines).toHaveLength(0);
  });
});

describe('sortEvents', () => {
  it('sorts by dateCampagne then timestamp', () => {
    const events = [
      marineAdded('m2', '2186-03-02', '2186-03-02T10:00:00Z'),
      marineAdded('m1', '2186-03-01', '2186-03-01T15:00:00Z'),
      marineAdded('m3', '2186-03-01', '2186-03-01T09:00:00Z'),
    ];
    const sorted = sortEvents(events);
    expect(sorted.map((e) => e.type === 'marine-added' ? e.marine.id : '')).toEqual(['m3', 'm1', 'm2']);
  });
});
