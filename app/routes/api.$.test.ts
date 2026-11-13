// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { action, loader } from './api.$';
import { backendSessionContext } from '~/lib/auth/middleware.server';

let seen: {
  url: string;
  method: string;
  auth: string | null;
  body?: string;
  contentType?: string | null;
  raw?: BodyInit | null;
}[];
let reply: () => Response | Promise<Response>;

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test/api/v1/');
  seen = [];
  reply = () => Response.json({ ok: true });
  vi.stubGlobal('fetch', async (url: string, init: RequestInit = {}) => {
    seen.push({
      url,
      method: init.method ?? 'GET',
      auth: new Headers(init.headers).get('Authorization'),
      body: typeof init.body === 'string' ? init.body : undefined,
      contentType: new Headers(init.headers).get('Content-Type'),
      raw: init.body,
    });
    return reply();
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function call(
  path: string,
  {
    method = 'GET',
    body,
    headers = {},
    session = { token: 'ACCESS', refresh: 'R' },
  }: {
    method?: string;
    body?: string;
    headers?: Record<string, string>;
    session?: { token: string; refresh?: string } | null;
  } = {}
) {
  const context = new RouterContextProvider();
  context.set(backendSessionContext, session);
  const url = new URL(`http://app.test/api/${path}`);
  const request = new Request(url, {
    method,
    body,
    headers: body
      ? { 'Content-Type': 'application/json', ...headers }
      : headers,
  });
  const splat = decodeURIComponent(url.pathname.slice('/api/'.length));
  const args = { request, context, params: { '*': splat } } as never;
  return method === 'GET' ? loader(args) : action(args);
}

describe('/api/* backend proxy', () => {
  it('forwards to the backend as the signed-in user, with Django’s trailing slash and the query', async () => {
    const res = await call('orgs/42/agents?status=active&sort=name');
    expect(res.status).toBe(200);
    expect(await res.json()).toEqual({ ok: true });
    expect(seen).toEqual([
      {
        url: 'http://api.test/api/v1/orgs/42/agents/?status=active&sort=name',
        method: 'GET',
        auth: 'Bearer ACCESS',
        body: undefined,
        contentType: null,
        raw: undefined,
      },
    ]);
  });

  it('forwards JSON bodies on writes', async () => {
    await call('orgs', { method: 'POST', body: '{"name":"Kijani"}' });
    expect(seen[0]).toMatchObject({
      url: 'http://api.test/api/v1/orgs/',
      method: 'POST',
      body: '{"name":"Kijani"}',
    });
  });

  it('calls public endpoints without a token when signed out', async () => {
    await call('invites/abc', { session: null });
    expect(seen[0].auth).toBeNull();
  });

  it('passes the backend status and body through, but never its cookies', async () => {
    reply = () =>
      Response.json(
        { detail: 'Not a member' },
        { status: 403, headers: { 'Set-Cookie': 'csrftoken=x' } }
      );
    const res = await call('orgs/9');
    expect(res.status).toBe(403);
    expect(await res.json()).toEqual({ detail: 'Not a member' });
    expect(res.headers.get('Set-Cookie')).toBeNull();
  });

  it('never passes non-JSON bodies through (Django debug pages)', async () => {
    reply = () =>
      new Response('<html>URLconf …</html>', {
        status: 404,
        statusText: 'Not Found',
        headers: { 'Content-Type': 'text/html' },
      });
    const res = await call('orgs');
    expect(res.status).toBe(404);
    expect(await res.json()).toEqual({ detail: 'Not Found' });
  });

  it('keeps 204 responses empty', async () => {
    reply = () => new Response(null, { status: 204 });
    const res = await call('orgs/9', { method: 'DELETE' });
    expect(res.status).toBe(204);
    expect(await res.text()).toBe('');
  });

  it('forwards body-less deletes and posts (browsers send no Content-Length)', async () => {
    reply = () => new Response(null, { status: 204 });
    const res = await call('organizations/9/documents/3', { method: 'DELETE' });
    expect(res.status).toBe(204);
    expect(seen[0]).toMatchObject({ method: 'DELETE', raw: undefined });
    expect(seen[0].contentType).toBeNull();
    reply = () => Response.json({ status: 'generating' }, { status: 202 });
    const posted = await call('organizations/9/dossier/regenerate', {
      method: 'POST',
    });
    expect(posted.status).toBe(202);
  });

  it('never proxies auth — those responses carry tokens', async () => {
    expect(
      (await call('auth/login', { method: 'POST', body: '{}' })).status
    ).toBe(404);
    expect((await call('auth/refresh-token')).status).toBe(404);
    expect(seen).toEqual([]);
  });

  it('refuses paths that climb out of the API', async () => {
    for (const path of [
      'orgs/../../admin',
      'orgs/%2e%2e/admin',
      '..',
      'orgs//x',
    ]) {
      const splat = path;
      const context = new RouterContextProvider();
      context.set(backendSessionContext, null);
      const res = await loader({
        request: new Request('http://app.test/api/x'),
        context,
        params: { '*': decodeURIComponent(splat) },
      } as never);
      expect(res.status).toBe(404);
    }
    expect(seen).toEqual([]);
  });

  it('refuses cross-site requests and non-JSON writes (CSRF)', async () => {
    expect(
      (await call('orgs', { headers: { 'Sec-Fetch-Site': 'cross-site' } }))
        .status
    ).toBe(403);
    const context = new RouterContextProvider();
    const form = await action({
      request: new Request('http://app.test/api/orgs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: 'name=x',
      }),
      context,
      params: { '*': 'orgs' },
    } as never);
    expect(form.status).toBe(415);
    expect(seen).toEqual([]);
  });

  it('answers 503 when the backend is unreachable', async () => {
    reply = () => {
      throw new TypeError('fetch failed');
    };
    const res = await call('orgs');
    expect(res.status).toBe(503);
    expect(await res.json()).toHaveProperty('detail');
  });

  it('forwards document uploads only with the app header (forms can’t set it)', async () => {
    const form = new FormData();
    form.append('title', 'Profile');
    form.append('file', new Blob([new Uint8Array([1, 2, 3])]), 'p.pdf');
    const make = (headers: Record<string, string>) => {
      const request = new Request(
        'http://app.test/api/organizations/o1/documents',
        {
          method: 'POST',
          body: form,
          headers,
        }
      );
      const context = new RouterContextProvider();
      context.set(backendSessionContext, { token: 'ACCESS' });
      return action({
        request,
        context,
        params: { '*': 'organizations/o1/documents' },
      } as never);
    };

    expect((await make({})).status).toBe(415);
    expect(seen).toEqual([]);

    const res = await make({ 'X-Requested-With': 'leadline' });
    expect(res.status).toBe(200);
    expect(seen[0].url).toBe(
      'http://api.test/api/v1/organizations/o1/documents/'
    );
    expect(seen[0].contentType).toMatch(/^multipart\/form-data; boundary=/);
    expect((seen[0].raw as ArrayBuffer).byteLength).toBeGreaterThan(3);
  });

  it('passes document downloads through as files', async () => {
    reply = () =>
      new Response(new Uint8Array([9, 8, 7]), {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="p.pdf"',
          'Set-Cookie': 'x=y',
        },
      });
    const res = await call('organizations/o1/documents/d1/download');
    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('application/pdf');
    expect(res.headers.get('Content-Disposition')).toBe(
      'attachment; filename="p.pdf"'
    );
    expect(res.headers.get('Set-Cookie')).toBeNull();
    // Served from our origin: never let the browser sniff it into HTML.
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(new Uint8Array(await res.arrayBuffer())).toEqual(
      new Uint8Array([9, 8, 7])
    );
  });
  it('gives file transfers time; JSON calls stay short', async () => {
    const spy = vi.spyOn(AbortSignal, 'timeout');
    await call('organizations/o1');
    expect(spy).toHaveBeenLastCalledWith(15_000);
    reply = () =>
      new Response(new Uint8Array([1]), {
        headers: { 'Content-Type': 'application/pdf' },
      });
    await call('organizations/o1/documents/d1/download');
    expect(spy.mock.lastCall?.[0]).toBeGreaterThanOrEqual(300_000);
    spy.mockRestore();
  });
});
