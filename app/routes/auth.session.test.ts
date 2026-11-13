// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { action } from './auth.session';

const request = (method: string, headers: Record<string, string>) =>
  new Request('http://app.example/auth/session', {
    method,
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      ...headers,
    },
    body: 'redirectTo=/app',
  });

const run = (request: Request) =>
  action({
    request,
    params: {},
    context: new RouterContextProvider(),
  } as never).catch((thrown: unknown) => thrown);

describe('/auth/session action', () => {
  it('rejects a cross-site sign-out', async () => {
    const res = (await run(
      request('DELETE', { Origin: 'https://evil.example' })
    )) as {
      init?: { status?: number };
    };
    expect(res.init?.status).toBe(403);
  });

  it('rejects requests the browser marks cross-site', async () => {
    const res = (await run(
      request('DELETE', { 'Sec-Fetch-Site': 'cross-site' })
    )) as {
      init?: { status?: number };
    };
    expect(res.init?.status).toBe(403);
  });

  it('never turns a client-supplied token into a session', async () => {
    const res = (await run(
      request('POST', { Origin: 'http://app.example' })
    )) as { init?: { status?: number } };
    expect(res.init?.status).toBe(405);
  });

  it('signs out: drops the cookie and redirects', async () => {
    const res = (await run(
      request('DELETE', { Origin: 'http://app.example' })
    )) as Response;
    expect(res.status).toBe(302);
    expect(res.headers.get('Location')).toBe('/app');
    expect(res.headers.get('Set-Cookie')).toMatch(/__leadline_session=;/);
  });
});
