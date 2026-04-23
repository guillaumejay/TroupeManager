import { useCallback, useEffect, useRef, useState } from 'react';
import type { CampaignState } from '../types';
import { createGist, fetchGist, GistError, updateGist } from '../services/gist';

const LS_GIST_ID = 'troupe-gist-id';
const LS_GIST_TOKEN = 'troupe-gist-token';
const AUTOSAVE_DEBOUNCE_MS = 2000;
const POLL_INTERVAL_MS = 30_000;

export type SyncStatus =
  | 'idle'
  | 'loading'
  | 'saving'
  | 'synced'
  | 'error'
  | 'readonly';

export interface UseGistSyncArgs {
  state: CampaignState;
  onRemoteState: (next: CampaignState) => void;
}

export interface UseGistSyncReturn {
  syncStatus: SyncStatus;
  lastSyncedAt: Date | null;
  errorMessage: string | null;
  gistId: string | null;
  isReadonly: boolean;
  loadFromGist: () => Promise<void>;
  saveToGist: () => Promise<void>;
  createAndLink: (token: string) => Promise<string>;
  unlinkGist: () => void;
  setTokenAndReload: (token: string) => void;
}

function readGistIdFromUrl(): string | null {
  if (typeof window === 'undefined') return null;
  return new URLSearchParams(window.location.search).get('gist');
}

function serializePersistent(state: CampaignState): string {
  return JSON.stringify({
    marines: state.marines,
    scenarios: state.scenarios,
    dateCourante: state.dateCourante,
    events: state.events,
  });
}

function replaceUrlGist(gistId: string | null) {
  if (typeof window === 'undefined') return;
  const url = new URL(window.location.href);
  if (gistId) url.searchParams.set('gist', gistId);
  else url.searchParams.delete('gist');
  window.history.replaceState({}, '', url.toString());
}

export function useGistSync({ state, onRemoteState }: UseGistSyncArgs): UseGistSyncReturn {
  const [gistId, setGistId] = useState<string | null>(
    () => readGistIdFromUrl() ?? localStorage.getItem(LS_GIST_ID)
  );
  const [token, setToken] = useState<string | null>(
    () => localStorage.getItem(LS_GIST_TOKEN)
  );
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(() => {
    if (!gistId) return 'idle';
    return token ? 'synced' : 'readonly';
  });
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);

  // Serialized snapshot of the last state we synced with the remote (sent or
  // received). Save and poll compare against this to skip no-op work.
  const lastSyncedSerializedRef = useRef<string | null>(null);

  const isReadonly = syncStatus === 'readonly';

  const loadFromGist = useCallback(async () => {
    const id = gistId;
    if (!id) return;
    setSyncStatus('loading');
    setErrorMessage(null);
    try {
      const remote = await fetchGist(id);
      const remoteSerialized = serializePersistent(remote);
      if (remoteSerialized !== lastSyncedSerializedRef.current) {
        lastSyncedSerializedRef.current = remoteSerialized;
        onRemoteState(remote);
      }
      setLastSyncedAt(new Date());
      setSyncStatus(token ? 'synced' : 'readonly');
    } catch (e) {
      const err = e instanceof GistError ? e : new GistError('Erreur inconnue', 'NETWORK');
      if (err.code === 'UNAUTHORIZED') {
        localStorage.removeItem(LS_GIST_TOKEN);
        setToken(null);
        setSyncStatus('readonly');
      } else {
        setSyncStatus('error');
      }
      setErrorMessage(err.message);
    }
  }, [gistId, token, onRemoteState]);

  const saveToGist = useCallback(async () => {
    if (!gistId || !token) return; // no-op in readonly / unconfigured
    const serialized = serializePersistent(stateRef.current);
    if (serialized === lastSyncedSerializedRef.current) return;
    setSyncStatus('saving');
    setErrorMessage(null);
    try {
      await updateGist(gistId, stateRef.current, token);
      lastSyncedSerializedRef.current = serialized;
      setLastSyncedAt(new Date());
      setSyncStatus('synced');
    } catch (e) {
      const err = e instanceof GistError ? e : new GistError('Erreur inconnue', 'NETWORK');
      if (err.code === 'UNAUTHORIZED') {
        localStorage.removeItem(LS_GIST_TOKEN);
        setToken(null);
        setSyncStatus('readonly');
      } else {
        setSyncStatus('error');
      }
      setErrorMessage(err.message);
    }
  }, [gistId, token]);

  const createAndLink = useCallback(
    async (newToken: string): Promise<string> => {
      setSyncStatus('saving');
      setErrorMessage(null);
      try {
        const newId = await createGist(stateRef.current, newToken);
        localStorage.setItem(LS_GIST_ID, newId);
        localStorage.setItem(LS_GIST_TOKEN, newToken);
        setGistId(newId);
        setToken(newToken);
        replaceUrlGist(newId);
        setLastSyncedAt(new Date());
        setSyncStatus('synced');
        return newId;
      } catch (e) {
        const err = e instanceof GistError ? e : new GistError('Erreur inconnue', 'NETWORK');
        setSyncStatus('error');
        setErrorMessage(err.message);
        throw err;
      }
    },
    []
  );

  const unlinkGist = useCallback(() => {
    localStorage.removeItem(LS_GIST_ID);
    localStorage.removeItem(LS_GIST_TOKEN);
    setGistId(null);
    setToken(null);
    setSyncStatus('idle');
    setErrorMessage(null);
    replaceUrlGist(null);
  }, []);

  const setTokenAndReload = useCallback((newToken: string) => {
    localStorage.setItem(LS_GIST_TOKEN, newToken);
    setToken(newToken);
    setSyncStatus('synced');
  }, []);

  // Initial load if ?gist= in URL.
  const didInitialLoadRef = useRef(false);
  useEffect(() => {
    if (didInitialLoadRef.current) return;
    const urlGist = readGistIdFromUrl();
    if (!urlGist) return;
    didInitialLoadRef.current = true;
    if (localStorage.getItem(LS_GIST_TOKEN)) {
      localStorage.setItem(LS_GIST_ID, urlGist);
    }
    // Defer out of render phase to avoid cascading-setState warning.
    queueMicrotask(() => void loadFromGist());
  }, [loadFromGist]);

  // Debounced auto-save. Depends on serialized persistent state so transient
  // UI changes (HIGHLIGHT_MARINES) don't reset the debounce timer.
  const persistentKey = serializePersistent(state);
  useEffect(() => {
    if (!gistId || !token) return;
    if (persistentKey === lastSyncedSerializedRef.current) return;
    const timer = setTimeout(() => {
      void saveToGist();
    }, AUTOSAVE_DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [persistentKey, gistId, token, saveToGist]);

  // Polling in readonly mode.
  useEffect(() => {
    if (syncStatus !== 'readonly' || !gistId) return;
    let cancelled = false;
    const tick = () => {
      if (cancelled) return;
      if (document.visibilityState === 'hidden') return;
      void loadFromGist();
    };
    const interval = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, [syncStatus, gistId, loadFromGist]);

  return {
    syncStatus,
    lastSyncedAt,
    errorMessage,
    gistId,
    isReadonly,
    loadFromGist,
    saveToGist,
    createAndLink,
    unlinkGist,
    setTokenAndReload,
  };
}
