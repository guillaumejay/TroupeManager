import type { DomainEvent, DerivedView, Marine, Scenario } from '../types';

function compareEvents(a: DomainEvent, b: DomainEvent): number {
  if (a.dateCampagne !== b.dateCampagne) return a.dateCampagne < b.dateCampagne ? -1 : 1;
  if (a.timestamp !== b.timestamp) return a.timestamp < b.timestamp ? -1 : 1;
  return 0;
}

export function sortEvents(events: DomainEvent[]): DomainEvent[] {
  return [...events].sort(compareEvents);
}

/**
 * Fold the event log into a {marines, scenarios} view at the given date.
 * Events must be pre-sorted. Events with dateCampagne > upToDate are ignored.
 */
export function deriveView(events: DomainEvent[], upToDate: string): DerivedView {
  const marines = new Map<string, Marine>();
  const scenarios: Scenario[] = [];

  for (const e of events) {
    if (e.dateCampagne > upToDate) continue;
    switch (e.type) {
      case 'marine-added':
        marines.set(e.marine.id, e.marine);
        break;
      case 'marine-field-updated': {
        const m = marines.get(e.marineId);
        if (m) marines.set(e.marineId, { ...m, [e.field]: e.value });
        break;
      }
      case 'marine-fields-updated': {
        const m = marines.get(e.marineId);
        if (m) marines.set(e.marineId, { ...m, ...e.fields });
        break;
      }
      case 'scenario-added': {
        scenarios.push(e.scenario);
        for (const u of e.marineUpdates) {
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
        break;
      }
    }
  }

  return { marines: Array.from(marines.values()), scenarios };
}

/**
 * Earliest dateCampagne in the log, or null if empty.
 */
export function firstEventDate(events: DomainEvent[]): string | null {
  if (events.length === 0) return null;
  return events.reduce<string>((min, e) => (e.dateCampagne < min ? e.dateCampagne : min), events[0].dateCampagne);
}
