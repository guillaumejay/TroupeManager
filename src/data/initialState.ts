import type { Marine, Scenario, CampaignState } from '../types';

export const INITIAL_MARINES: Marine[] = [
  { id: 'm01', nom: 'Windtalker', grade: 'Caporal', specialisation: 'Comtech', conditionPhysique: 'RAS', etatPsychologique: 'Léger trouble' },
  { id: 'm02', nom: 'Badaboum', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'RAS', etatPsychologique: 'Anxieux' },
  { id: 'm03', nom: 'Quickie', grade: '2nd', specialisation: 'Recon', conditionPhysique: 'Blessure légère', etatPsychologique: 'RAS' },
  { id: 'm04', nom: 'Scrabble', grade: '2nd', specialisation: 'Medic', conditionPhysique: 'RAS', etatPsychologique: 'Léger trouble' },
  { id: 'm05', nom: 'Crash Test', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'Convalescence', etatPsychologique: 'Instable', dateDebutIndispo: '2186-03-04', dureeJours: 51 },
  { id: 'm06', nom: 'Papi', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm07', nom: 'Mule', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-05', scenarioMort: 's03' },
  { id: 'm08', nom: 'Phoebe', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 52 },
  { id: 'm09', nom: 'Mike', grade: '2nd', specialisation: 'NRBC', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 64 },
  { id: 'm10', nom: 'Marina', grade: '2nd', specialisation: 'Comtech', conditionPhysique: 'Convalescence', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-03', dureeJours: 52 },
  { id: 'm11', nom: 'Vet', grade: '2nd', specialisation: 'Medic', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm12', nom: 'Shinji', grade: '2nd', specialisation: 'Sniper', conditionPhysique: 'RAS', etatPsychologique: 'RAS' },
  { id: 'm13', nom: 'Eric', grade: '2nd', specialisation: 'Fusilier', conditionPhysique: 'RAS', etatPsychologique: 'RAS', dateDebutIndispo: '2186-03-05', dureeJours: 1 },
  { id: 'm14', nom: 'Boris', grade: '2nd', specialisation: 'Heavy', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-04', scenarioMort: 's02' },
  { id: 'm15', nom: 'Dembele', grade: '2nd', specialisation: 'SmartGun', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-03', scenarioMort: 's01' },
  { id: 'm16', nom: 'Julia', grade: 'Caporale', specialisation: 'Comtech', conditionPhysique: 'MORT', etatPsychologique: 'MORT', dateDebutIndispo: '2186-03-03', scenarioMort: 's01' },
];

export const INITIAL_SCENARIOS: Scenario[] = [
  {
    id: 's01',
    nom: 'Pioneer Station',
    date: '2186-03-03',
    morts: ['m16', 'm15'], // Julia, Dembele
    blesses: [
      { marineId: 'm09', details: 'Blessure grave' }, // Mike
      { marineId: 'm10', details: 'Blessure grave' }, // Marina
      { marineId: 'm08', details: 'Blessure grave' }, // Phoebe
    ],
  },
  {
    id: 's02',
    nom: 'Dead Hills',
    date: '2186-03-04',
    morts: ['m14'], // Boris
    blesses: [
      { marineId: 'm05', details: 'Blessure grave' }, // Crash Test
    ],
  },
  {
    id: 's03',
    nom: "Berkeley's Docks",
    date: '2186-03-05',
    morts: ['m07'], // Mule
    blesses: [
      { marineId: 'm13', details: 'Blessure légère' }, // Eric
    ],
  },
];

export const INITIAL_DATE = '2186-03-05';

export const INITIAL_STATE: CampaignState = {
  marines: INITIAL_MARINES,
  scenarios: INITIAL_SCENARIOS,
  dateCourante: INITIAL_DATE,
  highlightedMarineIds: [],
};
