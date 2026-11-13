import { describe, expect, it } from 'vitest';
import { can, type Action } from './can';
import type { Role } from '~/lib/schema';

const matrix: [Action, Record<Role, boolean>][] = [
  ['org.update', { admin: true, member: false }],
  ['members.manage', { admin: true, member: false }],
  ['agents.create', { admin: true, member: true }],
  ['opportunities.triage', { admin: true, member: true }],
];

describe('can', () => {
  it.each(matrix)('%s follows the role matrix', (action, expected) => {
    for (const role of ['admin', 'member'] as const) {
      expect(can(role, action)).toBe(expected[role]);
    }
  });

  it('denies everything without a role', () => {
    expect(can(null, 'opportunities.triage')).toBe(false);
    expect(can(undefined, 'agents.create')).toBe(false);
  });

  it('lets admins manage any agent', () => {
    expect(can('admin', 'agents.manage', { userId: 'a', ownerId: 'b' })).toBe(
      true
    );
  });

  it('lets members manage only their own agents', () => {
    expect(
      can('member', 'agents.manage', { userId: 'u1', ownerId: 'u1' })
    ).toBe(true);
    expect(
      can('member', 'agents.manage', { userId: 'u1', ownerId: 'u2' })
    ).toBe(false);
  });
});
