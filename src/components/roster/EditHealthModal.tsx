import { useState, useEffect, useRef } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import type { Marine, ConditionPhysique, EtatPsychologique } from '../../types';
import { joursRestants } from '../../utils/dates';

const CONDITIONS: ConditionPhysique[] = [
  'RAS', 'Blessure légère', 'Blessure grave', 'Convalescence', 'MORT',
];

const ETATS: EtatPsychologique[] = [
  'RAS', 'Léger trouble', 'Anxieux', 'Instable', 'MORT',
];

interface EditHealthModalProps {
  marine: Marine;
  onClose: () => void;
}

export function EditHealthModal({ marine, onClose }: EditHealthModalProps) {
  const { state, dispatch } = useCampaign();
  const [conditionPhysique, setConditionPhysique] = useState<ConditionPhysique>(marine.conditionPhysique);
  const [etatPsychologique, setEtatPsychologique] = useState<EtatPsychologique>(marine.etatPsychologique);
  const [dateDebutIndispo, setDateDebutIndispo] = useState(marine.dateDebutIndispo ?? state.dateObservation);
  const [dureeJours, setDureeJours] = useState(
    marine.dureeJours !== undefined ? String(marine.dureeJours) : '',
  );
  const firstRef = useRef<HTMLSelectElement>(null);

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

  const isDead = conditionPhysique === 'MORT';
  const showConvalescenceFields = !isDead && (conditionPhysique !== 'RAS' || !!marine.dateDebutIndispo);

  const remaining = joursRestants(
    dateDebutIndispo || undefined,
    dureeJours ? Number(dureeJours) : undefined,
    state.dateObservation,
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const nextDateDebut = showConvalescenceFields && dateDebutIndispo ? dateDebutIndispo : undefined;
    const parsedDuree = dureeJours === '' ? undefined : Number(dureeJours);
    const nextDuree = showConvalescenceFields && parsedDuree !== undefined && !isNaN(parsedDuree) && parsedDuree >= 0 ? parsedDuree : undefined;

    dispatch({
      type: 'UPDATE_MARINE_FIELDS',
      marineId: marine.id,
      reason: 'health',
      fields: {
        conditionPhysique,
        etatPsychologique,
        dateDebutIndispo: nextDateDebut,
        dureeJours: nextDuree,
      },
    });

    onClose();
  };

  const clearConvalescence = () => {
    setDateDebutIndispo('');
    setDureeJours('');
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
              {CONDITIONS.map((c) => (
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
              {ETATS.map((et) => (
                <option key={et} value={et}>{et}</option>
              ))}
            </select>
          </div>
        </div>

        {showConvalescenceFields && (
          <div className="space-y-3 pt-1 border-t border-gray-700/60">
            <div className="flex items-center justify-between pt-2">
              <span className="text-xs text-gray-400 uppercase tracking-wider">Convalescence</span>
              {(dateDebutIndispo || dureeJours) && (
                <button
                  type="button"
                  onClick={clearConvalescence}
                  className="text-xs text-gray-400 hover:text-gray-200 cursor-pointer"
                >
                  Effacer
                </button>
              )}
            </div>
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
