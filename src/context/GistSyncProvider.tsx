import { useMemo, type ReactNode } from 'react';
import { useCampaign } from './CampaignContext';
import { useGistSync } from '../hooks/useGistSync';
import type { CampaignState } from '../types';
import { GistSyncContext } from './gistSyncContext';

export function GistSyncProvider({ children }: { children: ReactNode }) {
  const { state, dispatch } = useCampaign();

  const onRemoteState = useMemo(
    () => (next: CampaignState) => dispatch({ type: 'LOAD_STATE', state: next }),
    [dispatch]
  );

  const sync = useGistSync({ state, onRemoteState });

  return <GistSyncContext.Provider value={sync}>{children}</GistSyncContext.Provider>;
}
