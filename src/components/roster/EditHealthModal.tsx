import { useState, useEffect, useRef } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import type { Marine, ConditionPhysique, EtatPsychologique, Scenario, BlesseInfo } from '../../types';
import { joursRestants } from '../../utils/dates';
import { CONDITIONS_PHYSIQUES, ETATS_PSYCHOLOGIQUES, CONDITION_PHYSIQUE } from '../../data/domain';
import { buildMarineUpdates } from '../../utils/events';

interface EditHealthModalProps {
  marine: Marine;
  onClose: () => void;
}

export function EditHealthModal({ marine, onClose }: EditHealthModalProps) {
  const { state, view, dispatch } = useCampaign();
  const [conditionPhysique, setConditionPhysique] = useState<ConditionPhysique>(marine.conditionPhysique);
  const [etatPsychologique, setEtatPsychologique] = useState<EtatPsychologique>(marine.etatPsychologique);
  const [dateDebutIndispo, setDateDebutIndispo] = useState(marine.dateDebutIndispo ?? state.dateObservation);
  const [dureeJours, setDureeJours] = useState(
    marine.dureeJours !== undefined ? String(marine.dureeJours) : '',
  );
  const [scenarioOrigine, setScenarioOrigine] = useState<string>(marine.scenarioOrigine ?? '');
  const firstRef = useRef<HTMLSelectElement>(null);

  const scenariosByDate = [...view.scenarios].sort((a, b) => (a.date < b.date ? 1 : -1));

  useEffect(() => {
    firstRef.current?.focus();
  }, []);

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const isDead = conditionPhysique === CONDITION_PHYSIQUE.MORT;
  const showConvalescenceFields = !isDead && (conditionPhysique !== CONDITION_PHYSIQUE.RAS || !!marine.dateDebutIndispo);

  const remaining = joursRestants(
    dateDebutIndispo || undefined,
    dureeJours ? Number(dureeJours) : undefined,
    state.dateObservation,
  );

  const handleScenarioChange = (nextId: string) => {
    setScenarioOrigine(nextId);
    if (!nextId) return;
    const scn = view.scenarios.find((s) => s.id === nextId);
    if (!scn) return;
    // Autofill date only if empty, still matching the current origin's date,
    // or equal to today's observation default — preserve manual edits.
    const prevScn = scenarioOrigine
      ? view.scenarios.find((s) => s.id === scenarioOrigine)
      : undefined;
    const canAutofill =
      !dateDebutIndispo ||
      dateDebutIndispo === state.dateObservation ||
      (prevScn && dateDebutIndispo === prevScn.date);
    if (canAutofill) setDateDebutIndispo(scn.date);
  };

  const syncScenarioBlesses = (
    nextScenarioOrigine: string | undefined,
    nextCondition: ConditionPhysique,
  ) => {
    if (!nextScenarioOrigine) return;
    if (nextScenarioOrigine === marine.scenarioOrigine) return;
    const event = state.events.find(
      (e) => e.type === 'scenario-added' && e.scenario.id === nextScenarioOrigine,
    );
    if (!event || event.type !== 'scenario-added') return;
    const target = event.scenario;
    const alreadyIn =
      target.morts.includes(marine.id) ||
      target.blesses.some((b) => b.marineId === marine.id);
    if (alreadyIn) return;
    const isDeadNow = nextCondition === CONDITION_PHYSIQUE.MORT;
    const participants = target.participants.includes(marine.id)
      ? target.participants
      : [...target.participants, marine.id];
    const nextScenario: Scenario = isDeadNow
      ? { ...target, participants, morts: [...target.morts, marine.id] }
      : {
          ...target,
          participants,
          blesses: [...target.blesses, { marineId: marine.id, details: nextCondition } as BlesseInfo],
        };
    const nextUpdates = buildMarineUpdates(nextScenario, view.marines, event.marineUpdates);
    dispatch({
      type: 'UPDATE_SCENARIO',
      scenarioId: target.id,
      scenario: nextScenario,
      marineUpdates: nextUpdates,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextDateDebut = showConvalescenceFields && dateDebutIndispo ? dateDebutIndispo : undefined;
    const parsedDuree = dureeJours === '' ? undefined : Number(dureeJours);
    const nextDuree = showConvalescenceFields && parsedDuree !== undefined && !isNaN(parsedDuree) && parsedDuree >= 0 ? parsedDuree : undefined;
    const nextScenarioOrigine = showConvalescenceFields && scenarioOrigine ? scenarioOrigine : undefined;

    dispatch({
      type: 'UPDATE_MARINE_FIELDS',
      marineId: marine.id,
      reason: 'health',
      fields: {
        conditionPhysique,
        etatPsychologique,
        dateDebutIndispo: nextDateDebut,
        dureeJours: nextDuree,
        scenarioOrigine: nextScenarioOrigine,
      },
    });

    syncScenarioBlesses(nextScenarioOrigine, conditionPhysique);

    onClose();
  };

  const clearConvalescence = () => {
    setDateDebutIndispo('');
    setDureeJours('');
    setScenarioOrigine('');
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <form
        onSubmit={handleSubmit}
        className="bg-gray-800 border border-gray-700 rounded-lg p-5 space-y-4 w-full max-w-md shadow-xl"
      >
        <h3 className="text-sm font-medium text-gray-300 uppercase tracking-wider">
          État de santé — {marine.nom}
        </h3>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Condition physique</label>
            <select
              ref={firstRef}
              value={conditionPhysique}
              onChange={(e) => setConditionPhysique(e.target.value as ConditionPhysique)}
              className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            >
              {CONDITIONS_PHYSIQUES.map((c) => (
                <option key={c} value={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">État psychologique</label>
            <select
              value={etatPsychologique}
              onChange={(e) => setEtatPsychologique(e.target.value as EtatPsychologique)}
              className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
            >
              {ETATS_PSYCHOLOGIQUES.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        </div>

        {showConvalescenceFields && (
          <div className="space-y-3 pt-1 border-t border-gray-700/60">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Convalescence</span>
              {(dateDebutIndispo || dureeJours || scenarioOrigine) && (
                <button
                  type="button"
                  onClick={clearConvalescence}
                  className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
            {scenariosByDate.length > 0 && (
              <div>
                <label className="block text-xs text-gray-400 mb-1">Scénario d'origine</label>
                <select
                  value={scenarioOrigine}
                  onChange={(e) => handleScenarioChange(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                >
                  <option value="">— Aucun —</option>
                  {scenariosByDate.map((s) => (
                    <option key={s.id} value={s.id}>
                      {s.nom} ({s.date})
                    </option>
                  ))}
                </select>
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-gray-400 mb-1">Début indispo</label>
                <input
                  type="date"
                  value={dateDebutIndispo}
                  onChange={(e) => setDateDebutIndispo(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-400 mb-1">Durée (jours)</label>
                <input
                  type="number"
                  min={0}
                  value={dureeJours}
                  onChange={(e) => setDureeJours(e.target.value)}
                  className="w-full bg-gray-700 text-gray-100 text-sm rounded px-3 py-2 border border-gray-600 focus:outline-none focus:border-amber-500"
                />
              </div>
            </div>
            {remaining !== null && (
              <div className="text-xs text-gray-400">
                {remaining <= 0
                  ? <span className="text-green-400">Opérationnel au {state.dateObservation}</span>
                  : <span className="text-amber-400">{remaining}j restants au {state.dateObservation}</span>}
              </div>
            )}
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-amber-600 hover:bg-amber-500 rounded text-sm font-medium transition-colors cursor-pointer"
          >
            Enregistrer
          </button>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 rounded text-sm text-gray-300 transition-colors cursor-pointer"
          >
            Annuler
          </button>
        </div>
      </form>
    </div>
  );
}
