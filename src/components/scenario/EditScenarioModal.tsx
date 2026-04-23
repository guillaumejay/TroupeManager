import { useEffect } from 'react';
import { useCampaign } from '../../context/CampaignContext';
import type { Scenario } from '../../types';
import { ScenarioForm } from './ScenarioForm';

interface EditScenarioModalProps {
  scenario: Scenario;
  onClose: () => void;
}

export function EditScenarioModal({ scenario, onClose }: EditScenarioModalProps) {
  const { state, dispatch } = useCampaign();

  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const existingEvent = state.events.find(
    (e) => e.type === 'scenario-added' && e.scenario.id === scenario.id,
  );
  const previousUpdates =
    existingEvent && existingEvent.type === 'scenario-added'
      ? existingEvent.marineUpdates
      : undefined;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-gray-800 border border-gray-700 rounded-lg p-5 w-full max-w-2xl shadow-xl">
        <ScenarioForm
          mode="edit"
          initial={scenario}
          previousUpdates={previousUpdates}
          title={`Éditer — ${scenario.nom}`}
          onSubmit={(nextScenario, marineUpdates) => {
            dispatch({
              type: 'UPDATE_SCENARIO',
              scenarioId: scenario.id,
              scenario: nextScenario,
              marineUpdates,
            });
            onClose();
          }}
          onCancel={onClose}
        />
      </div>
    </div>
  );
}
