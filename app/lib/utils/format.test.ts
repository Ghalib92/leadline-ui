import { describe, expect, it } from 'vitest';
import { daysUntil, formatAmount, initials, timeAgo } from './format';

const now = Date.parse('2026-09-23T12:00:00Z');

describe('format helpers', () => {
  it('formats ranges, caps and missing amounts', () => {
    expect(formatAmount({ min: 50000, max: 250000, currency: 'USD' })).toBe(
      '$50K – $250K'
    );
    expect(formatAmount({ max: 120000, currency: 'USD' })).toBe('Up to $120K');
    expect(formatAmount({ min: 500000, currency: 'USD' })).toBe('From $500K');
    expect(formatAmount({ min: 1_250_000, currency: 'USD' })).toBe(
      'From $1.3M'
    );
    expect(formatAmount(undefined)).toBe('Not stated');
  });

  it('counts whole days until a deadline', () => {
    expect(daysUntil('2026-09-30T12:00:00Z', now)).toBe(7);
    expect(daysUntil('2026-09-22T12:00:00Z', now)).toBe(-1);
  });

  it('describes how long ago something happened', () => {
    expect(timeAgo('2026-09-23T11:59:30Z', now)).toBe('just now');
    expect(timeAgo('2026-09-23T09:00:00Z', now)).toBe('3h ago');
    expect(timeAgo('2026-09-20T12:00:00Z', now)).toBe('3d ago');
  });

  it('builds initials', () => {
    expect(initials('Amina Wanjiru')).toBe('AW');
    expect(initials(undefined)).toBe('?');
  });
});
