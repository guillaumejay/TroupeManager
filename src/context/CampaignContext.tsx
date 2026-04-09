import { createContext, useContext, useReducer, useEffect, type ReactNode } from 'react';
import type { CampaignState, CampaignAction } from '../types';
import { campaignReducer } from './campaignReducer';
import { loadState, saveState } from '../hooks/useLocalStorage';

interface CampaignContextValue {
  state: CampaignState;
  dispatch: React.Dispatch<CampaignAction>;
}

const CampaignContext = createContext<CampaignContextValue | null>(null);

export function CampaignProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(campaignReducer, undefined, loadState);

  useEffect(() => {
    saveState(state);
  }, [state]);

  return (
    <CampaignContext.Provider value={{ state, dispatch }}>
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
