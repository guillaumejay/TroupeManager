import type { CampaignState, DomainEvent, Marine, MarineUpdate, Scenario } from '../types';
import { addDays } from './dates';
import { sortEvents } from './deriveState';

interface LegacyShape {
  marines: Marine[];
  scenarios: Scenario[];
  dateCourante: string;
  highlightedMarineIds?: string[];
}

function isLegacyShape(value: unknown): value is LegacyShape {
  if (typeof value !== 'object' || value === null) return false;
  const c = value as Partial<LegacyShape>;
  return (
    Array.isArray(c.marines) &&
    Array.isArray(c.scenarios) &&
    typeof c.dateCourante === 'string'
  );
}

/**
 * Convert a pre-event-sourcing campaign snapshot into the current event-log
 * shape. The legacy format stored marines and scenarios as the source of truth;
 * we reconstruct a synthetic event log that, when replayed, yields the same
 * end state.
 *
 * Best-effort: scenarios preserve their `morts` and `blesses` arrays so the
 * timeline still renders, but per-scenario marineUpdates only carry deaths
 * (the legacy schema didn't store enough to reconstruct per-scenario wound
 * details). Surviving marines' non-RAS final state is replayed as one
 * `marine-fields-updated` event dated at `dateCourante`.
 */
export function migrateLegacyState(raw: unknown): CampaignState | null {
  if (!isLegacyShape(raw)) return null;

  const scenarios = [...raw.scenarios].sort((a, b) =>
    a.date < b.date ? -1 : a.date > b.date ? 1 : 0,
  );
  const dateCourante = raw.dateCourante;
  const seedDate = scenarios.length > 0 ? addDays(scenarios[0].date, -1) : dateCourante;

  const events: DomainEvent[] = [];

  raw.marines.forEach((m, i) => {
    const cleanMarine: Marine = {
      id: m.id,
      nom: m.nom,
      grade: m.grade,
      specialisation: m.specialisation,
      conditionPhysique: 'RAS',
      etatPsychologique: 'RAS',
    };
    events.push({
      id: `legacy-marine-${m.id}`,
      timestamp: `${seedDate}T00:00:${String(i).padStart(2, '0')}.000Z`,
      dateCampagne: seedDate,
      type: 'marine-added',
      marine: cleanMarine,
    });
  });

  scenarios.forEach((s, si) => {
    const marineUpdates: MarineUpdate[] = s.morts.map((mortId) => ({
      marineId: mortId,
      conditionPhysique: 'MORT',
      etatPsychologique: 'MORT',
      dateDebutIndispo: s.date,
      scenarioMort: s.id,
    }));
    const participants = Array.from(
      new Set<string>([...s.morts, ...s.blesses.map((b) => b.marineId)]),
    );
    events.push({
      id: `legacy-scenario-${s.id}`,
      timestamp: `${s.date}T12:00:${String(si).padStart(2, '0')}.000Z`,
      dateCampagne: s.date,
      type: 'scenario-added',
      scenario: { ...s, participants },
      marineUpdates,
    });
  });

  raw.marines.forEach((m, i) => {
    const isDead = m.conditionPhysique === 'MORT' || m.etatPsychologique === 'MORT';
    if (isDead) return;

    const fields: Partial<Marine> = {};
    if (m.conditionPhysique !== 'RAS') fields.conditionPhysique = m.conditionPhysique;
    if (m.etatPsychologique !== 'RAS') fields.etatPsychologique = m.etatPsychologique;
    if (m.dateDebutIndispo !== undefined) fields.dateDebutIndispo = m.dateDebutIndispo;
    if (m.dureeJours !== undefined) fields.dureeJours = m.dureeJours;
    if (m.scenarioMort !== undefined) fields.scenarioMort = m.scenarioMort;

    if (Object.keys(fields).length === 0) return;

    events.push({
      id: `legacy-final-${m.id}`,
      timestamp: `${dateCourante}T23:59:${String(i).padStart(2, '0')}.000Z`,
      dateCampagne: dateCourante,
      type: 'marine-fields-updated',
      marineId: m.id,
      fields,
      reason: 'sheet',
    });
  });

  return {
    events: sortEvents(events),
    dateCourante,
    dateObservation: dateCourante,
    highlightedMarineIds: Array.isArray(raw.highlightedMarineIds) ? raw.highlightedMarineIds : [],
  };
}
