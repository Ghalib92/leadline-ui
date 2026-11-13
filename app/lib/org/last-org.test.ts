import { describe, expect, it } from 'vitest';
import { resolveLandingPath } from './last-org';
import type { MyOrg } from '~/lib/schema';

const org = (slug: string): MyOrg => ({
  role: 'member',
  org: {
    id: slug,
    name: slug,
    slug,
    country: 'KE',
    type: 'ngo',
    size: '1-10',
    sectors: [],
    regions: [],
    opportunityTypes: [],
    createdAt: '2026-01-01T00:00:00Z',
    createdBy: 'u',
  },
});

describe('resolveLandingPath', () => {
  it('sends users without orgs to onboarding', () => {
    expect(resolveLandingPath([], 'anything')).toBe('/onboarding');
  });

  it('uses the last org when still a member', () => {
    expect(resolveLandingPath([org('a'), org('b')], 'b')).toBe('/o/b');
  });

  it('falls back to the first org when the last one is gone', () => {
    expect(resolveLandingPath([org('a'), org('b')], 'deleted')).toBe('/o/a');
  });

  it('falls back to the first org when nothing is stored', () => {
    expect(resolveLandingPath([org('a')], null)).toBe('/o/a');
  });

  it('sends a user with no orgs and a pending invite link to accept it', () => {
    expect(
      resolveLandingPath([], null, { pendingInvite: true, inboxCount: 0 })
    ).toBe('/invitations/accept');
  });

  it('sends a user with no orgs but invites in their inbox there', () => {
    expect(
      resolveLandingPath([], null, { pendingInvite: false, inboxCount: 2 })
    ).toBe('/invitations');
  });

  it('still onboards someone with nothing waiting', () => {
    expect(
      resolveLandingPath([], null, { pendingInvite: false, inboxCount: 0 })
    ).toBe('/onboarding');
  });

  it('never traps an existing member on a stashed invite', () => {
    expect(
      resolveLandingPath([org('a')], 'a', {
        pendingInvite: true,
        inboxCount: 0,
      })
    ).toBe('/o/a');
  });

  it('members with inbox invites still go to their org', () => {
    expect(
      resolveLandingPath([org('a')], 'a', {
        pendingInvite: false,
        inboxCount: 3,
      })
    ).toBe('/o/a');
  });
});
