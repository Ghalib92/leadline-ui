import { createCookieSessionStorage } from 'react-router';

/**
 * The session lives in a signed, httpOnly cookie that holds only the backend's
 * JWTs — no profile data, and page JavaScript can't read or rewrite it.
 * Middleware reads it on the server (`lib/auth/middleware.server.ts`); the
 * browser reaches the API only through our `/api/*` proxy, so no token ever
 * leaves the server.
 */
const COOKIE_NAME = '__leadline_session';
const MAX_AGE = 60 * 60 * 24 * 7; // 7 days
// Dev-only fallback so a fresh clone runs. Never accepted in production.
const DEV_SECRET = 'leadline-dev-only-secret-change-me';

interface SessionData {
  /** The JWT access token. */
  token: string;
  /** The rotating JWT refresh token. */
  refresh?: string;
}

export interface StoredSession {
  token: string;
  refresh?: string;
}

type Env = Record<string, string | undefined>;

export function createSessionHelpers(env: Env = process.env) {
  const isProd = env.NODE_ENV === 'production';
  const secret = env.SESSION_SECRET || (isProd ? null : DEV_SECRET);
  if (!secret) {
    // Surface it at boot, not at the first login. Not a throw: the production
    // build prerenders static files without runtime secrets.
    console.error(
      '[auth] SESSION_SECRET is not set. Sign-in is disabled until it is configured.'
    );
  }

  const storage = createCookieSessionStorage<SessionData>({
    cookie: {
      name: COOKIE_NAME,
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
      secure: isProd,
      maxAge: MAX_AGE,
      // Without a real secret in production, sign with a random throwaway key:
      // nothing can be issued (commit throws below) and nothing is trusted.
      secrets: [secret ?? crypto.randomUUID()],
    },
  });

  async function readSession(request: Request): Promise<StoredSession | null> {
    const session = await storage.getSession(request.headers.get('Cookie'));
    const token = session.get('token');
    if (typeof token !== 'string' || !token) return null;
    const refresh = session.get('refresh');
    return typeof refresh === 'string' && refresh
      ? { token, refresh }
      : { token };
  }

  /** Returns the `Set-Cookie` header value for a new session. */
  async function commitSession(data: StoredSession): Promise<string> {
    if (!secret) {
      throw new Error('SESSION_SECRET must be set in production.');
    }
    const session = await storage.getSession();
    session.set('token', data.token);
    if (data.refresh) session.set('refresh', data.refresh);
    return storage.commitSession(session);
  }

  return {
    readSession,
    commitSession,

    /** Returns the `Set-Cookie` header value that clears the session. */
    async destroy(request: Request): Promise<string> {
      const session = await storage.getSession(request.headers.get('Cookie'));
      return storage.destroySession(session);
    },
  };
}

export const sessionCookie = createSessionHelpers();
