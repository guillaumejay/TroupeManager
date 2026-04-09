import { useState } from 'react';
import { CampaignProvider, useCampaign } from './context/CampaignContext';
import { formatDateDisplay } from './utils/dates';

type Tab = 'roster' | 'timeline';

function AppContent() {
  const [activeTab, setActiveTab] = useState<Tab>('roster');
  const { state, dispatch } = useCampaign();

  return (
    <div className="min-h-screen bg-gray-900 text-gray-100 flex flex-col">
      {/* Header */}
      <header className="bg-gray-800 border-b border-gray-700 px-6 py-4 flex items-center justify-between">
        <h1 className="text-xl font-bold tracking-wide">Troupe Manager</h1>
        <div className="flex items-center gap-4">
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
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'roster'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Roster
        </button>
        <button
          onClick={() => setActiveTab('timeline')}
          className={`px-4 py-2 text-sm font-medium transition-colors cursor-pointer ${
            activeTab === 'timeline'
              ? 'text-amber-400 border-b-2 border-amber-400'
              : 'text-gray-400 hover:text-gray-200'
          }`}
        >
          Timeline
        </button>
      </nav>

      {/* Content */}
      <main className="flex-1 p-6">
        {activeTab === 'roster' ? (
          <div className="text-gray-500 italic">Roster — à implémenter (S02)</div>
        ) : (
          <div className="text-gray-500 italic">Timeline — à implémenter (S04)</div>
        )}
      </main>
    </div>
  );
}

function App() {
  return (
    <CampaignProvider>
      <AppContent />
    </CampaignProvider>
  );
}

export default App;
