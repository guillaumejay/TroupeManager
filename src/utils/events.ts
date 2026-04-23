import type { Marine, Scenario, MarineUpdate, CampaignEvent, EventType, MarineUpdateReason } from '../types';
import { formatDateDisplay } from './dates';

const FIELD_LABELS: Partial<Record<keyof Marine, string>> = {
  nom: 'Nom',
  grade: 'Grade',
  specialisation: 'Spécialisation',
  conditionPhysique: 'Condition physique',
  etatPsychologique: 'État psychologique',
  dateDebutIndispo: 'Début indispo',
  dureeJours: 'Durée',
  scenarioMort: 'Scénario de mort',
};

function formatValue(field: keyof Marine, value: Marine[keyof Marine]): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field === 'dateDebutIndispo' && typeof value === 'string') {
    return formatDateDisplay(value);
  }
  if (field === 'dureeJours' && typeof value === 'number') {
    return `${value}j`;
  }
  return String(value);
}

function newEvent(type: EventType, dateCampagne: string, label: string): CampaignEvent {
  return {
    id: typeof crypto !== 'undefined' && crypto.randomUUID
      ? crypto.randomUUID()
      : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
    timestamp: new Date().toISOString(),
    dateCampagne,
    type,
    label,
  };
}

export function buildMarineUpdateEvent(
  marine: Marine,
  field: keyof Marine,
  newValue: Marine[keyof Marine],
  dateCampagne: string,
): CampaignEvent | null {
  const oldValue = marine[field];
  if (oldValue === newValue) return null;

  const fieldLabel = FIELD_LABELS[field] ?? String(field);
  const oldFormatted = formatValue(field, oldValue);
  const newFormatted = formatValue(field, newValue);
  const label = `${marine.nom} — ${fieldLabel} : ${oldFormatted} → ${newFormatted}`;

  return newEvent('marine-updated', dateCampagne, label);
}

const REASON_HEADING: Record<MarineUpdateReason, string> = {
  sheet: 'Fiche modifiée',
  health: 'Santé modifiée',
};

const REASON_EVENT_TYPE: Record<MarineUpdateReason, EventType> = {
  sheet: 'marine-sheet-updated',
  health: 'marine-health-updated',
};

export function buildMarineFieldsUpdateEvent(
  marine: Marine,
  fields: Partial<Marine>,
  reason: MarineUpdateReason,
  dateCampagne: string,
): CampaignEvent | null {
  const diffs: string[] = [];
  for (const key of Object.keys(fields) as (keyof Marine)[]) {
    const newValue = fields[key];
    const oldValue = marine[key];
    if (oldValue === newValue) continue;
    const fieldLabel = FIELD_LABELS[key] ?? String(key);
    diffs.push(`${fieldLabel} ${formatValue(key, oldValue)} → ${formatValue(key, newValue)}`);
  }
  if (diffs.length === 0) return null;

  const label = `${marine.nom} — ${REASON_HEADING[reason]} : ${diffs.join(', ')}`;
  return newEvent(REASON_EVENT_TYPE[reason], dateCampagne, label);
}

export function buildMarineAddedEvent(marine: Marine, dateCampagne: string): CampaignEvent {
  const label = `Nouveau marine : ${marine.nom} (${marine.grade}, ${marine.specialisation})`;
  return newEvent('marine-added', dateCampagne, label);
}

export function buildDayAdvancedEvent(oldDate: string, newDate: string): CampaignEvent {
  const label = `Jour avancé : ${formatDateDisplay(oldDate)} → ${formatDateDisplay(newDate)}`;
  return newEvent('day-advanced', newDate, label);
}

export function buildScenarioAddedEvent(
  scenario: Scenario,
  marineUpdates: MarineUpdate[],
  marines: Marine[],
  dateCampagne: string,
): CampaignEvent {
  const nMorts = scenario.morts.length;
  const nBlesses = scenario.blesses.length;
  const parts: string[] = [];
  if (nMorts > 0) {
    const noms = scenario.morts
      .map((id) => marines.find((m) => m.id === id)?.nom ?? id)
      .join(', ');
    parts.push(`${nMorts} mort${nMorts > 1 ? 's' : ''} (${noms})`);
  }
  if (nBlesses > 0) {
    const noms = scenario.blesses
      .map((b) => marines.find((m) => m.id === b.marineId)?.nom ?? b.marineId)
      .join(', ');
    parts.push(`${nBlesses} blessé${nBlesses > 1 ? 's' : ''} (${noms})`);
  }
  // Silence unused-param lint if marineUpdates has no extra info right now.
  void marineUpdates;
  const suffix = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
  const label = `Scénario « ${scenario.nom} » (${formatDateDisplay(scenario.date)})${suffix}`;
  return newEvent('scenario-added', dateCampagne, label);
}
