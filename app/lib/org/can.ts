import type { Role } from '~/lib/schema';

/**
 * Mirrors the backend's rules so the UI hides controls the API would refuse.
 * The backend stays the source of truth (agents also carry `can_manage`).
 */
export type Action =
  | 'org.update'
  | 'members.manage'
  | 'agents.create'
  | 'agents.manage'
  | 'opportunities.triage';

const adminOnly: ReadonlySet<Action> = new Set([
  'org.update',
  'members.manage',
  'agents.manage',
]);

export interface CanContext {
  userId?: string;
  /** Owner of the resource, for "own only" rules. */
  ownerId?: string;
}

export function can(
  role: Role | null | undefined,
  action: Action,
  ctx: CanContext = {}
): boolean {
  if (!role) return false;
  if (role === 'admin') return true;
  // Members may manage the agents they created.
  if (action === 'agents.manage') {
    return !!ctx.userId && ctx.userId === ctx.ownerId;
  }
  return !adminOnly.has(action);
}
