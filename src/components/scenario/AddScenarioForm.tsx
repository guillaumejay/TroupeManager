import { useState } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import { ScenarioForm } from './ScenarioForm';

export function AddScenarioForm() {
  const { dispatch } = useCampaign();
  const [isOpen, setIsOpen] = useState(false);

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
    <div className="bg-gray-800 border border-gray-700 rounded-lg p-4 max-w-2xl">
      <ScenarioForm
        mode="create"
        title="Nouveau scénario"
        onSubmit={(scenario, marineUpdates) => {
          dispatch({ type: 'ADD_SCENARIO', scenario, marineUpdates });
          setIsOpen(false);
        }}
        onCancel={() => setIsOpen(false)}
      />
    </div>
  );
}
