import type { ConditionPhysique, EtatPsychologique } from '../../types';

type BadgeVariant = 'green' | 'orange' | 'red' | 'gray';

function getConditionVariant(condition: ConditionPhysique): BadgeVariant {
  switch (condition) {
    case 'RAS': return 'green';
    case 'Blessure légère':
    case 'Blessure grave':
    case 'Convalescence': return 'orange';
    case 'MORT': return 'red';
  }
}

function getEtatVariant(etat: EtatPsychologique): BadgeVariant {
  switch (etat) {
    case 'RAS': return 'green';
    case 'Léger trouble':
    case 'Anxieux': return 'orange';
    case 'Instable': return 'red';
    case 'MORT': return 'gray';
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
