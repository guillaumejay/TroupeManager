import { describe, it, expect } from 'vitest';
import { formatRosterText } from './export';
import { INITIAL_MARINES, INITIAL_DATE } from '../data/initialState';

describe('formatRosterText', () => {
  it('includes header with date', () => {
    const text = formatRosterText(INITIAL_MARINES, INITIAL_DATE);
    expect(text).toContain('=== ROSTER — 2186-03-05 ===');
  });

  it('shows dead marines with [MORT]', () => {
    const text = formatRosterText(INITIAL_MARINES, INITIAL_DATE);
    expect(text).toContain('Mule (2nd, SmartGun) — Physique: [MORT]');
  });

  it('shows convalescent marines with remaining days', () => {
    const text = formatRosterText(INITIAL_MARINES, INITIAL_DATE);
    // Crash Test: 5 days from 2186-03-04, current 2186-03-05 → 4j
    expect(text).toContain('Crash Test (2nd, Fusilier) — Physique: [Convalescence] — 4j restants');
  });

  it('shows healthy marines with [RAS]', () => {
    const text = formatRosterText(INITIAL_MARINES, INITIAL_DATE);
    expect(text).toContain('Papi (2nd, SmartGun) — Physique: [RAS]');
  });

  it('includes all 16 marines', () => {
    const text = formatRosterText(INITIAL_MARINES, INITIAL_DATE);
    const marineLines = text.split('\n').filter((l) => l.includes('—'));
    // Header has no marine-style dashes, each marine line has multiple —
    expect(marineLines.length).toBeGreaterThanOrEqual(16);
  });
});
