import { useState } from 'react';
import type { Marine, EtatPsychologique, Specialisation } from '../../types';
import { useCampaign } from '../../context/CampaignContext';
import { joursRestants, formatDateDisplay } from '../../utils/dates';
import { StatusBadge } from './StatusBadge';
import { InlineEdit } from './InlineEdit';
import { EditSheetModal } from './EditSheetModal';
import { EditHealthModal } from './EditHealthModal';
import { SPECIALISATIONS, ETATS_PSYCHOLOGIQUES, CONDITION_PHYSIQUE, ETAT_PSYCHOLOGIQUE } from '../../data/domain';

interface RosterRowProps {
  marine: Marine;
  isHighlighted: boolean;
}

export function RosterRow({ marine, isHighlighted }: RosterRowProps) {
  const { state, view, dispatch } = useCampaign();
  const [editing, setEditing] = useState<'sheet' | 'health' | null>(null);
  const isDead = marine.conditionPhysique === CONDITION_PHYSIQUE.MORT;
  const isConvalescent = marine.conditionPhysique === CONDITION_PHYSIQUE.CONVALESCENCE;
  const remaining = joursRestants(marine.dateDebutIndispo, marine.dureeJours, state.dateObservation);
  const origineScenario = marine.scenarioOrigine
    ? view.scenarios.find((s) => s.id === marine.scenarioOrigine)
    : undefined;

  const update = (field: keyof Marine, value: Marine[keyof Marine]) => {
    dispatch({ type: 'UPDATE_MARINE', marineId: marine.id, field, value });
  };

  const rowClass = [
    'border-b border-gray-800 transition-colors',
    isDead ? 'line-through text-red-400/60 bg-red-950/20' : '',
    isConvalescent && !isDead ? 'text-gray-400 bg-gray-800/40' : '',
    isHighlighted ? 'bg-amber-900/30 ring-1 ring-amber-500/50' : '',
  ].filter(Boolean).join(' ');

  const formatRemaining = (): string => {
    if (isDead) return 'Définitive';
    if (remaining === null) return '—';
    if (remaining <= 0) return 'Opérationnel';
    return `${remaining}j restants`;
  };

  return (
    <>
      <tr className={rowClass}>
        <td className="px-3 py-2 whitespace-nowrap">
          <InlineEdit
            value={marine.nom}
            onCommit={(v) => update('nom', v)}
            disabled={false}
          />
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <InlineEdit
            value={marine.grade}
            onCommit={(v) => update('grade', v)}
            disabled={false}
          />
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <InlineEdit
            value={marine.specialisation}
            onCommit={(v) => update('specialisation', v as Specialisation)}
            options={[...SPECIALISATIONS]}
            disabled={false}
          />
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          <div className="flex flex-col gap-0.5">
            <StatusBadge value={marine.conditionPhysique} type="condition" />
            {origineScenario && !isDead && (
              <span className="text-[11px] text-gray-500 italic">
                Origine : {origineScenario.nom}
              </span>
            )}
          </div>
        </td>
        <td className="px-3 py-2 whitespace-nowrap">
          {isDead ? (
            <StatusBadge value={ETAT_PSYCHOLOGIQUE.MORT} type="etat" />
          ) : (
            <InlineEdit
              value={marine.etatPsychologique}
              onCommit={(v) => update('etatPsychologique', v as EtatPsychologique)}
              options={[...ETATS_PSYCHOLOGIQUES]}
              disabled={false}
            />
          )}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-400">
          {marine.dateDebutIndispo ? formatDateDisplay(marine.dateDebutIndispo) : '—'}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-sm">
          {isDead ? (
            <span className="text-red-400/60">Définitive</span>
          ) : marine.dureeJours !== undefined ? (
            <InlineEdit
              value={String(marine.dureeJours)}
              onCommit={(v) => update('dureeJours', Number(v))}
              type="number"
              disabled={false}
            />
          ) : (
            <span className="text-gray-500">—</span>
          )}
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-sm">
          <span className={
            remaining !== null && remaining <= 0 && !isDead
              ? 'text-green-400 font-medium'
              : isDead ? 'text-red-400/60' : 'text-amber-400'
          }>
            {formatRemaining()}
          </span>
        </td>
        <td className="px-3 py-2 whitespace-nowrap text-right">
          <div className="flex gap-1 justify-end">
            <button
              type="button"
              onClick={() => setEditing('sheet')}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer text-gray-200"
              title="Éditer la fiche (nom, grade, spécialisation)"
              aria-label="Éditer la fiche"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect width="18" height="18" x="3" y="3" rx="2" ry="2" />
                <circle cx="9" cy="10" r="2" />
                <path d="M15 8h2" />
                <path d="M15 12h2" />
                <path d="M7 16h10" />
              </svg>
            </button>
            <button
              type="button"
              onClick={() => setEditing('health')}
              className="p-1.5 bg-gray-700 hover:bg-gray-600 border border-gray-600 rounded transition-colors cursor-pointer text-gray-200"
              title="Éditer l'état de santé"
              aria-label="Éditer l'état de santé"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.05 3 5.5l7 7Z" />
                <path d="M3.22 12H9.5l.5-1 2 4.5 2-7 1.5 3.5h5.27" />
              </svg>
            </button>
          </div>
        </td>
      </tr>
      {editing === 'sheet' && (
        <EditSheetModal marine={marine} onClose={() => setEditing(null)} />
      )}
      {editing === 'health' && (
        <EditHealthModal marine={marine} onClose={() => setEditing(null)} />
      )}
    </>
  );
}
