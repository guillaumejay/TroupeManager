import { createContext, useContext } from 'react';
import type { UseGistSyncReturn } from '../hooks/useGistSync';

export const GistSyncContext = createContext<UseGistSyncReturn | null>(null);

export function useGistSyncContext(): UseGistSyncReturn {
  const ctx = useContext(GistSyncContext);
  if (!ctx) throw new Error('useGistSyncContext must be used within GistSyncProvider');
  return ctx;
}
