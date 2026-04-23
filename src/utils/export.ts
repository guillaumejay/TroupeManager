import type { Marine } from '../types';
import { joursRestants } from './dates';
import { CONDITION_PHYSIQUE } from '../data/domain';

export function formatRosterText(marines: Marine[], dateCourante: string): string {
  const lines: string[] = [];
  lines.push(`=== ROSTER — ${dateCourante} ===`);
  lines.push('');

  for (const m of marines) {
    const remaining = joursRestants(m.dateDebutIndispo, m.dureeJours, dateCourante);
    const isDead = m.conditionPhysique === CONDITION_PHYSIQUE.MORT;

    let status: string;
    if (isDead) {
      status = `[MORT] — Scénario: ${m.scenarioMort ?? '?'}`;
    } else if (remaining !== null && remaining <= 0) {
      status = '[Opérationnel]';
    } else if (remaining !== null) {
      status = `[${m.conditionPhysique}] — ${remaining}j restants`;
    } else {
      status = `[${m.conditionPhysique}]`;
    }

    lines.push(`${m.nom} (${m.grade}, ${m.specialisation}) — Physique: ${status} — Psycho: ${m.etatPsychologique}`);
  }

  return lines.join('\n');
}

export async function copyRosterToClipboard(marines: Marine[], dateCourante: string): Promise<boolean> {
  const text = formatRosterText(marines, dateCourante);
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    // Fallback: prompt with pre-filled text
    window.prompt('Copier le texte ci-dessous :', text);
    return false;
  }
}
