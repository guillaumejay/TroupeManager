import type { Scenario } from '../../types';
import { formatDateDisplay } from '../../utils/dates';

interface ScenarioMarkerProps {
  scenario: Scenario;
  getMarineName: (id: string) => string;
  onClick: () => void;
  onEdit: () => void;
  isActive: boolean;
  isFirst: boolean;
}

export function ScenarioMarker({
  scenario,
  getMarineName,
  onClick,
  onEdit,
  isActive,
  isFirst,
}: ScenarioMarkerProps) {
  const casualtyIds = new Set<string>([
    ...scenario.morts,
    ...scenario.blesses.map((b) => b.marineId),
  ]);
  const intactIds = scenario.participants.filter((id) => !casualtyIds.has(id));

  return (
    <div className="flex flex-col items-center min-w-[200px] flex-1">
      {/* Intacts — above the axis */}
      <div className="min-h-[60px] flex flex-col items-center justify-end pb-2">
        {intactIds.map((id) => (
          <span key={id} className="text-xs text-green-400/80 leading-tight">
            ✓ {getMarineName(id)}
          </span>
        ))}
      </div>

      {/* Axis line + marker */}
      <div className="relative w-full flex items-center">
        <div className={`flex-1 h-1.5 ${isFirst ? 'rounded-l' : ''} bg-gray-600`} />
        <div className="relative z-10 group">
          <button
            onClick={onClick}
            className={`flex flex-col items-center px-3 py-2 rounded-lg border transition-all cursor-pointer ${
              isActive
                ? 'bg-amber-900/60 border-amber-500 shadow-lg shadow-amber-500/20'
                : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-750'
            }`}
          >
            <span className={`text-sm font-medium ${isActive ? 'text-amber-300' : 'text-gray-200'}`}>
              {scenario.nom}
            </span>
            <span className="text-xs text-gray-400">{formatDateDisplay(scenario.date)}</span>
            {scenario.participants.length > 0 && (
              <span className="text-[10px] text-gray-500 mt-0.5">
                👥 {scenario.participants.length}
              </span>
            )}
          </button>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              onEdit();
            }}
            className="absolute -top-1.5 -right-1.5 p-1 bg-gray-700 border border-gray-600 rounded text-gray-300 hover:text-gray-100 hover:border-gray-400 opacity-0 group-hover:opacity-100 focus:opacity-100 transition-opacity cursor-pointer"
            title="Éditer le scénario"
            aria-label="Éditer le scénario"
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 20h9" />
              <path d="M16.5 3.5a2.121 2.121 0 0 1 3 3L7 19l-4 1 1-4Z" />
            </svg>
          </button>
        </div>
        <div className={`flex-1 h-1.5 bg-gray-600`} />
      </div>

      {/* Blessés + Morts — below the axis */}
      <div className="min-h-[60px] flex flex-col items-center justify-start pt-2">
        {scenario.blesses.map((b) => (
          <span key={b.marineId} className="text-xs text-amber-400 leading-tight">
            🤕 {getMarineName(b.marineId)}
          </span>
        ))}
        {scenario.morts.map((id) => (
          <span key={id} className="text-xs text-red-400 leading-tight">
            💀 {getMarineName(id)}
          </span>
        ))}
      </div>
    </div>
  );
}
