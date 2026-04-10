export type Specialisation =
  | 'Fusilier'
  | 'Comtech'
  | 'Medic'
  | 'SmartGun'
  | 'Recon'
  | 'Sniper'
  | 'NRBC'
  | 'Heavy';

export type ConditionPhysique =
  | 'RAS'
  | 'Blessure légère'
  | 'Blessure grave'
  | 'Convalescence'
  | 'MORT';

export type EtatPsychologique =
  | 'RAS'
  | 'Léger trouble'
  | 'Anxieux'
  | 'Instable'
  | 'MORT';

export interface Marine {
  id: string;
  nom: string;
  grade: string;
  specialisation: Specialisation;
  conditionPhysique: ConditionPhysique;
  etatPsychologique: EtatPsychologique;
  dateDebutIndispo?: string; // "YYYY-MM-DD"
  dureeJours?: number; // undefined for "Définitive"
  scenarioMort?: string; // scenario id
}

export interface BlesseInfo {
  marineId: string;
  details: string;
}

export interface Scenario {
  id: string;
  nom: string;
  date: string; // "YYYY-MM-DD"
  morts: string[]; // marine ids
  blesses: BlesseInfo[];
}

export interface CampaignState {
  marines: Marine[];
  scenarios: Scenario[];
  dateCourante: string; // "YYYY-MM-DD"
  highlightedMarineIds: string[];
}

export type CampaignAction =
  | { type: 'UPDATE_MARINE'; marineId: string; field: keyof Marine; value: Marine[keyof Marine] }
  | { type: 'ADD_MARINE'; marine: Marine }
  | { type: 'ADVANCE_DAY' }
  | { type: 'ADD_SCENARIO'; scenario: Scenario; marineUpdates: MarineUpdate[] }
  | { type: 'HIGHLIGHT_MARINES'; marineIds: string[] }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'LOAD_STATE'; state: CampaignState };

export interface MarineUpdate {
  marineId: string;
  conditionPhysique: ConditionPhysique;
  etatPsychologique: EtatPsychologique;
  dateDebutIndispo?: string;
  dureeJours?: number;
  scenarioMort?: string;
}
