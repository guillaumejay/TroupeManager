import type { DomainEvent, Scenario } from '../types';

/**
 * Normalize events loaded from persistent storage (localStorage, Gist, …)
 * so that missing fields introduced after persistence are back-filled.
 *
 * Currently handles:
 * - `Scenario.participants` (added v0.5): if absent, defaults to the union of
 *   `morts` and `blesses.marineId`.
 */
export function migrateEvents(events: DomainEvent[]): DomainEvent[] {
  return events.map((e) => {
    if (e.type !== 'scenario-added') return e;
    const s = e.scenario as Scenario & { participants?: string[] };
    if (Array.isArray(s.participants)) return e;
    const participants = Array.from(
      new Set<string>([...s.morts, ...s.blesses.map((b) => b.marineId)]),
    );
    return { ...e, scenario: { ...s, participants } };
  });
}
