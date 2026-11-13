import { isAxiosError } from 'axios';

/**
 * The invite link's token, carried through sign-up → email code → sign-in.
 *
 * Links arrive as `/invitations/accept#token=…` (the fragment never reaches a
 * server or its logs). We keep the token in `sessionStorage` — this tab only,
 * gone when it closes — so the accept page can pick it up after auth.
 */
const storageKey = 'leadline:pendingInvite';

/** Sanity filter, not validation: the API decides. Backend tokens are 43 chars. */
export const isInviteToken = (token: string) =>
  /^[A-Za-z0-9_-]{16,64}$/.test(token);

export function readTokenFromHash(hash: string): string | null {
  const token = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  return token && isInviteToken(token) ? token : null;
}

export function stashInvite(token: string): void {
  try {
    globalThis.sessionStorage?.setItem(storageKey, token);
  } catch {
    // Storage blocked: the link still works while this page stays open.
  }
}

export function readStashedInvite(): string | null {
  try {
    const token = globalThis.sessionStorage?.getItem(storageKey) ?? null;
    return token && isInviteToken(token) ? token : null;
  } catch {
    return null;
  }
}

export function clearStashedInvite(): void {
  try {
    globalThis.sessionStorage?.removeItem(storageKey);
  } catch {
    // Nothing to clear.
  }
}

/**
 * The token to show: the link's, else the one stashed earlier in this tab.
 * A link that *has* a token which fails the check is broken — say so rather
 * than quietly showing an older invitation.
 */
export function resolveInviteToken(
  hash: string,
  stashed: string | null
): string | null {
  const raw = new URLSearchParams(hash.replace(/^#/, '')).get('token');
  if (raw === null) return stashed;
  return isInviteToken(raw) ? raw : null;
}

/** Drop the token from the address bar, keeping React Router's history state. */
export function dropTokenFromUrl(path: string): void {
  globalThis.history.replaceState(globalThis.history.state, '', path);
}

/** What to tell someone on onboarding about invitations waiting for them. */
export function inviteHint({
  hasLink,
  inbox,
}: {
  hasLink: boolean;
  inbox: number;
}): 'link' | 'inbox' | null {
  if (hasLink) return 'link';
  return inbox > 0 ? 'inbox' : null;
}

const unusableMessage =
  'It may have expired, been revoked or already been used. Ask for a new one.';

/** The API's own reason when it gave one; never axios internals. */
export function inviteErrorText(error: unknown): string {
  const detail = isAxiosError(error)
    ? (error.response?.data as { detail?: unknown } | undefined)?.detail
    : undefined;
  return typeof detail === 'string' && detail ? detail : unusableMessage;
}
