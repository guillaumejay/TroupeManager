import type { Marine, ConditionPhysique, EtatPsychologique, Specialisation } from '../../types';
import { useCampaign } from '../../context/CampaignContext';
import { joursRestants, formatDateDisplay } from '../../utils/dates';
import { StatusBadge } from './StatusBadge';
import { InlineEdit } from './InlineEdit';

const SPECIALISATIONS: Specialisation[] = [
  'Fusilier', 'Comtech', 'Medic', 'SmartGun', 'Recon', 'Sniper', 'NRBC', 'Heavy',
];

const CONDITIONS: ConditionPhysique[] = [
  'RAS', 'Blessure légère', 'Blessure grave', 'Convalescence', 'MORT',
];

const ETATS: EtatPsychologique[] = [
  'RAS', 'Léger trouble', 'Anxieux', 'Instable', 'MORT',
];

interface RosterRowProps {
  marine: Marine;
  isHighlighted: boolean;
}

export function RosterRow({ marine, isHighlighted }: RosterRowProps) {
  const { state, dispatch } = useCampaign();
  const isDead = marine.conditionPhysique === 'MORT';
  const isConvalescent = marine.conditionPhysique === 'Convalescence';
  const remaining = joursRestants(marine.dateDebutIndispo, marine.dureeJours, state.dateCourante);

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
        {isDead ? (
          <StatusBadge value={marine.conditionPhysique} type="condition" />
        ) : (
          <InlineEdit
            value={marine.conditionPhysique}
            onCommit={(v) => update('conditionPhysique', v as ConditionPhysique)}
            options={[...CONDITIONS]}
            disabled={false}
          />
        )}
      </td>
      <td className="px-3 py-2 whitespace-nowrap">
        {isDead ? (
          <StatusBadge value="MORT" type="etat" />
        ) : (
          <InlineEdit
            value={marine.etatPsychologique}
            onCommit={(v) => update('etatPsychologique', v as EtatPsychologique)}
            options={[...ETATS]}
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
    </tr>
  );
}
