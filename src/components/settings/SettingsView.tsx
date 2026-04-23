import { useRef, useState } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import { INITIAL_STATE } from '../../data/initialState';
import { isCampaignState } from '../../services/gist';
import { migrateEvents } from '../../utils/migration';
import { GistSettings } from './GistSettings';

declare const __APP_VERSION__: string;

export function SettingsView() {
  const { state, dispatch } = useCampaign();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [importDone, setImportDone] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleReset = () => {
    dispatch({ type: 'LOAD_STATE', state: INITIAL_STATE });
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  };

  const handleExport = () => {
    const json = JSON.stringify(
      {
        events: state.events,
        dateCourante: state.dateCourante,
        dateObservation: state.dateObservation,
        highlightedMarineIds: [],
      },
      null,
      2
    );
    const blob = new Blob([json], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `troupe-manager-${state.dateCourante}.json`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    // Defer revoke: some browsers invalidate the blob mid-download if revoked synchronously.
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };

  const handleImportClick = () => {
    setImportError(null);
    fileInputRef.current?.click();
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ''; // allow re-selecting the same file later
    if (!file) return;
    try {
      const text = await file.text();
      const parsed: unknown = JSON.parse(text);
      if (!isCampaignState(parsed)) {
        setImportError('Fichier invalide : forme de données incorrecte.');
        return;
      }
      dispatch({
        type: 'LOAD_STATE',
        state: {
          ...parsed,
          events: migrateEvents(parsed.events),
          highlightedMarineIds: parsed.highlightedMarineIds ?? [],
        },
      });
      setImportError(null);
      setImportDone(true);
      setTimeout(() => setImportDone(false), 2500);
    } catch {
      setImportError('Fichier invalide : JSON illisible.');
    }
  };

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Paramètres</h2>

      <section className="bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-amber-400">Gestion des données</h3>
          <p className="text-xs text-gray-400">
            Exporter, importer ou réinitialiser la campagne (roster, scénarios et date).
          </p>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={handleExport}
              className="px-4 py-2 text-sm text-gray-200 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 border border-gray-600 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
            >
              ⬇ Exporter (JSON)
            </button>
            <button
              onClick={handleImportClick}
              className="px-4 py-2 text-sm text-gray-200 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 border border-gray-600 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
            >
              ⬆ Importer (JSON)
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="application/json,.json"
              onChange={handleFileChange}
              className="hidden"
            />
            {importDone && (
              <span className="text-sm text-green-400 font-medium">Données importées</span>
            )}
          </div>
          {importError && (
            <div className="text-xs text-red-300 bg-red-900/30 border border-red-800/40 rounded px-3 py-2">
              {importError}
            </div>
          )}
        </div>

        <div className="pt-2 border-t border-gray-700/60 flex items-center gap-3 min-h-[40px]">
          {resetDone ? (
            <span className="text-sm text-green-400 font-medium">
              Données réinitialisées
            </span>
          ) : confirmReset ? (
            <>
              <button
                onClick={handleReset}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-500 active:bg-red-700 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
              >
                Confirmer
              </button>
              <button
                onClick={() => setConfirmReset(false)}
                className="px-4 py-2 text-sm text-gray-300 bg-gray-700 hover:bg-gray-600 active:bg-gray-800 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-500 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
              >
                Annuler
              </button>
            </>
          ) : (
            <button
              onClick={() => setConfirmReset(true)}
              className="px-4 py-2 text-sm text-red-200 bg-red-900/60 hover:bg-red-800/80 active:bg-red-950 border border-red-800/60 rounded transition-colors cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-red-400 focus-visible:ring-offset-1 focus-visible:ring-offset-gray-800"
            >
              Réinitialiser les données
            </button>
          )}
        </div>
      </section>

      <GistSettings />

      <p className="text-xs text-gray-500">Version {__APP_VERSION__}</p>
    </div>
  );
}
