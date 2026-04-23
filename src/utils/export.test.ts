import { describe, it, expect } from 'vitest';
import { formatRosterText } from './export';
import { INITIAL_STATE } from '../data/initialState';
import { deriveView } from './deriveState';

// Tests assert the state AFTER all three seed scenarios have fired.
const END_OF_SEED = '2186-03-05';
const SEED_MARINES = deriveView(INITIAL_STATE.events, END_OF_SEED).marines;

describe('formatRosterText', () => {
  it('includes header with date', () => {
    const text = formatRosterText(SEED_MARINES, END_OF_SEED);
    expect(text).toContain('=== ROSTER — 2186-03-05 ===');
  });

  it('shows dead marines with [MORT]', () => {
    const text = formatRosterText(SEED_MARINES, END_OF_SEED);
    expect(text).toContain('Mule (2nd, SmartGun) — Physique: [MORT]');
  });

  it('shows convalescent marines with remaining days', () => {
    const text = formatRosterText(SEED_MARINES, END_OF_SEED);
    // Crash Test: 5 days from 2186-03-04, at 2186-03-05 → 4j
    expect(text).toContain('Crash Test (2nd, Fusilier) — Physique: [Convalescence] — 4j restants');
  });

  it('shows healthy marines with [RAS]', () => {
    const text = formatRosterText(SEED_MARINES, END_OF_SEED);
    expect(text).toContain('Papi (2nd, SmartGun) — Physique: [RAS]');
  });

  it('includes all 16 marines', () => {
    const text = formatRosterText(SEED_MARINES, END_OF_SEED);
    const marineLines = text.split('\n').filter((l) => l.includes('—'));
    expect(marineLines.length).toBeGreaterThanOrEqual(16);
  });
});
