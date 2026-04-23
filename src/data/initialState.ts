import type { Marine, Scenario, MarineUpdate, DomainEvent, CampaignState } from '../types';

const START_DATE = '2186-03-01';
export const INITIAL_DATE = START_DATE;

// Clean starting roster: everyone RAS/RAS at START_DATE. Pre-existing
// mental/physical quirks from the old hand-crafted seed are dropped — the
// campaign history below (three scenarios) reproduces deaths and convalescences
// by replaying events, which is the only way historical navigation can stay
// coherent.
const SEED_MARINES: Marine[] = [
  { id: 'm01', nom: 'Windtalker', grade: 'Caporal', specialisation: 'Comtech', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm02', nom: 'Badaboum', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm03', nom: 'Quickie', grade: '2nd', specialisation: 'Recon', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm04', nom: 'Scrabble', grade: '2nd', specialisation: 'Medic', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm05', nom: 'Crash Test', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm06', nom: 'Papi', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm07', nom: 'Mule', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm08', nom: 'Phoebe', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm09', nom: 'Mike', grade: '2nd', specialisation: 'NRBC', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm10', nom: 'Marina', grade: '2nd', specialisation: 'Comtech', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm11', nom: 'Vet', grade: '2nd', specialisation: 'Medic', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm12', nom: 'Shinji', grade: '2nd', specialisation: 'Sniper', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm13', nom: 'Eric', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm14', nom: 'Boris', grade: '2nd', specialisation: 'Heavy', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm15', nom: 'Dembele', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm16', nom: 'Julia', grade: 'Caporale', specialisation: 'Comtech', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
];

interface SeedScenario {
  scenario: Scenario;
  updates: MarineUpdate[];
}

const SEED_SCENARIOS: SeedScenario[] = [
  {
    scenario: {
      id: 's01',
      nom: 'Pioneer Station',
      date: '2186-03-03',
      morts: ['m16', 'm15'],
      blesses: [
        { marineId: 'm09', details: 'Blessure grave' },
        { marineId: 'm10', details: 'Blessure grave' },
        { marineId: 'm08', details: 'Blessure grave' },
      ],
    },
    updates: [
      { marineId: 'm16', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-03', scenarioMort: 's01' },
      { marineId: 'm15', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-03', scenarioMort: 's01' },
      { marineId: 'm09', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 6 },
      { marineId: 'm10', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 5 },
      { marineId: 'm08', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 5 },
    ],
  },
  {
    scenario: {
      id: 's02',
      nom: 'Dead Hills',
      date: '2186-03-04',
      morts: ['m14'],
      blesses: [{ marineId: 'm05', details: 'Blessure grave' }],
    },
    updates: [
      { marineId: 'm14', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-04', scenarioMort: 's02' },
      { marineId: 'm05', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-04', dureeJours: 5 },
    ],
  },
  {
    scenario: {
      id: 's03',
      nom: "Berkeley's Docks",
      date: '2186-03-05',
      morts: ['m07'],
      blesses: [{ marineId: 'm13', details: 'Blessure légère' }],
    },
    updates: [
      { marineId: 'm07', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-05', scenarioMort: 's03' },
      { marineId: 'm13', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-05', dureeJours: 1 },
    ],
  },
];

function marineAddedEvent(marine: Marine, index: number): DomainEvent {
  return {
    id: `seed-marine-${marine.id}`,
    timestamp: `${START_DATE}T00:00:${String(index).padStart(2, '0')}.000Z`,
    dateCampagne: START_DATE,
    type: 'marine-added',
    marine,
  };
}

function scenarioAddedEvent(seed: SeedScenario): DomainEvent {
  return {
    id: `seed-${seed.scenario.id}`,
    timestamp: `${seed.scenario.date}T12:00:00.000Z`,
    dateCampagne: seed.scenario.date,
    type: 'scenario-added',
    scenario: seed.scenario,
    marineUpdates: seed.updates,
  };
}

const SEED_EVENTS: DomainEvent[] = [
  ...SEED_MARINES.map(marineAddedEvent),
  ...SEED_SCENARIOS.map(scenarioAddedEvent),
];

export const INITIAL_STATE: CampaignState = {
  events: SEED_EVENTS,
  dateCourante: INITIAL_DATE,
  dateObservation: INITIAL_DATE,
  highlightedMarineIds: [],
};
