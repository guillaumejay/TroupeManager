import { useMemo, useState } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import type { Scenario, MarineUpdate, BlesseInfo } from '../../types';
import { CONDITION_PHYSIQUE } from '../../data/domain';
import { buildMarineUpdates, DEFAULT_WOUND_SEVERITY, WOUND_SEVERITIES } from '../../utils/events';

interface ScenarioFormProps {
  mode: 'create' | 'edit';
  initial?: Scenario;
  previousUpdates?: MarineUpdate[];
  onSubmit: (scenario: Scenario, updates: MarineUpdate[]) => void;
  onCancel: () => void;
  submitLabel?: string;
  title?: string;
}

type Outcome = 'ok' | 'blesse' | 'mort';

export function ScenarioForm({
  mode,
  initial,
  previousUpdates,
  onSubmit,
  onCancel,
  submitLabel,
  title,
}: ScenarioFormProps) {
  const { state, view } = useCampaign();
  const [nom, setNom] = useState(initial?.nom ?? '');
  const [date, setDate] = useState(initial?.date ?? state.dateObservation);
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>(
    initial?.participants ?? [],
  );
  const [selectedMorts, setSelectedMorts] = useState<string[]>(initial?.morts ?? []);
  const [selectedBlesses, setSelectedBlesses] = useState<BlesseInfo[]>(
    initial?.blesses ?? [],
  );

  // In edit mode, show all marines (including those dead from a later
  // scenario) — they might have been alive at this scenario's date.
  // In create mode, filter out dead marines.
  // Sort: participants first (so they bubble up as the user ticks them),
  // then alphabetical within each group.
  const selectableMarines = useMemo(() => {
    const base =
      mode === 'edit'
        ? view.marines
        : view.marines.filter((m) => m.conditionPhysique !== CONDITION_PHYSIQUE.MORT);
    const participantSet = new Set(selectedParticipants);
    return [...base].sort((a, b) => {
      const aIn = participantSet.has(a.id);
      const bIn = participantSet.has(b.id);
      if (aIn !== bIn) return aIn ? -1 : 1;
      return a.nom.localeCompare(b.nom, 'fr', { sensitivity: 'base' });
    });
  }, [mode, view.marines, selectedParticipants]);

  const toggleParticipant = (id: string) => {
    setSelectedParticipants((prev) => {
      if (prev.includes(id)) {
        // Also remove from outcomes if dropped from the mission.
        setSelectedMorts((m) => m.filter((x) => x !== id));
        setSelectedBlesses((b) => b.filter((x) => x.marineId !== id));
        return prev.filter((x) => x !== id);
      }
      return [...prev, id];
    });
  };

  const setOutcome = (id: string, outcome: Outcome) => {
    // Ensure marine is a participant when they have an outcome.
    setSelectedParticipants((prev) => (prev.includes(id) ? prev : [...prev, id]));
    if (outcome === 'mort') {
      setSelectedMorts((prev) => (prev.includes(id) ? prev : [...prev, id]));
      setSelectedBlesses((prev) => prev.filter((b) => b.marineId !== id));
    } else if (outcome === 'blesse') {
      setSelectedBlesses((prev) => {
        if (prev.some((b) => b.marineId === id)) return prev;
        return [...prev, { marineId: id, details: DEFAULT_WOUND_SEVERITY }];
      });
      setSelectedMorts((prev) => prev.filter((x) => x !== id));
    } else {
      setSelectedMorts((prev) => prev.filter((x) => x !== id));
      setSelectedBlesses((prev) => prev.filter((b) => b.marineId !== id));
    }
  };

  const setBlesseSeverity = (id: string, severity: string) => {
    setSelectedBlesses((prev) =>
      prev.map((b) => (b.marineId === id ? { ...b, details: severity } : b)),
    );
  };

  const outcomeOf = (id: string): Outcome | null => {
    if (selectedMorts.includes(id)) return 'mort';
    if (selectedBlesses.some((b) => b.marineId === id)) return 'blesse';
    if (selectedParticipants.includes(id)) return 'ok';
    return null;
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nom.trim()) return;

    const scenarioId =
      mode === 'edit' && initial
        ? initial.id
        : `s${String(state.events.filter((ev) => ev.type === 'scenario-added').length + 1).padStart(2, '0')}`;

    // Ensure outcomes are always a subset of participants (defensive).
    const participantsSet = new Set(selectedParticipants);
    const morts = selectedMorts.filter((id) => participantsSet.has(id));
    const blesses = selectedBlesses.filter((b) => participantsSet.has(b.marineId));

    const scenario: Scenario = {
      id: scenarioId,
      nom: nom.trim(),
      date,
      participants: selectedParticipants,
      morts,
      blesses,
    };

    const updates = buildMarineUpdates(scenario, view.marines, previousUpdates);
    onSubmit(scenario, updates);
  };

  const outcomeBtnClass = (active: boolean, kind: Outcome) => {
    if (!active) {
      return 'bg-gray-700 text-gray-400 border border-gray-600 hover:border-gray-400';
    }
    switch (kind) {
      case 'ok':
        return 'bg-green-900/60 text-green-300 border border-green-600';
      case 'blesse':
        return 'bg-amber-900/60 text-amber-300 border border-amber-600';
      case 'mort':
        return 'bg-red-900/60 text-red-300 border border-red-600';
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {title && (
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
          {title}
        </h3>
      )}

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
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
          />
        </div>
      </div>

      <div>
        <div className="flex items-baseline justify-between mb-2">
          <label className="block text-xs text-gray-400">
            {mode === 'create' ? 'Marines participants' : 'Participants & résultats'}
          </label>
          <span className="text-[11px] text-gray-500">
            {selectedParticipants.length} participant{selectedParticipants.length > 1 ? 's' : ''}
            {mode === 'edit' && (selectedMorts.length > 0 || selectedBlesses.length > 0) && (
              <> · {selectedMorts.length} 💀 · {selectedBlesses.length} 🤕</>
            )}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-1 max-h-72 overflow-y-auto pr-1">
          {selectableMarines.map((m) => {
            const isParticipant = selectedParticipants.includes(m.id);
            const out = outcomeOf(m.id);
            const blesse = selectedBlesses.find((b) => b.marineId === m.id);
            return (
              <div
                key={m.id}
                className={`flex flex-col py-1 px-2 rounded ${
                  isParticipant ? 'bg-gray-700/40' : ''
                }`}
              >
                <div className="flex items-center gap-2 text-sm">
                  <button
                    type="button"
                    onClick={() => toggleParticipant(m.id)}
                    className={`w-5 h-5 rounded border flex items-center justify-center text-xs cursor-pointer ${
                      isParticipant
                        ? 'bg-amber-600 border-amber-500 text-gray-900'
                        : 'bg-gray-700 border-gray-600 text-gray-500 hover:border-gray-400'
                    }`}
                    aria-label={isParticipant ? 'Retirer de la mission' : 'Ajouter à la mission'}
                    title={isParticipant ? 'Retirer de la mission' : 'Ajouter à la mission'}
                  >
                    {isParticipant ? '✓' : '+'}
                  </button>
                  <span className={`flex-1 ${isParticipant ? 'text-gray-200' : 'text-gray-500'}`}>
                    {m.nom}
                  </span>
                  {mode === 'edit' && isParticipant && (
                    <>
                      <button
                        type="button"
                        onClick={() => setOutcome(m.id, 'ok')}
                        className={`px-2 py-0.5 rounded text-xs cursor-pointer ${outcomeBtnClass(out === 'ok', 'ok')}`}
                        title="Revenu indemne"
                      >
                        OK
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutcome(m.id, 'blesse')}
                        className={`px-2 py-0.5 rounded text-xs cursor-pointer ${outcomeBtnClass(out === 'blesse', 'blesse')}`}
                        title="Blessé"
                      >
                        🤕
                      </button>
                      <button
                        type="button"
                        onClick={() => setOutcome(m.id, 'mort')}
                        className={`px-2 py-0.5 rounded text-xs cursor-pointer ${outcomeBtnClass(out === 'mort', 'mort')}`}
                        title="Mort"
                      >
                        💀
                      </button>
                    </>
                  )}
                </div>
                {mode === 'edit' && blesse && (
                  <select
                    value={blesse.details}
                    onChange={(e) => setBlesseSeverity(m.id, e.target.value)}
                    className="mt-1 ml-7 self-start bg-gray-700 text-gray-200 text-xs rounded px-2 py-0.5 border border-gray-600 focus:outline-none focus:border-amber-500"
                    aria-label={`Sévérité de la blessure de ${m.nom}`}
                  >
                    {WOUND_SEVERITIES.map((s) => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>
                )}
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
          {submitLabel ?? (mode === 'edit' ? 'Enregistrer' : 'Créer')}
        </button>
        <button
          type="button"
          onClick={onCancel}
          className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors cursor-pointer"
        >
          Annuler
        </button>
      </div>
    </form>
  );
}
