// @vitest-environment node
import { describe, expect, it, vi } from 'vitest';
import { createSessionHelpers } from './session.server';

const requestWith = (setCookie: string) =>
  new Request('http://x/', { headers: { Cookie: setCookie.split(';')[0] } });

describe('session cookie', () => {
  const dev = createSessionHelpers({ NODE_ENV: 'development' });

  it('round-trips the token through an httpOnly cookie', async () => {
    const setCookie = await dev.commitSession({ token: 'access-token-123' });
    expect(setCookie).toMatch(/HttpOnly/i);
    expect(setCookie).toMatch(/SameSite=Lax/i);
    expect(setCookie).not.toContain('access-token-123');
    expect((await dev.readSession(requestWith(setCookie)))?.token ?? null).toBe(
      'access-token-123'
    );
  });

  it('ignores a tampered cookie', async () => {
    const setCookie = await dev.commitSession({ token: 'access-token-123' });
    const [name, value] = setCookie.split(';')[0].split('=');
    const tampered = `${name}=${value.slice(0, -2)}xx`;
    expect(
      (await dev.readSession(requestWith(tampered)))?.token ?? null
    ).toBeNull();
  });

  it('rejects a cookie signed with another secret', async () => {
    const other = createSessionHelpers({
      NODE_ENV: 'development',
      SESSION_SECRET: 'a-different-secret',
    });
    const setCookie = await other.commitSession({ token: 'access-token-123' });
    expect(
      (await dev.readSession(requestWith(setCookie)))?.token ?? null
    ).toBeNull();
  });

  it('reads nothing without a cookie', async () => {
    expect(
      (await dev.readSession(new Request('http://x/')))?.token ?? null
    ).toBeNull();
  });

  it('clears the cookie on destroy', async () => {
    const setCookie = await dev.commitSession({ token: 'access-token-123' });
    const cleared = await dev.destroy(requestWith(setCookie));
    expect(cleared).toMatch(/Expires=Thu, 01 Jan 1970/i);
  });

  it('refuses to issue sessions in production without SESSION_SECRET', async () => {
    // The boot-time warning is covered by its own test; keep this output clean.
    const quiet = vi.spyOn(console, 'error').mockImplementation(() => {});
    const prod = createSessionHelpers({ NODE_ENV: 'production' });
    quiet.mockRestore();
    await expect(prod.commitSession({ token: 't' })).rejects.toThrow(
      /SESSION_SECRET/
    );
    // …and never trusts a cookie signed with the public dev secret.
    const devCookie = await dev.commitSession({ token: 'access-token-123' });
    expect(
      (await prod.readSession(requestWith(devCookie)))?.token ?? null
    ).toBeNull();
  });

  it('warns loudly at startup when production has no SESSION_SECRET', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    createSessionHelpers({ NODE_ENV: 'production' });
    expect(spy).toHaveBeenCalledWith(expect.stringMatching(/SESSION_SECRET/));
    spy.mockClear();
    createSessionHelpers({ NODE_ENV: 'production', SESSION_SECRET: 'set' });
    createSessionHelpers({ NODE_ENV: 'development' });
    expect(spy).not.toHaveBeenCalled();
    spy.mockRestore();
  });

  it('stores the refresh token alongside the access token', async () => {
    const setCookie = await dev.commitSession({ token: 'acc', refresh: 'ref' });
    expect(setCookie).not.toContain('ref');
    expect(await dev.readSession(requestWith(setCookie))).toEqual({
      token: 'acc',
      refresh: 'ref',
    });
  });
});
