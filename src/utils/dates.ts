/**
 * Parse "YYYY-MM-DD" to a Date object (UTC to avoid timezone issues).
 */
export function parseDate(dateStr: string): Date {
  const [y, m, d] = dateStr.split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d));
}

/**
 * Format a Date to "YYYY-MM-DD".
 */
export function formatDate(date: Date): string {
  const y = date.getUTCFullYear();
  const m = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

/**
 * Add days to a "YYYY-MM-DD" string.
 */
export function addDays(dateStr: string, days: number): string {
  const date = parseDate(dateStr);
  date.setUTCDate(date.getUTCDate() + days);
  return formatDate(date);
}

/**
 * Calculate remaining convalescence days.
 * Returns the number of days remaining. If <= 0, the marine is operational.
 * Returns null if dateDebut or dureeJours is missing (not in convalescence).
 */
export function joursRestants(
  dateDebut: string | undefined,
  dureeJours: number | undefined,
  dateCourante: string,
): number | null {
  if (!dateDebut || dureeJours === undefined) return null;
  const debut = parseDate(dateDebut);
  const courante = parseDate(dateCourante);
  const fin = new Date(debut);
  fin.setUTCDate(fin.getUTCDate() + dureeJours);
  const diffMs = fin.getTime() - courante.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Format a date for display: "3 mars 2186"
 */
export function formatDateDisplay(dateStr: string): string {
  const mois = [
    'janvier', 'février', 'mars', 'avril', 'mai', 'juin',
    'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre',
  ];
  const date = parseDate(dateStr);
  return `${date.getUTCDate()} ${mois[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}
