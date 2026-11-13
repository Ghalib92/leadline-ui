import type { MyOrg } from '~/lib/schema';

const KEY = 'leadline:lastOrg';

/** Invitations waiting for the user when they land. */
export interface Waiting {
  /** An invite link's token is stashed for this tab (see `pending-invite.ts`). */
  pendingInvite: boolean;
  /** Pending invitations in their inbox (`GET /organizations/invitations/received/`). */
  inboxCount: number;
}

/**
 * Where `/app` sends a signed-in user. Pure, so it's testable.
 *
 * An invitation beats creating an organization: someone who signed up from an
 * invite link should join, not be asked to set up a new workspace.
 */
export function resolveLandingPath(
  orgs: MyOrg[],
  lastSlug: string | null,
  waiting: Waiting = { pendingInvite: false, inboxCount: 0 }
): string {
  // Only people with nowhere else to go are sent to an invitation, so a
  // stashed link someone won't accept can never trap an existing member.
  if (orgs.length === 0) {
    if (waiting.pendingInvite) return '/invitations/accept';
    return waiting.inboxCount > 0 ? '/invitations' : '/onboarding';
  }
  const match = orgs.find((entry) => entry.org.slug === lastSlug);
  return `/o/${(match ?? orgs[0]).org.slug}`;
}

export function readLastOrg(): string | null {
  if (typeof globalThis.window === 'undefined') return null;
  try {
    return globalThis.localStorage.getItem(KEY);
  } catch {
    return null;
  }
}

export function writeLastOrg(slug: string): void {
  if (typeof globalThis.window === 'undefined') return;
  try {
    globalThis.localStorage.setItem(KEY, slug);
  } catch {
    // Private mode / blocked storage: the fallback (first org) is fine.
  }
}
