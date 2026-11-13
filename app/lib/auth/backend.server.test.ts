// @vitest-environment node
import { describe, expect, it } from 'vitest';
import {
  backendUrl,
  callBackend,
  isExpired,
  normalizeBackendError,
  toAuthUser,
} from './backend.server';

const jwt = (payload: object) =>
  `h.${Buffer.from(JSON.stringify(payload)).toString('base64url')}.s`;

describe('backendUrl', () => {
  it('requires API_URL and drops a trailing slash', () => {
    expect(() => backendUrl({})).toThrow(/API_URL must be set/);
    expect(backendUrl({ API_URL: 'http://127.0.0.1:8000/api/v1/' })).toBe(
      'http://127.0.0.1:8000/api/v1'
    );
  });
});

describe('isExpired', () => {
  const now = Date.parse('2026-09-23T12:00:00Z');
  it('reads exp from the JWT payload with a 30s safety margin', () => {
    expect(isExpired(jwt({ exp: now / 1000 + 600 }), now)).toBe(false);
    expect(isExpired(jwt({ exp: now / 1000 + 10 }), now)).toBe(true);
    expect(isExpired(jwt({ exp: now / 1000 - 1 }), now)).toBe(true);
  });
  it('treats malformed tokens as expired', () => {
    expect(isExpired('not-a-jwt', now)).toBe(true);
    expect(isExpired(jwt({}), now)).toBe(true);
  });
});

describe('toAuthUser', () => {
  it('maps the session payload (flat names)', () => {
    expect(
      toAuthUser({
        id: '7',
        email: 'a@b.co',
        first_name: 'Amina',
        last_name: 'W',
      })
    ).toEqual({
      id: '7',
      email: 'a@b.co',
      name: 'Amina W',
      firstName: 'Amina',
      lastName: 'W',
    });
  });
  it('maps the profile payload (nested names + date joined)', () => {
    expect(
      toAuthUser({
        id: '7',
        email: 'a@b.co',
        date_joined: '2026-01-01T00:00:00Z',
        profile: { first_name: 'Amina', last_name: '' },
      })
    ).toEqual({
      id: '7',
      email: 'a@b.co',
      name: 'Amina',
      firstName: 'Amina',
      lastName: '',
      createdAt: '2026-01-01T00:00:00Z',
    });
  });
  it('falls back to the email when no name is set', () => {
    expect(toAuthUser({ id: '7', email: 'a@b.co' }).name).toBe('a@b.co');
  });
});

describe('normalizeBackendError', () => {
  it('keeps detail/code and extra context like email', () => {
    expect(
      normalizeBackendError(
        {
          detail: 'Please verify your email before logging in.',
          code: 'email_not_verified',
          email: 'a@b.co',
        },
        'x'
      )
    ).toEqual({
      detail: 'Please verify your email before logging in.',
      code: 'email_not_verified',
      email: 'a@b.co',
    });
  });

  it('turns DRF field errors into fields + a readable detail', () => {
    expect(
      normalizeBackendError(
        {
          email: ['This email is already registered.'],
          password: ['Too short.', 'Too common.'],
        },
        'x'
      )
    ).toEqual({
      detail: 'This email is already registered.',
      fields: {
        email: 'This email is already registered.',
        password: 'Too short.',
      },
    });
  });

  it('uses the fallback for empty or odd bodies', () => {
    expect(normalizeBackendError(null, 'Something went wrong')).toEqual({
      detail: 'Something went wrong',
    });
  });
});

describe('callBackend', () => {
  it('sends JSON with the bearer token and returns status + body', async () => {
    let seen: Request | undefined;
    const fetchImpl = (async (url: string, init?: RequestInit) => {
      seen = new Request(url, init);
      return Response.json({ ok: true }, { status: 201 });
    }) as typeof fetch;
    const res = await callBackend('http://api', '/auth/login/', {
      body: { email: 'a@b.co' },
      access: 'tok',
      fetchImpl,
    });
    expect(res).toEqual({ status: 201, data: { ok: true } });
    expect(seen?.url).toBe('http://api/auth/login/');
    expect(seen?.headers.get('Authorization')).toBe('Bearer tok');
    expect(await seen?.json()).toEqual({ email: 'a@b.co' });
  });

  it('reports an unreachable backend as 503', async () => {
    const fetchImpl = (async () => {
      throw new TypeError('fetch failed');
    }) as typeof fetch;
    const res = await callBackend('http://api', '/auth/login/', { fetchImpl });
    expect(res.status).toBe(503);
  });
});
