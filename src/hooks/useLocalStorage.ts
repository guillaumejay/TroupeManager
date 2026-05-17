import type { CampaignState } from '../types';
import { INITIAL_STATE } from '../data/initialState';
import { migrateEvents } from '../utils/migration';
import { migrateLegacyState } from '../utils/migrateLegacyState';

const STORAGE_KEY = 'troupe-manager-state';

function isNewShape(parsed: unknown): parsed is CampaignState {
  if (typeof parsed !== 'object' || parsed === null) return false;
  const c = parsed as Partial<CampaignState>;
  return (
    Array.isArray(c.events) &&
    typeof c.dateCourante === 'string' &&
    typeof c.dateObservation === 'string'
  );
}

export function loadState(): CampaignState {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return INITIAL_STATE;
    const parsed = JSON.parse(raw);
    if (isNewShape(parsed)) {
      return {
        ...parsed,
        events: migrateEvents(parsed.events),
        highlightedMarineIds: parsed.highlightedMarineIds ?? [],
      };
    }
    const migrated = migrateLegacyState(parsed);
    if (migrated) {
      console.info('[TroupeManager] Migrated legacy localStorage state to event log');
      return { ...migrated, events: migrateEvents(migrated.events) };
    }
    console.warn('[TroupeManager] Incompatible localStorage shape — falling back to initial state');
    return INITIAL_STATE;
  } catch (e) {
    console.warn('[TroupeManager] Failed to parse localStorage — falling back to initial state', e);
    return INITIAL_STATE;
  }
}

export function saveState(state: CampaignState): void {
  try {
    // Don't persist transient UI state (highlightedMarineIds)
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ ...state, highlightedMarineIds: [] }));
  } catch (e) {
    console.warn('[TroupeManager] Failed to save to localStorage', e);
  }
}
