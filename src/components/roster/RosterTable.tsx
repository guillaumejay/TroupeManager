import { useCampaign } from '../../context/CampaignContext';
import { RosterRow } from './RosterRow';

const HEADERS = [
  'Nom', 'Grade', 'Spécialisation', 'Condition physique',
  'État psychologique', 'Début indispo', 'Durée (jours)', 'Statut', '',
];

export function RosterTable() {
  const { state, view } = useCampaign();

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-gray-700 text-gray-400 text-xs uppercase tracking-wider">
            {HEADERS.map((h) => (
              <th key={h} className="px-3 py-3 font-medium">{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {view.marines.map((marine) => (
            <RosterRow
              key={marine.id}
              marine={marine}
              isHighlighted={state.highlightedMarineIds.includes(marine.id)}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}
