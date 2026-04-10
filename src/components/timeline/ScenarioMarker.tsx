import type { Scenario } from '../../types';
import { formatDateDisplay } from '../../utils/dates';

interface ScenarioMarkerProps {
  scenario: Scenario;
  getMarineName: (id: string) => string;
  onClick: () => void;
  isActive: boolean;
  isFirst: boolean;
}

export function ScenarioMarker({
  scenario,
  getMarineName,
  onClick,
  isActive,
  isFirst,
}: ScenarioMarkerProps) {
  return (
    <div className="flex flex-col items-center min-w-[200px] flex-1">
      {/* Blessés — above the axis */}
      <div className="min-h-[60px] flex flex-col items-center justify-end pb-2">
        {scenario.blesses.map((b) => (
          <span key={b.marineId} className="text-xs text-amber-400 leading-tight">
            🩹 {getMarineName(b.marineId)}
          </span>
        ))}
      </div>

      {/* Axis line + marker */}
      <div className="relative w-full flex items-center">
        <div className={`flex-1 h-1.5 ${isFirst ? 'rounded-l' : ''} bg-gray-600`} />
        <button
          onClick={onClick}
          className={`relative z-10 flex flex-col items-center px-3 py-2 rounded-lg border transition-all cursor-pointer ${
            isActive
              ? 'bg-amber-900/60 border-amber-500 shadow-lg shadow-amber-500/20'
              : 'bg-gray-800 border-gray-600 hover:border-gray-500 hover:bg-gray-750'
          }`}
        >
          <span className={`text-sm font-medium ${isActive ? 'text-amber-300' : 'text-gray-200'}`}>
            {scenario.nom}
          </span>
          <span className="text-xs text-gray-400">{formatDateDisplay(scenario.date)}</span>
        </button>
        <div className={`flex-1 h-1.5 bg-gray-600`} />
      </div>

      {/* Morts — below the axis */}
      <div className="min-h-[60px] flex flex-col items-center justify-start pt-2">
        {scenario.morts.map((id) => (
          <span key={id} className="text-xs text-red-400 leading-tight">
            💀 {getMarineName(id)}
          </span>
        ))}
      </div>
    </div>
  );
}
