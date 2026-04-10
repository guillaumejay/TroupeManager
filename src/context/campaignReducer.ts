import type { CampaignState, CampaignAction } from '../types';
import { addDays } from '../utils/dates';

export function campaignReducer(state: CampaignState, action: CampaignAction): CampaignState {
  switch (action.type) {
    case 'UPDATE_MARINE': {
      return {
        ...state,
        marines: state.marines.map((m) =>
          m.id === action.marineId
            ? { ...m, [action.field]: action.value }
            : m,
        ),
      };
    }

    case 'ADD_MARINE': {
      return {
        ...state,
        marines: [...state.marines, action.marine],
      };
    }

    case 'ADVANCE_DAY': {
      return {
        ...state,
        dateCourante: addDays(state.dateCourante, 1),
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
      return {
        ...state,
        scenarios: [...state.scenarios, action.scenario],
        marines: updatedMarines,
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
      return action.state;
    }

    default:
      return state;
  }
}
