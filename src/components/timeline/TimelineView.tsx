import { useCampaign } from '../../context/CampaignContext';
import { ScenarioMarker } from './ScenarioMarker';
import { AddScenarioForm } from '../scenario/AddScenarioForm';

export function TimelineView() {
  const { state, dispatch } = useCampaign();
  const { scenarios, marines, highlightedMarineIds } = state;

  const getMarineName = (id: string) => marines.find((m) => m.id === id)?.nom ?? id;

  const handleScenarioClick = (scenarioId: string) => {
    const scenario = scenarios.find((s) => s.id === scenarioId);
    if (!scenario) return;

    const involvedIds = [
      ...scenario.morts,
      ...scenario.blesses.map((b) => b.marineId),
    ];

    // Toggle: if same scenario is clicked again, clear highlight
    const alreadyHighlighted = involvedIds.length > 0 &&
      involvedIds.every((id) => highlightedMarineIds.includes(id)) &&
      highlightedMarineIds.length === involvedIds.length;

    if (alreadyHighlighted) {
      dispatch({ type: 'CLEAR_HIGHLIGHT' });
    } else {
      dispatch({ type: 'HIGHLIGHT_MARINES', marineIds: involvedIds });
    }
  };

  return (
    <div className="space-y-8">
      {/* Timeline axis */}
      <div className="relative">
        <div className="flex items-stretch gap-0 overflow-x-auto pb-4">
          {scenarios.map((scenario, index) => (
            <ScenarioMarker
              key={scenario.id}
              scenario={scenario}
              getMarineName={getMarineName}
              onClick={() => handleScenarioClick(scenario.id)}
              isActive={
                highlightedMarineIds.length > 0 &&
                [...scenario.morts, ...scenario.blesses.map((b) => b.marineId)]
                  .some((id) => highlightedMarineIds.includes(id))
              }
              isFirst={index === 0}
            />
          ))}
          {/* Arrow cap */}
          <div className="flex items-center">
            <div className="w-0 h-0 border-y-[12px] border-y-transparent border-l-[16px] border-l-gray-600" />
          </div>
        </div>
      </div>

      {/* Add scenario form */}
      <AddScenarioForm />
    </div>
  );
}
