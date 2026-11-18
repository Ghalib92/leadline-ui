import type { Opportunity } from '~/lib/schema';

const DAY = 86_400_000;

const compact = (value: number, currency: string) =>
  new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
    notation: 'compact',
    // Explicit: currency style defaults to 2 minimum digits, and older ICU
    // (Node 22) then keeps a trailing ".0" ("$50.0K").
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  }).format(value);

export function formatAmount(amount: Opportunity['amount']): string {
  if (!amount || (amount.min === undefined && amount.max === undefined)) {
    return 'Not stated';
  }
  const { min, max, currency } = amount;
  if (min !== undefined && max !== undefined) {
    return `${compact(min, currency)} – ${compact(max, currency)}`;
  }
  if (max !== undefined) return `Up to ${compact(max, currency)}`;
  return `From ${compact(min as number, currency)}`;
}

export function formatDate(iso?: string): string {
  if (!iso) return '—';
  return new Intl.DateTimeFormat('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(new Date(iso));
}

/** Whole days from now until `iso` (negative = past). */
export function daysUntil(iso: string, now = Date.now()): number {
  return Math.round((Date.parse(iso) - now) / DAY);
}

const nairobiDay = (time: number) =>
  new Date(time).toLocaleDateString('en-CA', { timeZone: 'Africa/Nairobi' });

/** Calendar days from today until `iso`'s day, both in Kenya time: a deadline at
 * 10:00 tomorrow is 1 ("tomorrow"), whatever the hour now (negative = past). */
export function calendarDaysUntil(iso: string, now = Date.now()): number {
  const target = Date.parse(nairobiDay(Date.parse(iso)));
  const today = Date.parse(nairobiDay(now));
  return Math.round((target - today) / DAY);
}

export function timeAgo(iso: string, now = Date.now()): string {
  const minutes = Math.floor((now - Date.parse(iso)) / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

export function initials(name?: string): string {
  if (!name?.trim()) return '?';
  return name
    .trim()
    .split(/\s+/)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}
