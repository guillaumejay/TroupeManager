import { describe, expect, it } from 'vitest';
import { migrateLegacyState } from './migrateLegacyState';
import { deriveView } from './deriveState';

describe('migrateLegacyState', () => {
  it('returns null for non-legacy shapes', () => {
    expect(migrateLegacyState(null)).toBeNull();
    expect(migrateLegacyState({})).toBeNull();
    expect(migrateLegacyState({ events: [], dateCourante: 'x', dateObservation: 'x' })).toBeNull();
    expect(migrateLegacyState({ marines: [], scenarios: 'nope', dateCourante: 'x' })).toBeNull();
  });

  it('rebuilds an event log whose replay matches the legacy final state', () => {
    const legacy = {
      marines: [
        { id: 'm01', nom: 'Alpha', grade: 'Caporal', specialisation: 'Comtech', conditionPhysique: 'RAS', etatPsychologique: 'Léger trouble' },
        { id: 'm02', nom: 'Bravo', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'Convalescence', etatPsychologique: 'Instable', dateDebutIndispo: '2186-03-04', dureeJours: 5 },
        { id: 'm03', nom: 'Charlie', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-05', scenarioMort: 's02' },
        { id: 'm04', nom: 'Delta', grade: '2nd', specialisation: 'Recon', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
      ],
      scenarios: [
        { id: 's01', nom: 'Pioneer', date: '2186-03-04', morts: [], blesses: [{ marineId: 'm02', details: 'Blessure grave' }] },
        { id: 's02', nom: 'Hills', date: '2186-03-05', morts: ['m03'], blesses: [] },
      ],
      dateCourante: '2186-03-05',
    };

    const migrated = migrateLegacyState(legacy);
    expect(migrated).not.toBeNull();
    if (!migrated) return;

    expect(migrated.dateCourante).toBe('2186-03-05');
    expect(migrated.dateObservation).toBe('2186-03-05');

    const { marines, scenarios } = deriveView(migrated.events, migrated.dateCourante);

    expect(scenarios).toHaveLength(2);
    expect(scenarios.map((s) => s.id)).toEqual(['s01', 's02']);

    const byId = Object.fromEntries(marines.map((m) => [m.id, m]));
    expect(byId.m01).toMatchObject({ conditionPhysique: 'RAS', etatPsychologique: 'Léger trouble' });
    expect(byId.m02).toMatchObject({
      conditionPhysique: 'Convalescence',
      etatPsychologique: 'Instable',
      dateDebutIndispo: '2186-03-04',
      dureeJours: 5,
    });
    expect(byId.m03).toMatchObject({
      conditionPhysique: 'MORT',
      etatPsychologique: 'MORT',
      scenarioMort: 's02',
      dateDebutIndispo: '2186-03-05',
    });
    expect(byId.m04).toMatchObject({ conditionPhysique: 'RAS', etatPsychologique: 'RAS' });
  });

  it('handles an empty scenarios list by seeding at dateCourante', () => {
    const legacy = {
      marines: [
        { id: 'm01', nom: 'Solo', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
      ],
      scenarios: [],
      dateCourante: '2186-03-01',
    };
    const migrated = migrateLegacyState(legacy);
    expect(migrated).not.toBeNull();
    if (!migrated) return;
    const { marines, scenarios } = deriveView(migrated.events, migrated.dateCourante);
    expect(scenarios).toHaveLength(0);
    expect(marines).toHaveLength(1);
    expect(marines[0].id).toBe('m01');
  });

  it('preserves highlightedMarineIds when present', () => {
    const migrated = migrateLegacyState({
      marines: [],
      scenarios: [],
      dateCourante: '2186-03-01',
      highlightedMarineIds: ['m07'],
    });
    expect(migrated?.highlightedMarineIds).toEqual(['m07']);
  });
});
