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
import { SettingsView } from './components/settings/SettingsView';

type Tab = 'roster' | 'timeline' | 'settings';

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

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const [exportFeedback, setExportFeedback] = useState('');
  const [showAddMarine, setShowAddMarine] = useState(false);
  const { state, dispatch } = useCampaign();

  const handleExport = async () => {
    const ok = await copyRosterToClipboard(state.marines, state.dateCourante);
    setExportFeedback(ok ? 'Copié !' : 'Copie via prompt');
    setTimeout(() => setExportFeedback(''), 2000);
  };

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">Troupe Manager</h1>
        <div className="flex items-center gap-4">
          <SyncIndicator />
          <span className="text-sm text-gray-400">Date de campagne :</span>
          <span className="font-mono text-amber-400">{formatDateDisplay(state.dateCourante)}</span>
          <button
            onClick={() => dispatch({ type: 'ADVANCE_DAY' })}
            className="px-3 py-1 text-sm bg-amber-600 hover:bg-amber-500 rounded transition-colors cursor-pointer"
          >
            +1 jour
          </button>
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
