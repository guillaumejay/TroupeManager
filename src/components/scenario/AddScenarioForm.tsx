import { useState } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import type { Scenario, MarineUpdate } from '../../types';

export function AddScenarioForm() {
  const { state, view, dispatch } = useCampaign();
  const [isOpen, setIsOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [date, setDate] = useState(state.dateObservation);
  const [selectedMorts, setSelectedMorts] = useState<string[]>([]);
  const [selectedBlesses, setSelectedBlesses] = useState<{ marineId: string; details: string }[]>([]);

  const aliveMarines = view.marines.filter((m) => m.conditionPhysique !== 'MORT');

  const toggleMort = (id: string) => {
    setSelectedMorts((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id],
    );
    // Remove from blesses if added to morts
    setSelectedBlesses((prev) => prev.filter((b) => b.marineId !== id));
  };

  const toggleBlesse = (id: string) => {
    if (selectedBlesses.find((b) => b.marineId === id)) {
      setSelectedBlesses((prev) => prev.filter((b) => b.marineId !== id));
    } else {
      setSelectedBlesses((prev) => [...prev, { marineId: id, details: 'Blessure grave' }]);
      // Remove from morts if added to blesses
      setSelectedMorts((prev) => prev.filter((x) => x !== id));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    const scenarioCount = state.events.filter((e) => e.type === 'scenario-added').length;
    const scenarioId = `s${String(scenarioCount + 1).padStart(2, '0')}`;

    const scenario: Scenario = {
      id: scenarioId,
      nom: nom.trim(),
      date,
      morts: selectedMorts,
      blesses: selectedBlesses,
    };

    const marineUpdates: MarineUpdate[] = [
      ...selectedMorts.map((id) => ({
        marineId: id,
        conditionPhysique: 'MORT' as const,
        etatPsychologique: 'MORT' as const,
        dateDebutIndispo: date,
        scenarioMort: scenarioId,
      })),
      ...selectedBlesses.map((b) => ({
        marineId: b.marineId,
        conditionPhysique: 'Convalescence' as const,
        etatPsychologique: view.marines.find((m) => m.id === b.marineId)?.etatPsychologique ?? ('RAS' as const),
        dateDebutIndispo: date,
        dureeJours: 30, // default convalescence
      })),
    ];

    dispatch({ type: 'ADD_SCENARIO', scenario, marineUpdates });
    setNom('');
    setDate(state.dateObservation);
    setSelectedMorts([]);
    setSelectedBlesses([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="px-4 py-2 bg-gray-800 border border-gray-600 rounded-lg text-sm text-gray-300 hover:border-gray-500 hover:text-gray-100 transition-colors cursor-pointer"
      >
        + Ajouter un scénario
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-gray-800 border border-gray-700 rounded-lg p-4 space-y-4 max-w-2xl">
      <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">Nouveau scénario</h3>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs text-gray-400 mb-1">Nom du scénario</label>
          <input
            type="text"
            value={nom}
            onChange={(e) => setNom(e.target.value)}
            className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            placeholder="Ex: Hadley's Hope"
            required
          />
        </div>
        <div>
          <label className="block text-xs text-gray-400 mb-1">Date</label>
          <input
            type="text"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            placeholder="YYYY-MM-DD"
          />
        </div>
      </div>

      {/* Marine selection */}
      <div>
        <label className="block text-xs text-gray-400 mb-2">Marines impliqués</label>
        <div className="grid grid-cols-2 gap-1 max-h-48 overflow-y-auto">
          {aliveMarines.map((m) => {
            const isMort = selectedMorts.includes(m.id);
            const isBlesse = selectedBlesses.some((b) => b.marineId === m.id);
            return (
              <div key={m.id} className="flex items-center gap-2 text-sm py-1">
                <span className="flex-1 text-gray-300">{m.nom}</span>
                <button
                  type="button"
                  onClick={() => toggleMort(m.id)}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                    isMort
                      ? 'bg-red-900/60 text-red-300 border border-red-600'
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-red-600'
                  }`}
                >
                  💀
                </button>
                <button
                  type="button"
                  onClick={() => toggleBlesse(m.id)}
                  className={`px-2 py-0.5 rounded text-xs cursor-pointer ${
                    isBlesse
                      ? 'bg-amber-900/60 text-amber-300 border border-amber-600'
                      : 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-amber-600'
                  }`}
                >
                  🩹
                </button>
              </div>
            );
          })}
        </div>
      </div>

      <div className="flex gap-2">
        <button
          type="submit"
          className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium transition-colors cursor-pointer"
        >
          Ajouter
        </button>
        <button
          type="button"
          onClick={() => {
            setIsOpen(false);
            setNom('');
            setSelectedMorts([]);
            setSelectedBlesses([]);
          }}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
