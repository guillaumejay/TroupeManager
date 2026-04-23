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
  scenarioOrigine?: string; // scenario id — origine de la blessure/convalescence courante
}

export interface BlesseInfo {
  marineId: string;
  details: string;
}

export interface Scenario {
  id: string;
  nom: string;
  date: string; // "YYYY-MM-DD"
  participants: string[]; // marine ids — qui est parti en mission (morts/blessés compris)
  morts: string[]; // marine ids (⊆ participants)
  blesses: BlesseInfo[]; // marineId ⊆ participants
}

export type MarineUpdateReason = 'sheet' | 'health';

export interface MarineUpdate {
  marineId: string;
  conditionPhysique: ConditionPhysique;
  etatPsychologique: EtatPsychologique;
  dateDebutIndispo?: string;
  dureeJours?: number;
  scenarioMort?: string;
  scenarioOrigine?: string;
}

interface DomainEventBase {
  id: string;
  timestamp: string;     // ISO 8601 wall-clock (secondary sort)
  dateCampagne: string;  // "YYYY-MM-DD" in-world (primary sort, also filter key)
}

export type DomainEvent =
  | (DomainEventBase & { type: 'marine-added'; marine: Marine })
  | (DomainEventBase & {
      type: 'marine-field-updated';
      marineId: string;
      field: keyof Marine;
      value: Marine[keyof Marine];
    })
  | (DomainEventBase & {
      type: 'marine-fields-updated';
      marineId: string;
      fields: Partial<Marine>;
      reason: MarineUpdateReason;
    })
  | (DomainEventBase & {
      type: 'scenario-added';
      scenario: Scenario;
      marineUpdates: MarineUpdate[];
    });

export type EventType = DomainEvent['type'];

export interface CampaignState {
  events: DomainEvent[];       // kept sorted by (dateCampagne, timestamp)
  dateCourante: string;        // campaign clock — latest date reached
  dateObservation: string;     // view cursor (≤ dateCourante)
  highlightedMarineIds: string[];
}

export interface DerivedView {
  marines: Marine[];
  scenarios: Scenario[];
}

export type CampaignAction =
  | { type: 'UPDATE_MARINE'; marineId: string; field: keyof Marine; value: Marine[keyof Marine] }
  | { type: 'UPDATE_MARINE_FIELDS'; marineId: string; fields: Partial<Marine>; reason: MarineUpdateReason }
  | { type: 'ADD_MARINE'; marine: Marine }
  | { type: 'ADVANCE_DAY' }
  | { type: 'ADD_SCENARIO'; scenario: Scenario; marineUpdates: MarineUpdate[] }
  | { type: 'UPDATE_SCENARIO'; scenarioId: string; scenario: Scenario; marineUpdates: MarineUpdate[] }
  | { type: 'SET_OBSERVATION_DATE'; date: string }
  | { type: 'SHIFT_OBSERVATION_DATE'; days: number }
  | { type: 'REWIND_TO_OBSERVATION' }
  | { type: 'HIGHLIGHT_MARINES'; marineIds: string[] }
  | { type: 'CLEAR_HIGHLIGHT' }
  | { type: 'LOAD_STATE'; state: CampaignState };
