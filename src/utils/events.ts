import type { ConditionPhysique, DomainEvent, Marine, MarineUpdate, Scenario } from '../types';
import { CONDITION_PHYSIQUE, ETAT_PSYCHOLOGIQUE } from '../data/domain';
import { formatDateDisplay } from './dates';

export const WOUND_SEVERITIES: readonly ConditionPhysique[] = [
  CONDITION_PHYSIQUE.BLESSURE_LEGERE,
  CONDITION_PHYSIQUE.BLESSURE_GRAVE,
  CONDITION_PHYSIQUE.CONVALESCENCE,
];

export const DEFAULT_WOUND_SEVERITY: ConditionPhysique = CONDITION_PHYSIQUE.BLESSURE_GRAVE;

const DEFAULT_DAYS_BY_SEVERITY: Record<ConditionPhysique, number> = {
  [CONDITION_PHYSIQUE.RAS]: 0,
  [CONDITION_PHYSIQUE.BLESSURE_LEGERE]: 3,
  [CONDITION_PHYSIQUE.BLESSURE_GRAVE]: 15,
  [CONDITION_PHYSIQUE.CONVALESCENCE]: 30,
  [CONDITION_PHYSIQUE.MORT]: 0,
};

export function severityFromDetails(details: string): ConditionPhysique {
  return (WOUND_SEVERITIES as readonly string[]).includes(details)
    ? (details as ConditionPhysique)
    : DEFAULT_WOUND_SEVERITY;
}

export function buildMarineUpdates(
  scenario: Scenario,
  marines: Marine[],
  previousUpdates?: MarineUpdate[],
): MarineUpdate[] {
  const prev = new Map((previousUpdates ?? []).map((u) => [u.marineId, u] as const));
  const updates: MarineUpdate[] = [];

  for (const id of scenario.morts) {
    updates.push({
      marineId: id,
      conditionPhysique: CONDITION_PHYSIQUE.MORT,
      etatPsychologique: ETAT_PSYCHOLOGIQUE.MORT,
      dateDebutIndispo: scenario.date,
      scenarioMort: scenario.id,
    });
  }

  for (const b of scenario.blesses) {
    const previous = prev.get(b.marineId);
    const marine = marines.find((m) => m.id === b.marineId);
    const severity = severityFromDetails(b.details);
    updates.push({
      marineId: b.marineId,
      conditionPhysique: severity,
      etatPsychologique:
        previous?.etatPsychologique ?? marine?.etatPsychologique ?? ETAT_PSYCHOLOGIQUE.RAS,
      dateDebutIndispo: scenario.date,
      dureeJours: previous?.dureeJours ?? DEFAULT_DAYS_BY_SEVERITY[severity],
      scenarioOrigine: scenario.id,
    });
  }

  return updates;
}

const FIELD_LABELS: Partial<Record<keyof Marine, string>> = {
  nom: 'Nom',
  grade: 'Grade',
  specialisation: 'Spécialisation',
  conditionPhysique: 'Condition physique',
  etatPsychologique: 'État psychologique',
  dateDebutIndispo: 'Début indispo',
  dureeJours: 'Durée',
  scenarioMort: 'Scénario de mort',
  scenarioOrigine: 'Scénario d’origine',
};

const REASON_HEADING = { sheet: 'Fiche modifiée', health: 'Santé modifiée' } as const;

function formatValue(field: keyof Marine, value: Marine[keyof Marine] | undefined): string {
  if (value === undefined || value === null || value === '') return '—';
  if (field === 'dateDebutIndispo' && typeof value === 'string') return formatDateDisplay(value);
  if (field === 'dureeJours' && typeof value === 'number') return `${value}j`;
  return String(value);
}

function applyEventToMarines(marines: Map<string, Marine>, event: DomainEvent): void {
  switch (event.type) {
    case 'marine-added':
      marines.set(event.marine.id, event.marine);
      return;
    case 'marine-field-updated': {
      const m = marines.get(event.marineId);
      if (m) marines.set(event.marineId, { ...m, [event.field]: event.value });
      return;
    }
    case 'marine-fields-updated': {
      const m = marines.get(event.marineId);
      if (m) marines.set(event.marineId, { ...m, ...event.fields });
      return;
    }
    case 'scenario-added':
      for (const u of event.marineUpdates) {
        const m = marines.get(u.marineId);
        if (!m) continue;
        marines.set(u.marineId, {
          ...m,
          conditionPhysique: u.conditionPhysique,
          etatPsychologique: u.etatPsychologique,
          dateDebutIndispo: u.dateDebutIndispo ?? m.dateDebutIndispo,
          dureeJours: u.dureeJours ?? m.dureeJours,
          scenarioMort: u.scenarioMort ?? m.scenarioMort,
          scenarioOrigine: u.scenarioOrigine ?? m.scenarioOrigine,
        });
      }
      return;
  }
}

export function renderEventLabel(event: DomainEvent, marinesBefore: Map<string, Marine>): string {
  switch (event.type) {
    case 'marine-added':
      return `Nouveau marine : ${event.marine.nom} (${event.marine.grade}, ${event.marine.specialisation})`;

    case 'marine-field-updated': {
      const m = marinesBefore.get(event.marineId);
      const name = m?.nom ?? event.marineId;
      const fieldLabel = FIELD_LABELS[event.field] ?? String(event.field);
      const oldVal = m ? formatValue(event.field, m[event.field]) : '—';
      const newVal = formatValue(event.field, event.value);
      return `${name} — ${fieldLabel} : ${oldVal} → ${newVal}`;
    }

    case 'marine-fields-updated': {
      const m = marinesBefore.get(event.marineId);
      const name = m?.nom ?? event.marineId;
      const diffs: string[] = [];
      for (const key of Object.keys(event.fields) as (keyof Marine)[]) {
        const newVal = event.fields[key];
        const oldVal = m?.[key];
        if (oldVal === newVal) continue;
        const fl = FIELD_LABELS[key] ?? String(key);
        diffs.push(`${fl} ${formatValue(key, oldVal)} → ${formatValue(key, newVal)}`);
      }
      const heading = REASON_HEADING[event.reason];
      if (diffs.length === 0) return `${name} — ${heading} (aucun changement)`;
      return `${name} — ${heading} : ${diffs.join(', ')}`;
    }

    case 'scenario-added': {
      const nMorts = event.scenario.morts.length;
      const nBlesses = event.scenario.blesses.length;
      const parts: string[] = [];
      if (nMorts > 0) {
        const noms = event.scenario.morts.map((id) => marinesBefore.get(id)?.nom ?? id).join(', ');
        parts.push(`${nMorts} mort${nMorts > 1 ? 's' : ''} (${noms})`);
      }
      if (nBlesses > 0) {
        const noms = event.scenario.blesses
          .map((b) => marinesBefore.get(b.marineId)?.nom ?? b.marineId)
          .join(', ');
        parts.push(`${nBlesses} blessé${nBlesses > 1 ? 's' : ''} (${noms})`);
      }
      const suffix = parts.length > 0 ? ` — ${parts.join(', ')}` : '';
      return `Scénario « ${event.scenario.nom} » (${formatDateDisplay(event.scenario.date)})${suffix}`;
    }
  }
}

/**
 * Iterate events in chronological order, returning each paired with its
 * rendered label (using marine state as-of just before the event fired).
 */
export function labelEvents(events: DomainEvent[]): Array<{ event: DomainEvent; label: string }> {
  const marines = new Map<string, Marine>();
  const out: Array<{ event: DomainEvent; label: string }> = [];
  for (const e of events) {
    const label = renderEventLabel(e, marines);
    applyEventToMarines(marines, e);
    out.push({ event: e, label });
  }
  return out;
}
