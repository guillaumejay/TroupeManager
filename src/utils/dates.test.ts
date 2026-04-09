import { describe, it, expect } from 'vitest';
import { joursRestants, addDays, formatDateDisplay, parseDate, formatDate } from './dates';

describe('parseDate / formatDate', () => {
  it('round-trips a date string', () => {
    expect(formatDate(parseDate('2186-03-05'))).toBe('2186-03-05');
  });
});

describe('addDays', () => {
  it('adds days to a date', () => {
    expect(addDays('2186-03-05', 1)).toBe('2186-03-06');
  });

  it('handles month boundary', () => {
    expect(addDays('2186-03-31', 1)).toBe('2186-04-01');
  });
});

describe('joursRestants', () => {
  it('returns null when no dateDebut', () => {
    expect(joursRestants(undefined, 10, '2186-03-05')).toBeNull();
  });

  it('returns null when no dureeJours', () => {
    expect(joursRestants('2186-03-04', undefined, '2186-03-05')).toBeNull();
  });

  it('calculates remaining days correctly', () => {
    // Crash Test: start 2186-03-04, 51 days, current 2186-03-05
    // End = 2186-03-04 + 51 = 2186-04-24
    // Remaining = 2186-04-24 - 2186-03-05 = 50 days
    expect(joursRestants('2186-03-04', 51, '2186-03-05')).toBe(50);
  });

  it('returns 0 or negative when convalescence is over', () => {
    // 1 day starting 2186-03-05, current 2186-03-06
    // End = 2186-03-06, remaining = 0
    expect(joursRestants('2186-03-05', 1, '2186-03-06')).toBe(0);
  });

  it('returns negative when past convalescence', () => {
    expect(joursRestants('2186-03-01', 2, '2186-03-05')).toBe(-2);
  });
});

describe('formatDateDisplay', () => {
  it('formats date in French', () => {
    expect(formatDateDisplay('2186-03-05')).toBe('5 mars 2186');
  });

  it('formats another date', () => {
    expect(formatDateDisplay('2186-04-24')).toBe('24 avril 2186');
  });
});
