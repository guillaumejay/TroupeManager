import type { ConditionPhysique, EtatPsychologique, Specialisation } from '../types';

export const GRADE = {
  SECOND: '2nd',
  FIRST: '1st',
  CAPORAL: 'Caporal',
  CAPORALE: 'Caporale',
  SERGENT: 'Sergent',
  LIEUTENANT: 'Lieutenant',
} as const;

export const GRADES: readonly string[] = Object.values(GRADE);

export const SPECIALISATION = {
  FUSILIER: 'Fusilier',
  COMTECH: 'Comtech',
  MEDIC: 'Medic',
  SMARTGUN: 'SmartGun',
  RECON: 'Recon',
  SNIPER: 'Sniper',
  NRBC: 'NRBC',
  HEAVY: 'Heavy',
} as const satisfies Record<string, Specialisation>;

export const SPECIALISATIONS: readonly Specialisation[] = Object.values(SPECIALISATION);

export const CONDITION_PHYSIQUE = {
  RAS: 'RAS',
  BLESSURE_LEGERE: 'Blessure légère',
  BLESSURE_GRAVE: 'Blessure grave',
  CONVALESCENCE: 'Convalescence',
  MORT: 'MORT',
} as const satisfies Record<string, ConditionPhysique>;

export const CONDITIONS_PHYSIQUES: readonly ConditionPhysique[] = Object.values(CONDITION_PHYSIQUE);

export const ETAT_PSYCHOLOGIQUE = {
  RAS: 'RAS',
  LEGER_TROUBLE: 'Léger trouble',
  ANXIEUX: 'Anxieux',
  INSTABLE: 'Instable',
  MORT: 'MORT',
} as const satisfies Record<string, EtatPsychologique>;

export const ETATS_PSYCHOLOGIQUES: readonly EtatPsychologique[] = Object.values(ETAT_PSYCHOLOGIQUE);
