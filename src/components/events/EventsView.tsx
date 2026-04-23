import type { CampaignEvent, EventType } from '../../types';
import { useCampaign } from '../../context/CampaignContext';
import { formatDateDisplay } from '../../utils/dates';

const TYPE_META: Record<EventType, { label: string; dotClass: string }> = {
  'marine-added': { label: 'Marine', dotClass: 'bg-green-400' },
  'marine-updated': { label: 'Édition', dotClass: 'bg-amber-400' },
  'marine-sheet-updated': { label: 'Fiche', dotClass: 'bg-indigo-400' },
  'marine-health-updated': { label: 'Santé', dotClass: 'bg-rose-400' },
  'scenario-added': { label: 'Scénario', dotClass: 'bg-red-400' },
  'day-advanced': { label: 'Jour', dotClass: 'bg-sky-400' },
};

function formatTimestamp(iso: string): string {
  const d = new Date(iso);
  if (isNaN(d.getTime())) return iso;
  const date = d.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  const time = d.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' });
  return `${date} ${time}`;
}

function EventRow({ event }: { event: CampaignEvent }) {
  const meta = TYPE_META[event.type];
  return (
    <li className="flex items-start gap-3 py-3 border-b border-gray-800 last:border-b-0">
      <span className={`mt-1.5 inline-block w-2 h-2 rounded-full shrink-0 ${meta.dotClass}`} aria-hidden="true" />
      <div className="flex-1 min-w-0">
        <div className="text-sm text-gray-100 break-words">{event.label}</div>
        <div className="text-xs text-gray-500 mt-0.5">
          <span className="text-gray-400">{meta.label}</span>
          <span className="mx-1.5">·</span>
          <span>Campagne : {formatDateDisplay(event.dateCampagne)}</span>
          <span className="mx-1.5">·</span>
          <span title={event.timestamp}>{formatTimestamp(event.timestamp)}</span>
        </div>
      </div>
    </li>
  );
}

export function EventsView() {
  const { state } = useCampaign();
  const events = [...state.events].reverse();

  if (events.length === 0) {
    return (
      <div className="text-center text-gray-500 text-sm py-12">
        Aucun événement pour l'instant. Toute modification du roster ou de la campagne sera enregistrée ici.
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 px-1">
        {state.events.length} événement{state.events.length > 1 ? 's' : ''} · ordre chronologique inverse
      </div>
      <ul className="bg-gray-800/40 border border-gray-700/60 rounded-lg px-4 divide-gray-800">
        {events.map((event) => (
          <EventRow key={event.id} event={event} />
        ))}
      </ul>
    </div>
  );
}
