import { isAxiosError } from 'axios';

/** Pure helpers behind the org hooks (kept separate so they're testable). */

/** 404 for an org you can't see — the backend hides non-member orgs the same way. */
export class OrgNotFoundError extends Error {
  readonly status = 404;
  constructor(slug: string) {
    super(`Organization "${slug}" not found`);
    this.name = 'OrgNotFoundError';
  }
}

/** Fetch every DRF page. `maxPages` guards against a paginator that never ends. */
export async function collectPages<T>(
  fetchPage: (page: number) => Promise<{ results: T[]; next: string | null }>,
  maxPages = 20
): Promise<T[]> {
  const all: T[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const { results, next } = await fetchPage(page);
    all.push(...results);
    if (!next) break;
  }
  return all;
}

export function findBySlug<T extends { slug: string }>(
  views: T[],
  slug: string
): T {
  const match = views.find((view) => view.slug === slug);
  if (!match) throw new OrgNotFoundError(slug);
  return match;
}

/**
 * DRF validation errors (`{ field: ["message"] }`) keyed by our camelCase
 * form fields, so they can show under the right input.
 */
export function serverFieldErrors(error: unknown): Record<string, string> {
  const data = isAxiosError(error) ? error.response?.data : undefined;
  if (!data || typeof data !== 'object') return {};
  const fields: Record<string, string> = {};
  for (const [key, value] of Object.entries(data as Record<string, unknown>)) {
    // The backend sends both `["msg"]` (serializers) and `"msg"` (services).
    const message = Array.isArray(value) ? value[0] : value;
    if (typeof message === 'string' && key !== 'detail' && key !== 'code') {
      fields[key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase())] =
        message;
    }
  }
  return fields;
}

/**
 * The org id when a request 404s on `/organizations/<id>…` — the org was
 * archived or I lost access while it was open. Null for anything else.
 */
export function orgGoneId(error: unknown): string | null {
  if (!isAxiosError(error) || error.response?.status !== 404) return null;
  const match = /^\/organizations\/([A-Za-z0-9-]+)(?:\/|$)/.exec(
    error.config?.url ?? ''
  );
  return match && match[1] !== 'invitations' ? match[1] : null;
}

/** Required fields left blank (empty string, whitespace or empty list). */
export function missingRequired(
  values: Record<string, unknown>,
  required: readonly string[]
): string[] {
  return required.filter((name) => {
    const value = values[name];
    if (Array.isArray(value)) return value.length === 0;
    if (typeof value === 'string') return value.trim() === '';
    return value == null;
  });
}
