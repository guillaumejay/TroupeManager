import type { ConditionPhysique, EtatPsychologique } from '../../types';
import { CONDITION_PHYSIQUE, ETAT_PSYCHOLOGIQUE } from '../../data/domain';

type BadgeVariant = 'green' | 'orange' | 'red' | 'gray';

function getConditionVariant(condition: ConditionPhysique): BadgeVariant {
  switch (condition) {
    case CONDITION_PHYSIQUE.RAS: return 'green';
    case CONDITION_PHYSIQUE.BLESSURE_LEGERE:
    case CONDITION_PHYSIQUE.BLESSURE_GRAVE:
    case CONDITION_PHYSIQUE.CONVALESCENCE: return 'orange';
    case CONDITION_PHYSIQUE.MORT: return 'red';
  }
}

function getEtatVariant(etat: EtatPsychologique): BadgeVariant {
  switch (etat) {
    case ETAT_PSYCHOLOGIQUE.RAS: return 'green';
    case ETAT_PSYCHOLOGIQUE.LEGER_TROUBLE:
    case ETAT_PSYCHOLOGIQUE.ANXIEUX: return 'orange';
    case ETAT_PSYCHOLOGIQUE.INSTABLE: return 'red';
    case ETAT_PSYCHOLOGIQUE.MORT: return 'gray';
  }
}

const variantClasses: Record<BadgeVariant, string> = {
  green: 'bg-green-900/50 text-green-400 border-green-700/50',
  orange: 'bg-amber-900/50 text-amber-400 border-amber-700/50',
  red: 'bg-red-900/50 text-red-400 border-red-700/50',
  gray: 'bg-gray-800 text-gray-500 border-gray-700',
};

interface StatusBadgeProps {
  value: string;
  type: 'condition' | 'etat';
}

export function StatusBadge({ value, type }: StatusBadgeProps) {
  const variant = type === 'condition'
    ? getConditionVariant(value as ConditionPhysique)
    : getEtatVariant(value as EtatPsychologique);

  return (
    <span className={`inline-block px-2 py-0.5 text-xs rounded border ${variantClasses[variant]}`}>
      {value}
    </span>
  );
}
