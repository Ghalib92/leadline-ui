import { afterEach, describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  clearStashedInvite,
  dropTokenFromUrl,
  inviteErrorText,
  inviteHint,
  resolveInviteToken,
  isInviteToken,
  readStashedInvite,
  readTokenFromHash,
  stashInvite,
} from './pending-invite';

afterEach(() => clearStashedInvite());

describe('invite token hand-off', () => {
  it('reads a well-formed token from the fragment', () => {
    const t = 'a'.repeat(43);
    expect(readTokenFromHash(`#token=${t}`)).toBe(t);
    expect(readTokenFromHash('#token=invite-kijani-grace')).toBe(
      'invite-kijani-grace'
    );
    expect(readTokenFromHash('#token=short')).toBeNull();
    expect(readTokenFromHash('#token=has%20space-in-it-oops')).toBeNull();
    expect(readTokenFromHash('')).toBeNull();
  });

  it('only accepts url-safe tokens of a sane length', () => {
    expect(isInviteToken('A-b_' + 'c'.repeat(39))).toBe(true);
    expect(isInviteToken('x'.repeat(65))).toBe(false);
    expect(isInviteToken('<script>alert(1)</script>')).toBe(false);
  });

  it('stashes and clears the token for the session', () => {
    stashInvite('b'.repeat(43));
    expect(readStashedInvite()).toBe('b'.repeat(43));
    clearStashedInvite();
    expect(readStashedInvite()).toBeNull();
  });

  it('ignores a tampered stash', () => {
    globalThis.sessionStorage.setItem('leadline:pendingInvite', 'bad token!');
    expect(readStashedInvite()).toBeNull();
  });
});

describe('resolveInviteToken', () => {
  const a = 'a'.repeat(43);
  const b = 'b'.repeat(43);
  it('prefers the link, falls back to the stash when the link has no token', () => {
    expect(resolveInviteToken(`#token=${b}`, a)).toBe(b);
    expect(resolveInviteToken('', a)).toBe(a);
  });
  it('never shows an older invite for a broken link', () => {
    expect(resolveInviteToken('#token=cut-o', a)).toBeNull();
  });
});

describe('dropTokenFromUrl', () => {
  it("removes the fragment but keeps the router's history state", () => {
    globalThis.history.replaceState(
      { idx: 3, key: 'k' },
      '',
      '/invitations/accept#token=x'
    );
    dropTokenFromUrl('/invitations/accept');
    expect(globalThis.location.hash).toBe('');
    expect(globalThis.history.state).toEqual({ idx: 3, key: 'k' });
  });
});

describe('inviteHint', () => {
  it('points at the stashed link or the inbox', () => {
    expect(inviteHint({ hasLink: true, inbox: 0 })).toBe('link');
    expect(inviteHint({ hasLink: false, inbox: 2 })).toBe('inbox');
  });
  it('says nothing when nothing is waiting (the inbox now lists invites in both modes)', () => {
    expect(inviteHint({ hasLink: false, inbox: 0 })).toBeNull();
  });
});

describe('inviteErrorText', () => {
  const axiosError = (status: number, data: unknown) =>
    new AxiosError(
      `Request failed with status code ${status}`,
      'ERR',
      undefined,
      null,
      {
        status,
        statusText: '',
        data,
        headers: {},
        config: { headers: new AxiosHeaders() },
      }
    );
  it("uses the API's detail when there is one", () => {
    expect(inviteErrorText(axiosError(400, { detail: 'Expired.' }))).toBe(
      'Expired.'
    );
  });
  it('never shows axios internals', () => {
    expect(inviteErrorText(axiosError(400, { token: ['Bad.'] }))).toMatch(
      /expired, been revoked/
    );
    expect(inviteErrorText(new AxiosError('Network Error'))).toMatch(
      /expired, been revoked/
    );
  });
});
