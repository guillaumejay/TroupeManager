import { useState } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import { INITIAL_STATE } from '../../data/initialState';

declare const __APP_VERSION__: string;

export function SettingsView() {
  const { dispatch } = useCampaign();
  const [confirmReset, setConfirmReset] = useState(false);
  const [resetDone, setResetDone] = useState(false);

  const handleReset = () => {
    dispatch({ type: 'LOAD_STATE', state: INITIAL_STATE });
    setConfirmReset(false);
    setResetDone(true);
    setTimeout(() => setResetDone(false), 2500);
  };

  return (
    <div className="max-w-xl space-y-6">
      <h2 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Paramètres</h2>

      <section className="bg-gray-800 border border-red-900/40 rounded-lg p-5 space-y-4">
        <div className="space-y-1">
          <h3 className="text-sm font-medium text-red-400">Réinitialisation</h3>
          <p className="text-xs text-gray-400">
            Revenir aux données initiales de la campagne : roster, scénarios et date.
          </p>
        </div>

        <div className="flex items-center gap-3 min-h-[40px]">
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

      <p className="text-xs text-gray-500">Version {__APP_VERSION__}</p>
    </div>
  );
}
