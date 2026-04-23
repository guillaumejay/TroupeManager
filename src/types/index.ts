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

export type MarineUpdateReason = 'sheet' | 'health';

export type EventType =
  | 'marine-added'
  | 'marine-updated'
  | 'marine-sheet-updated'
  | 'marine-health-updated'
  | 'scenario-added'
  | 'day-advanced';

export interface CampaignEvent {
  id: string;
  timestamp: string; // ISO 8601 real-world time
  dateCampagne: string; // campaign date when the event occurred
  type: EventType;
  label: string; // human-readable summary, pre-formatted
}

export interface CampaignState {
  marines: Marine[];
  scenarios: Scenario[];
  dateCourante: string; // "YYYY-MM-DD"
  highlightedMarineIds: string[];
  events: CampaignEvent[];
}

export type CampaignAction =
  | { type: 'UPDATE_MARINE'; marineId: string; field: keyof Marine; value: Marine[keyof Marine] }
  | { type: 'UPDATE_MARINE_FIELDS'; marineId: string; fields: Partial<Marine>; reason: MarineUpdateReason }
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
