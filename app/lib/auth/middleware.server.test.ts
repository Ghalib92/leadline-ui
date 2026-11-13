// @vitest-environment node
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import {
  _resetRefreshCache,
  requireSession,
  resolveBackendSession,
  sessionMiddleware,
} from './middleware.server';
import { sessionContext, type SessionState } from './context';

const next = async () => new Response(null);

async function run(
  middleware: typeof sessionMiddleware,
  request: Request,
  context = new RouterContextProvider()
) {
  await middleware(
    { request, context, params: {}, unstable_pattern: '' } as never,
    next
  );
  return context;
}

const signedOut: SessionState = { user: null, isAuthenticated: false };

describe('sessionMiddleware', () => {
  it('is signed out without a cookie', async () => {
    vi.stubEnv('API_URL', 'http://api.test/api/v1');
    const context = await run(sessionMiddleware, new Request('http://x/'));
    expect(context.get(sessionContext)).toEqual(signedOut);
    vi.unstubAllEnvs();
  });

  it('refuses to run without API_URL', async () => {
    vi.stubEnv('API_URL', '');
    await expect(
      run(sessionMiddleware, new Request('http://x/'))
    ).rejects.toThrow(/API_URL/);
    vi.unstubAllEnvs();
  });
});

describe('requireSession', () => {
  it('redirects signed-out requests to login with the return path', async () => {
    const context = new RouterContextProvider();
    context.set(sessionContext, signedOut);
    const thrown = await run(
      requireSession,
      new Request('http://x/o/kijani?tab=1'),
      context
    ).catch((error: unknown) => error);

    expect(thrown).toBeInstanceOf(Response);
    expect((thrown as Response).headers.get('Location')).toBe(
      '/auth/login?redirectTo=%2Fo%2Fkijani%3Ftab%3D1'
    );
  });

  it('lets signed-in requests through (backend mode has no client token)', async () => {
    const context = new RouterContextProvider();
    context.set(sessionContext, {
      user: { id: '1', email: 'a@b.co', name: 'A' },
      isAuthenticated: true,
    });
    await expect(
      run(requireSession, new Request('http://x/app'), context)
    ).resolves.toBe(context);
  });
});

// ---- Backend mode ----------------------------------------------------------

const now = Date.parse('2026-09-23T12:00:00Z');
const jwt = (expInSec: number, tag = 'a') =>
  `h.${Buffer.from(JSON.stringify({ exp: now / 1000 + expInSec, tag })).toString('base64url')}.s`;
const profile = {
  id: 7,
  email: 'amina@kijanihealth.org',
  date_joined: '2026-01-01T00:00:00Z',
  profile: { first_name: 'Amina', last_name: 'Wanjiru' },
};

type Handler = (
  path: string,
  init: RequestInit
) => Response | Promise<Response>;
function fakeBackend(handler: Handler) {
  const calls: string[] = [];
  const fetchImpl = (async (url: string, init: RequestInit = {}) => {
    const path = new URL(url).pathname.replace('/api/v1', '');
    calls.push(path);
    return handler(path, init);
  }) as typeof fetch;
  return { calls, fetchImpl };
}

const opts = (fetchImpl: typeof fetch) => ({
  base: 'http://api/api/v1',
  fetchImpl,
  now,
});

beforeEach(() => _resetRefreshCache());

describe('resolveBackendSession', () => {
  it('loads the profile for a valid access token and keeps tokens off the client', async () => {
    const { calls, fetchImpl } = fakeBackend(() => Response.json(profile));
    const result = await resolveBackendSession(
      { token: jwt(600), refresh: 'r1' },
      opts(fetchImpl)
    );
    expect(calls).toEqual(['/auth/profile/']);
    expect(result).toEqual({
      state: {
        user: {
          id: '7',
          email: 'amina@kijanihealth.org',
          name: 'Amina Wanjiru',
          firstName: 'Amina',
          lastName: 'Wanjiru',
          createdAt: '2026-01-01T00:00:00Z',
        },
        isAuthenticated: true,
      },
      clear: false,
    });
  });

  it('refreshes an expired access token server-side and stores the rotated pair', async () => {
    const fresh = jwt(900, 'b');
    const { calls, fetchImpl } = fakeBackend((path) =>
      path === '/auth/refresh-token/'
        ? Response.json({ access: fresh, refresh: 'r2' })
        : Response.json(profile)
    );
    const result = await resolveBackendSession(
      { token: jwt(-5), refresh: 'r1' },
      opts(fetchImpl)
    );
    expect(calls).toEqual(['/auth/refresh-token/', '/auth/profile/']);
    expect(result.commit).toEqual({ token: fresh, refresh: 'r2' });
    expect(result.state.isAuthenticated).toBe(true);
  });

  it('signs out and clears the cookie when the refresh token is rejected', async () => {
    const { fetchImpl } = fakeBackend(() =>
      Response.json({ detail: 'Token is blacklisted' }, { status: 401 })
    );
    const result = await resolveBackendSession(
      { token: jwt(-5), refresh: 'r1' },
      opts(fetchImpl)
    );
    expect(result).toEqual({
      state: {
        user: null,
        isAuthenticated: false,
      },
      clear: true,
    });
  });

  it('retries once via refresh when the profile call says 401', async () => {
    let profileCalls = 0;
    const { calls, fetchImpl } = fakeBackend((path) => {
      if (path === '/auth/refresh-token/') {
        return Response.json({ access: jwt(900, 'c'), refresh: 'r2' });
      }
      profileCalls += 1;
      return profileCalls === 1
        ? Response.json({ detail: 'expired' }, { status: 401 })
        : Response.json(profile);
    });
    const result = await resolveBackendSession(
      { token: jwt(600), refresh: 'r1' },
      opts(fetchImpl)
    );
    expect(calls).toEqual([
      '/auth/profile/',
      '/auth/refresh-token/',
      '/auth/profile/',
    ]);
    expect(result.state.user?.email).toBe('amina@kijanihealth.org');
    expect(result.commit?.refresh).toBe('r2');
  });

  it('keeps the session (without a profile) when the backend is unreachable', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const result = await resolveBackendSession(
      { token: jwt(600), refresh: 'r1' },
      opts(fetchImpl)
    );
    expect(result).toEqual({
      state: {
        user: null,
        isAuthenticated: true,
      },
      clear: false,
    });
  });

  it('shares one refresh between concurrent requests (rotation would reject the second)', async () => {
    const { calls, fetchImpl } = fakeBackend(async (path) => {
      if (path === '/auth/refresh-token/') {
        await new Promise((r) => setTimeout(r, 10));
        return Response.json({ access: jwt(900, 'd'), refresh: 'r2' });
      }
      return Response.json(profile);
    });
    const stored = { token: jwt(-5), refresh: 'r1' };
    const [a, b] = await Promise.all([
      resolveBackendSession(stored, opts(fetchImpl)),
      resolveBackendSession(stored, opts(fetchImpl)),
    ]);
    expect(calls.filter((c) => c === '/auth/refresh-token/')).toHaveLength(1);
    expect(a.commit).toEqual(b.commit);
  });

  it('is signed out with no stored session', async () => {
    const { fetchImpl, calls } = fakeBackend(() => Response.json(profile));
    const result = await resolveBackendSession(null, opts(fetchImpl));
    expect(calls).toEqual([]);
    expect(result.state.isAuthenticated).toBe(false);
  });
});
