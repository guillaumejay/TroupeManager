import type { CampaignState, CampaignAction, DomainEvent } from '../types';
import { addDays } from '../utils/dates';
import { sortEvents } from '../utils/deriveState';

function newEventId(): string {
  return typeof crypto !== 'undefined' && crypto.randomUUID
    ? crypto.randomUUID()
    : `evt_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`;
}

function pushEvent(state: CampaignState, event: DomainEvent): CampaignState {
  return { ...state, events: sortEvents([...state.events, event]) };
}

export function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'UPDATE_MARINE': {
      const event: DomainEvent = {
        id: newEventId(),
        timestamp: new Date().toISOString(),
        dateCampagne: state.dateObservation,
        type: 'marine-field-updated',
        marineId: action.marineId,
        field: action.field,
        value: action.value,
      };
      return pushEvent(state, event);
    }

    case 'UPDATE_MARINE_FIELDS': {
      const event: DomainEvent = {
        id: newEventId(),
        timestamp: new Date().toISOString(),
        dateCampagne: state.dateObservation,
        type: 'marine-fields-updated',
        marineId: action.marineId,
        fields: action.fields,
        reason: action.reason,
      };
      return pushEvent(state, event);
    }

    case 'ADD_MARINE': {
      const event: DomainEvent = {
        id: newEventId(),
        timestamp: new Date().toISOString(),
        dateCampagne: state.dateObservation,
        type: 'marine-added',
        marine: action.marine,
      };
      return pushEvent(state, event);
    }

    case 'ADVANCE_DAY': {
      const newDate = addDays(state.dateCourante, 1);
      const wasAligned = state.dateObservation === state.dateCourante;
      return {
        ...state,
        dateCourante: newDate,
        dateObservation: wasAligned ? newDate : state.dateObservation,
      };
    }

    case 'ADD_SCENARIO': {
      const event: DomainEvent = {
        id: newEventId(),
        timestamp: new Date().toISOString(),
        dateCampagne: action.scenario.date,
        type: 'scenario-added',
        scenario: action.scenario,
        marineUpdates: action.marineUpdates,
      };
      const nextDateCourante =
        action.scenario.date > state.dateCourante ? action.scenario.date : state.dateCourante;
      return {
        ...pushEvent(state, event),
        dateCourante: nextDateCourante,
      };
    }

    case 'UPDATE_SCENARIO': {
      const found = state.events.some(
        (e) => e.type === 'scenario-added' && e.scenario.id === action.scenarioId,
      );
      if (!found) return state;
      const nextEvents = state.events.map((e) =>
        e.type === 'scenario-added' && e.scenario.id === action.scenarioId
          ? {
              ...e,
              dateCampagne: action.scenario.date,
              scenario: action.scenario,
              marineUpdates: action.marineUpdates,
            }
          : e,
      );
      const nextDateCourante =
        action.scenario.date > state.dateCourante ? action.scenario.date : state.dateCourante;
      return {
        ...state,
        events: sortEvents(nextEvents),
        dateCourante: nextDateCourante,
      };
    }

    case 'SET_OBSERVATION_DATE': {
      const clamped = action.date > state.dateCourante ? state.dateCourante : action.date;
      return { ...state, dateObservation: clamped };
    }

    case 'SHIFT_OBSERVATION_DATE': {
      const next = addDays(state.dateObservation, action.days);
      const clamped = next > state.dateCourante ? state.dateCourante : next;
      return { ...state, dateObservation: clamped };
    }

    case 'REWIND_TO_OBSERVATION': {
      if (state.dateObservation >= state.dateCourante) return state;
      const target = state.dateObservation;
      return {
        ...state,
        events: state.events.filter((e) => e.dateCampagne <= target),
        dateCourante: target,
      };
    }

    case 'HIGHLIGHT_MARINES':
      return { ...state, highlightedMarineIds: action.marineIds };

    case 'CLEAR_HIGHLIGHT':
      return { ...state, highlightedMarineIds: [] };

    case 'LOAD_STATE':
      return action.state;

    default:
      return state;
  }
}
