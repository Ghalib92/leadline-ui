// @vitest-environment node
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { RouterContextProvider } from 'react-router';
import { action } from './api.auth.$action';
import { backendSessionContext } from '~/lib/auth/middleware.server';
import { sessionCookie } from '~/lib/auth/session.server';

const backendUser = {
  id: 7,
  email: 'amina@kijanihealth.org',
  first_name: 'Amina',
  last_name: 'Wanjiru',
};

let calls: { path: string; body: unknown; auth: string | null }[] = [];
let reply: (path: string) => Response;

beforeEach(() => {
  vi.stubEnv('API_URL', 'http://api.test/api/v1/');
  calls = [];
  vi.stubGlobal('fetch', async (url: string, init: RequestInit) => {
    const path = new URL(url).pathname.replace('/api/v1', '');
    const headers = new Headers(init.headers);
    calls.push({
      path,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      auth: headers.get('Authorization'),
    });
    return reply(path);
  });
});
afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
});

function run(
  name: string,
  body: unknown,
  {
    headers = {},
    session = null,
  }: {
    headers?: Record<string, string>;
    session?: { token: string; refresh?: string } | null;
  } = {}
) {
  const context = new RouterContextProvider();
  context.set(backendSessionContext, session);
  const request = new Request(`http://app.test/api/auth/${name}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: JSON.stringify(body),
  });
  return action({ request, params: { action: name }, context } as never).then(
    async (res: Response) => ({
      res,
      data: (await res.json()) as Record<string, unknown>,
    })
  );
}

const status = (r: { res: Response }) => r.res.status;
const cookie = (r: { res: Response }) => r.res.headers.get('Set-Cookie');

describe('/api/auth/:action', () => {
  it('refuses cross-site requests', async () => {
    reply = () => Response.json({});
    const res = await run(
      'login',
      {},
      { headers: { Origin: 'https://evil.test' } }
    );
    expect(status(res)).toBe(403);
    expect(calls).toEqual([]);
  });

  it('refuses non-JSON bodies (a plain HTML form cannot send JSON)', async () => {
    const context = new RouterContextProvider();
    const request = new Request('http://app.test/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: 'email=a@b.co',
    });
    const res = await action({
      request,
      params: { action: 'login' },
      context,
    } as never);
    expect(res.status).toBe(415);
  });

  it('signs in: tokens go into the cookie, only the user comes back', async () => {
    reply = () =>
      Response.json({ access: 'A1', refresh: 'R1', user: backendUser });
    const res = await run('login', {
      email: 'amina@kijanihealth.org',
      password: 'password123',
    });
    expect(calls[0]).toMatchObject({
      path: '/auth/login/',
      body: { email: 'amina@kijanihealth.org', password: 'password123' },
    });
    expect(res.data).toEqual({
      user: {
        id: '7',
        email: 'amina@kijanihealth.org',
        name: 'Amina Wanjiru',
        firstName: 'Amina',
        lastName: 'Wanjiru',
      },
    });
    expect(JSON.stringify(res.data)).not.toMatch(/A1|R1/);

    const setCookie = cookie(res);
    expect(setCookie).toMatch(/HttpOnly/i);
    const stored = await sessionCookie.readSession(
      new Request('http://app.test', {
        headers: { Cookie: setCookie!.split(';')[0] },
      })
    );
    expect(stored).toEqual({ token: 'A1', refresh: 'R1' });
  });

  it('passes the unverified-email answer through so the UI can ask for the code', async () => {
    reply = () =>
      Response.json(
        {
          detail: 'Please verify your email before logging in.',
          code: 'email_not_verified',
          email: 'amina@kijanihealth.org',
        },
        { status: 403 }
      );
    const res = await run('login', {
      email: 'amina@kijanihealth.org',
      password: 'password123',
    });
    expect(status(res)).toBe(403);
    expect(res.data).toMatchObject({
      code: 'email_not_verified',
      email: 'amina@kijanihealth.org',
    });
    expect(cookie(res)).toBeNull();
  });

  it('validates input before calling the backend', async () => {
    const res = await run('login', { email: 'nope', password: 'x' });
    expect(status(res)).toBe(400);
    expect(res.data.fields).toHaveProperty('email');
    expect(calls).toEqual([]);
  });

  it('registers with the name split for the backend profile', async () => {
    reply = () =>
      Response.json(
        {
          detail: 'Account created.',
          email: 'amina@kijanihealth.org',
          requires_verification: true,
        },
        { status: 201 }
      );
    const res = await run('register', {
      firstName: 'Amina',
      lastName: 'Njeri Wanjiru',
      email: 'amina@kijanihealth.org',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(calls[0].body).toEqual({
      email: 'amina@kijanihealth.org',
      password: 'password123',
      profile: { first_name: 'Amina', last_name: 'Njeri Wanjiru' },
    });
    expect(res.data).toMatchObject({ email: 'amina@kijanihealth.org' });
    expect(cookie(res)).toBeNull();
  });

  it('maps backend field names onto the form fields', async () => {
    reply = () =>
      Response.json(
        { new_password: ['This password is too common.'] },
        { status: 400 }
      );
    const res = await run('reset-password', {
      email: 'amina@kijanihealth.org',
      code: '123456',
      password: 'password123',
      confirmPassword: 'password123',
    });
    expect(calls[0].body).toEqual({
      email: 'amina@kijanihealth.org',
      otp_code: '123456',
      new_password: 'password123',
    });
    expect(res.data).toEqual({
      detail: 'This password is too common.',
      fields: { password: 'This password is too common.' },
    });
  });

  it('verifies the email code and signs in', async () => {
    reply = () =>
      Response.json({
        detail: 'ok',
        access: 'A2',
        refresh: 'R2',
        user: backendUser,
      });
    const res = await run('verify-email', {
      email: 'amina@kijanihealth.org',
      code: '654321',
    });
    expect(calls[0].body).toEqual({
      email: 'amina@kijanihealth.org',
      otp_code: '654321',
    });
    expect(cookie(res)).toMatch(/__leadline_session=/);
  });

  it('needs a session to change the password, and rotates it after', async () => {
    expect(
      status(
        await run('change-password', {
          current: 'a',
          next: 'password456',
          confirm: 'password456',
        })
      )
    ).toBe(401);

    reply = () =>
      Response.json({
        detail: 'ok',
        access: 'A3',
        refresh: 'R3',
        user: backendUser,
      });
    const res = await run(
      'change-password',
      { current: 'password123', next: 'password456', confirm: 'password456' },
      { session: { token: 'A1', refresh: 'R1' } }
    );
    expect(calls[0]).toMatchObject({
      path: '/auth/change-password/',
      auth: 'Bearer A1',
      body: {
        old_password: 'password123',
        new_password: 'password456',
        confirm_password: 'password456',
      },
    });
    expect(cookie(res)).toMatch(/__leadline_session=/);
  });

  it('updates the profile name as the signed-in user', async () => {
    reply = () =>
      Response.json({
        detail: 'ok',
        data: {
          ...backendUser,
          profile: { first_name: 'Amina', last_name: 'W.' },
        },
      });
    const res = await run(
      'profile',
      { firstName: 'Amina', lastName: 'W.' },
      { session: { token: 'A1', refresh: 'R1' } }
    );
    expect(calls[0].body).toEqual({
      profile: { first_name: 'Amina', last_name: 'W.' },
    });
    expect(res.data).toMatchObject({ user: { name: 'Amina W.' } });
  });

  it('shows profile name errors under the right field', async () => {
    reply = () =>
      Response.json(
        {
          profile: {
            first_name: ['Ensure this field has no more than 100 characters.'],
          },
        },
        { status: 400 }
      );
    const res = await run(
      'profile',
      { firstName: 'Amina', lastName: '' },
      { session: { token: 'A1', refresh: 'R1' } }
    );
    expect(res.data.fields).toEqual({
      firstName: 'Ensure this field has no more than 100 characters.',
    });
  });

  it('changes email as the user, then ends the session so the new address gets verified', async () => {
    reply = () =>
      Response.json({
        detail: 'Email changed.',
        email: 'new@kijani.org',
        requires_verification: true,
      });
    const res = await run(
      'change-email',
      { newEmail: 'new@kijani.org', password: 'password123' },
      { session: { token: 'A1', refresh: 'R1' } }
    );
    expect(calls[0]).toMatchObject({
      path: '/auth/change-email/',
      auth: 'Bearer A1',
      body: { new_email: 'new@kijani.org', password: 'password123' },
    });
    expect(res.data).toEqual({
      email: 'new@kijani.org',
      detail: 'Email changed.',
    });
    expect(cookie(res)).toMatch(/__leadline_session=;/);
  });

  it('maps change-email field errors', async () => {
    reply = () =>
      Response.json({ password: ['Password is incorrect.'] }, { status: 400 });
    const res = await run(
      'change-email',
      { newEmail: 'new@kijani.org', password: 'x' },
      { session: { token: 'A1', refresh: 'R1' } }
    );
    expect(status(res)).toBe(400);
    expect(res.data.fields).toEqual({ password: 'Password is incorrect.' });
  });

  it('is not found for unknown actions', async () => {
    expect(status(await run('delete-everything', {}))).toBe(404);
  });
});

describe('GET /api/auth/me', () => {
  it('returns the session user without tokens', async () => {
    const { loader } = await import('./api.auth.$action');
    const { sessionContext } = await import('~/lib/auth/context');
    const context = new RouterContextProvider();
    context.set(sessionContext, {
      user: { id: '7', email: 'a@b.co', name: 'A' },
      isAuthenticated: true,
    });
    const res = loader({ params: { action: 'me' }, context } as never);
    expect(await res.json()).toEqual({
      user: { id: '7', email: 'a@b.co', name: 'A' },
      isAuthenticated: true,
    });
    const other = loader({ params: { action: 'login' }, context } as never);
    expect(other.status).toBe(404);
  });
});
