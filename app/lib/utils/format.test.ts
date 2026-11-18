import { describe, expect, it } from 'vitest';
import {
  calendarDaysUntil,
  daysUntil,
  formatAmount,
  initials,
  timeAgo,
} from './format';

const now = Date.parse('2026-09-23T12:00:00Z');

describe('calendarDaysUntil', () => {
  it('counts Kenyan calendar days, not 24-hour blocks', () => {
    const at = (iso: string) => Date.parse(iso);
    // 10:00 tomorrow is "1" at 10:30 today, and still "1" late tonight.
    expect(
      calendarDaysUntil(
        '2026-11-19T10:00:00+03:00',
        at('2026-11-18T10:30:00+03:00')
      )
    ).toBe(1);
    expect(
      calendarDaysUntil(
        '2026-11-19T00:30:00+03:00',
        at('2026-11-18T23:30:00+03:00')
      )
    ).toBe(1);
    // A deadline stored at 23:59 Nairobi (20:59 UTC) is that day, not the next.
    expect(
      calendarDaysUntil('2026-11-19T20:59:00Z', at('2026-11-18T09:00:00+03:00'))
    ).toBe(1);
    expect(
      calendarDaysUntil(
        '2026-11-18T08:00:00+03:00',
        at('2026-11-18T09:00:00+03:00')
      )
    ).toBe(0);
  });
});

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
