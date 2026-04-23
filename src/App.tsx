import { useState } from 'react';
import { CampaignProvider, useCampaign } from './context/CampaignContext';
import { GistSyncProvider } from './context/GistSyncProvider';
import { useGistSyncContext } from './context/gistSyncContext';
import type { SyncStatus } from './hooks/useGistSync';
import { formatDateDisplay } from './utils/dates';
import { copyRosterToClipboard } from './utils/export';
import { RosterTable } from './components/roster/RosterTable';
import { AddMarineModal } from './components/roster/AddMarineModal';
import { TimelineView } from './components/timeline/TimelineView';
import { EventsView } from './components/events/EventsView';
import { SettingsView } from './components/settings/SettingsView';

type Tab = 'roster' | 'timeline' | 'events' | 'settings';

const SYNC_META: Record<Exclude<SyncStatus, 'idle'>, { label: string; dotClass: string }> = {
  saving: { label: 'Sauvegarde', dotClass: 'bg-amber-400 animate-pulse' },
  loading: { label: 'Chargement', dotClass: 'bg-amber-400 animate-pulse' },
  synced: { label: 'Sync', dotClass: 'bg-green-400' },
  error: { label: 'Erreur', dotClass: 'bg-red-400' },
  readonly: { label: 'Lecture', dotClass: 'bg-gray-400' },
};

function SyncIndicator() {
  const { syncStatus, errorMessage } = useGistSyncContext();
  if (syncStatus === 'idle') return null;
  const { label, dotClass } = SYNC_META[syncStatus];
  return (
    <span
      className="flex items-center gap-1.5 text-xs text-gray-400"
      title={errorMessage ?? undefined}
    >
      <span className={`inline-block w-2 h-2 rounded-full ${dotClass}`} />
      {label}
    </span>
  );
}

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

function DateNav() {
  const { state, dispatch } = useCampaign();
  // `confirmRewindFor` tracks the date the user asked to confirm. Deriving
  // the visible confirm state from it avoids a setState-in-effect reset.
  const [confirmRewindFor, setConfirmRewindFor] = useState<string | null>(null);
  const [draftDate, setDraftDate] = useState(state.dateObservation);
  const [lastSyncedObsDate, setLastSyncedObsDate] = useState(state.dateObservation);
  const isPast = state.dateObservation < state.dateCourante;
  const confirmRewind = isPast && confirmRewindFor === state.dateObservation;

  const futureEventCount = isPast
    ? state.events.filter((e) => e.dateCampagne > state.dateObservation).length
    : 0;

  // Keep draft in sync with external changes (◀ ▶ button, rewind, advance).
  // React recommends updating state during render when derived from external
  // changes rather than running a setState inside useEffect.
  if (lastSyncedObsDate !== state.dateObservation) {
    setLastSyncedObsDate(state.dateObservation);
    setDraftDate(state.dateObservation);
  }

  const commitDraft = () => {
    if (ISO_DATE_RE.test(draftDate)) {
      dispatch({ type: 'SET_OBSERVATION_DATE', date: draftDate });
    } else {
      setDraftDate(state.dateObservation);
    }
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-400">Observation :</span>
        <button
          onClick={() => dispatch({ type: 'SHIFT_OBSERVATION_DATE', days: -1 })}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer"
          title="Jour précédent"
          aria-label="Jour précédent"
        >
          ◀
        </button>
        <input
          type="text"
          inputMode="numeric"
          pattern="\d{4}-\d{2}-\d{2}"
          value={draftDate}
          onChange={(e) => setDraftDate(e.target.value)}
          onBlur={commitDraft}
          onKeyDown={(e) => { if (e.key === 'Enter') (e.target as HTMLInputElement).blur(); }}
          placeholder="YYYY-MM-DD"
          aria-label="Date d'observation (ISO)"
          className="bg-gray-700 text-gray-100 text-sm rounded px-2 py-1 border border-gray-600 focus:outline-none focus:border-amber-500 font-mono w-[14ch]"
        />
        <button
          onClick={() => dispatch({ type: 'SHIFT_OBSERVATION_DATE', days: 1 })}
          disabled={!isPast}
          className="px-2 py-1 text-xs bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
          title="Jour suivant"
          aria-label="Jour suivant"
        >
          ▶
        </button>
      </div>
      {isPast && (
        <div className="flex items-center justify-end gap-2">
          <button
            onClick={() => dispatch({ type: 'SET_OBSERVATION_DATE', date: state.dateCourante })}
            className="px-2 py-1 text-xs text-amber-300 border border-amber-500/40 rounded hover:bg-amber-900/20 transition-colors cursor-pointer"
            title={`Retour à ${state.dateCourante}`}
          >
            retour au présent
          </button>
          {confirmRewind ? (
            <div className={`flex items-center gap-1.5 text-xs rounded px-2 py-1 border ${
              futureEventCount > 0
                ? 'bg-red-900/30 border-red-600/50'
                : 'bg-gray-800 border-gray-600'
            }`}>
              <span className={futureEventCount > 0 ? 'text-red-200' : 'text-gray-200'}>
                {futureEventCount > 0
                  ? `Supprimer ${futureEventCount} événement${futureEventCount > 1 ? 's' : ''} futur${futureEventCount > 1 ? 's' : ''} ?`
                  : `Replacer le présent au ${state.dateObservation} ?`}
              </span>
              <button
                onClick={() => { dispatch({ type: 'REWIND_TO_OBSERVATION' }); setConfirmRewindFor(null); }}
                className={`px-2 py-0.5 text-white rounded cursor-pointer ${
                  futureEventCount > 0 ? 'bg-red-700 hover:bg-red-600' : 'bg-amber-700 hover:bg-amber-600'
                }`}
              >
                Oui
              </button>
              <button
                onClick={() => setConfirmRewindFor(null)}
                className="px-2 py-0.5 bg-gray-700 hover:bg-gray-600 text-gray-200 rounded cursor-pointer"
              >
                Non
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmRewindFor(state.dateObservation)}
              className={`px-2 py-1 text-xs border rounded transition-colors cursor-pointer ${
                futureEventCount > 0
                  ? 'text-red-300 border-red-500/40 hover:bg-red-900/20'
                  : 'text-amber-300 border-amber-500/40 hover:bg-amber-900/20'
              }`}
              title={
                futureEventCount > 0
                  ? `Supprime ${futureEventCount} événement(s) postérieur(s) et place le présent au ${state.dateObservation}`
                  : `Replace le présent au ${state.dateObservation} (aucun événement à supprimer)`
              }
            >
              revenir à cette date
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const [exportFeedback, setExportFeedback] = useState('');
  const [showAddMarine, setShowAddMarine] = useState(false);
  const { state, view, dispatch } = useCampaign();

  const handleExport = async () => {
    const ok = await copyRosterToClipboard(view.marines, state.dateObservation);
    setExportFeedback(ok ? 'Copié !' : 'Copie via prompt');
    setTimeout(() => setExportFeedback(''), 2000);
  };

  const isPast = state.dateObservation < state.dateCourante;

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between gap-4 flex-wrap">
        <h1 className="text-xl font-bold tracking-wide">Troupe Manager</h1>
        <div className="flex items-center gap-4 flex-wrap">
          <SyncIndicator />
          <DateNav />
          <div className="flex items-center gap-2 border-l border-gray-700 pl-4">
            <span className="text-sm text-gray-400">Présent :</span>
            <span className="font-mono text-amber-400 text-sm">{formatDateDisplay(state.dateCourante)}</span>
            <button
              onClick={() => dispatch({ type: 'ADVANCE_DAY' })}
              disabled={isPast}
              className="px-3 py-1 text-sm bg-amber-600 hover:bg-amber-500 rounded transition-colors cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
              title={isPast ? 'Revenez au présent pour avancer le temps' : undefined}
            >
              +1 jour
            </button>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <nav className="bg-gray-800 border-b border-gray-700 px-6 flex gap-1">
        <button
          onClick={() => setActiveTab('roster')}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/60 focus-visible:rounded ${
            activeTab === 'roster'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/60 focus-visible:rounded ${
            activeTab === 'timeline'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Timeline
        </button>
        <button
          onClick={() => setActiveTab('events')}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/60 focus-visible:rounded ${
            activeTab === 'events'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Events
        </button>
        <button
          onClick={() => setActiveTab('settings')}
          className={`ml-auto px-4 py-2 text-sm font-medium transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-amber-500/60 focus-visible:rounded ${
            activeTab === 'settings'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Settings
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6">
        {activeTab === 'roster' && (
          <div className="space-y-4">
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowAddMarine(true)}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer"
              >
                + Ajouter un marine
              </button>
              <button
                onClick={handleExport}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer"
              >
                {exportFeedback || 'Exporter le roster'}
              </button>
            </div>
            <RosterTable />
            {showAddMarine && <AddMarineModal onClose={() => setShowAddMarine(false)} />}
          </div>
        )}
        {activeTab === 'timeline' && <TimelineView />}
        {activeTab === 'events' && <EventsView />}
        {activeTab === 'settings' && <SettingsView />}
      </main>
    </div>
  );
}

function App() {
  return (
    <CampaignProvider>
      <GistSyncProvider>
        <AppContent />
      </GistSyncProvider>
    </CampaignProvider>
  );
}

export default App;
