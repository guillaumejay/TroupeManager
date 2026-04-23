import type { CampaignState, CampaignAction, CampaignEvent } from '../types';
import { addDays } from '../utils/dates';
import {
  buildMarineUpdateEvent,
  buildMarineFieldsUpdateEvent,
  buildMarineAddedEvent,
  buildDayAdvancedEvent,
  buildScenarioAddedEvent,
} from '../utils/events';

function appendEvents(state: CampaignState, events: (CampaignEvent | null)[]): CampaignEvent[] {
  const valid = events.filter((e): e is CampaignEvent => e !== null);
  if (valid.length === 0) return state.events;
  return [...state.events, ...valid];
}

export function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'UPDATE_MARINE': {
      const marine = state.marines.find((m) => m.id === action.marineId);
      if (!marine) return state;
      const event = buildMarineUpdateEvent(marine, action.field, action.value, state.dateCourante);
      return {
        ...state,
        marines: state.marines.map((m) =>
          m.id === action.marineId
            ? { ...m, [action.field]: action.value }
            : m,
        ),
        events: appendEvents(state, [event]),
      };
    }

    case 'UPDATE_MARINE_FIELDS': {
      const marine = state.marines.find((m) => m.id === action.marineId);
      if (!marine) return state;
      const event = buildMarineFieldsUpdateEvent(marine, action.fields, action.reason, state.dateCourante);
      if (!event) return state; // no-op: no field actually changed
      return {
        ...state,
        marines: state.marines.map((m) =>
          m.id === action.marineId
            ? { ...m, ...action.fields }
            : m,
        ),
        events: appendEvents(state, [event]),
      };
    }

    case 'ADD_MARINE': {
      const event = buildMarineAddedEvent(action.marine, state.dateCourante);
      return {
        ...state,
        marines: [...state.marines, action.marine],
        events: appendEvents(state, [event]),
      };
    }

    case 'ADVANCE_DAY': {
      const newDate = addDays(state.dateCourante, 1);
      const event = buildDayAdvancedEvent(state.dateCourante, newDate);
      return {
        ...state,
        dateCourante: newDate,
        events: appendEvents(state, [event]),
      };
    }

    case 'ADD_SCENARIO': {
      const updatedMarines = state.marines.map((m) => {
        const update = action.marineUpdates.find((u) => u.marineId === m.id);
        if (!update) return m;
        return {
          ...m,
          conditionPhysique: update.conditionPhysique,
          etatPsychologique: update.etatPsychologique,
          dateDebutIndispo: update.dateDebutIndispo ?? m.dateDebutIndispo,
          dureeJours: update.dureeJours ?? m.dureeJours,
          scenarioMort: update.scenarioMort ?? m.scenarioMort,
        };
      });
      const event = buildScenarioAddedEvent(
        action.scenario,
        action.marineUpdates,
        state.marines,
        state.dateCourante,
      );
      return {
        ...state,
        scenarios: [...state.scenarios, action.scenario],
        marines: updatedMarines,
        events: appendEvents(state, [event]),
      };
    }

    case 'HIGHLIGHT_MARINES': {
      return {
        ...state,
        highlightedMarineIds: action.marineIds,
      };
    }

    case 'CLEAR_HIGHLIGHT': {
      return {
        ...state,
        highlightedMarineIds: [],
      };
    }

    case 'LOAD_STATE': {
      return { ...action.state, events: action.state.events ?? [] };
    }

    default:
      return state;
  }
}
