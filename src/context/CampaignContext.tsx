import { createContext, useContext, useReducer, useEffect, useMemo, type ReactNode } from 'react';
import type { CampaignState, CampaignAction, DerivedView } from '../types';
import { campaignReducer } from './campaignReducer';
import { loadState, saveState } from '../hooks/useLocalStorage';
import { deriveView } from '../utils/deriveState';

interface CampaignContextValue {
  state: CampaignState;
  view: DerivedView;
  dispatch: React.Dispatch<CampaignAction>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  const view = useMemo(
    () => deriveView(state.events, state.dateObservation),
    [state.events, state.dateObservation],
  );

  const value = useMemo(
    () => ({ state, view, dispatch }),
    [state, view],
  );

  return (
    <CampaignContext.Provider value={value}>
      {children}
    </CampaignContext.Provider>
  );
}

export function useCampaign(): CampaignContextValue {
  const ctx = useContext(CampaignContext);
  if (!ctx) {
    throw new Error('useCampaign must be used within CampaignProvider');
  }
  return ctx;
}
