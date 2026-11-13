import { createContext, redirect, type MiddlewareFunction } from 'react-router';
import { sessionContext, type SessionState } from './context';
import { sessionCookie, type StoredSession } from './session.server';
import {
  backendUrl,
  callBackend,
  isExpired,
  toAuthUser,
  type BackendUser,
} from './backend.server';

interface ResolveOptions {
  base: string;
  fetchImpl?: typeof fetch;
  now?: number;
}

interface Resolved {
  state: SessionState;
  /** Rotated tokens to write back to the cookie. */
  commit?: StoredSession;
  /** The session is dead: drop the cookie. */
  clear: boolean;
}

const signedOut: SessionState = { user: null, isAuthenticated: false };

/**
 * Refresh tokens rotate (the old one is blacklisted), so two requests racing
 * with the same cookie must share one refresh — the second would be rejected
 * and sign the user out. Results are kept briefly for requests that arrive
 * just after.
 * ponytail: per-process map; needs a shared store if the app runs on several instances.
 */
const refreshes = new Map<
  string,
  Promise<StoredSession | 'rejected' | 'unavailable'>
>();
const REFRESH_REUSE_MS = 15_000;

export function _resetRefreshCache() {
  refreshes.clear();
}

function refresh(base: string, token: string, fetchImpl?: typeof fetch) {
  let pending = refreshes.get(token);
  if (!pending) {
    pending = callBackend(base, '/auth/refresh-token/', {
      body: { refresh: token },
      fetchImpl,
    }).then(({ status, data }) => {
      const body = data as { access?: string; refresh?: string } | null;
      if (status === 200 && body?.access) {
        return { token: body.access, refresh: body.refresh ?? token };
      }
      return status >= 500 ? 'unavailable' : 'rejected';
    });
    refreshes.set(token, pending);
    setTimeout(() => refreshes.delete(token), REFRESH_REUSE_MS).unref?.();
  }
  return pending;
}

/**
 * Keep the access token fresh (refreshing server-side when it
 * has expired or the API rejects it) and load the profile, so SSR renders the
 * signed-in user without the browser ever holding a token.
 */
export async function resolveBackendSession(
  stored: StoredSession | null,
  { base, fetchImpl, now = Date.now() }: ResolveOptions
): Promise<Resolved> {
  if (!stored) return { state: signedOut, clear: false };

  let session = stored;
  let commit: StoredSession | undefined;

  const rotate = async (): Promise<Resolved | null> => {
    if (!session.refresh) return { state: signedOut, clear: true };
    const result = await refresh(base, session.refresh, fetchImpl);
    if (result === 'rejected') return { state: signedOut, clear: true };
    if (result === 'unavailable') {
      return { state: { ...signedOut, isAuthenticated: true }, clear: false };
    }
    session = commit = result;
    return null;
  };

  if (isExpired(session.token, now)) {
    const failed = await rotate();
    if (failed) return failed;
  }

  const load = () =>
    callBackend(base, '/auth/profile/', {
      method: 'GET',
      access: session.token,
      fetchImpl,
      timeoutMs: 3000,
    });

  let profile = await load();
  if (profile.status === 401 && !commit) {
    const failed = await rotate();
    if (failed) return failed;
    profile = await load();
  }
  if (profile.status === 401) return { state: signedOut, clear: true };

  const user =
    profile.status === 200 ? toAuthUser(profile.data as BackendUser) : null;
  return {
    state: { user, isAuthenticated: true },
    ...(commit ? { commit } : {}),
    clear: false,
  };
}

/**
 * Server-only: the current (possibly just refreshed) tokens, for
 * actions that call the auth API as the user. Never returned from a loader.
 */
export const backendSessionContext = createContext<StoredSession | null>(null);

/** Root middleware: read the session cookie into router context. */
export const sessionMiddleware: MiddlewareFunction<Response> = async (
  { request, context },
  next
) => {
  const base = backendUrl();
  const stored = await sessionCookie.readSession(request);
  const { state, commit, clear } = await resolveBackendSession(stored, {
    base,
  });
  context.set(sessionContext, state);
  context.set(
    backendSessionContext,
    state.isAuthenticated ? (commit ?? stored) : null
  );

  const response = await next();
  // A route may have set its own session cookie (login, logout) — it wins.
  if (response.headers.has('Set-Cookie')) return response;
  if (commit) {
    response.headers.append(
      'Set-Cookie',
      await sessionCookie.commitSession(commit)
    );
  } else if (clear) {
    response.headers.append('Set-Cookie', await sessionCookie.destroy(request));
  }
  return response;
};

/** Route middleware: signed-out requests go to login and come back after. */
export const requireSession: MiddlewareFunction<Response> = ({
  request,
  context,
}) => {
  if (context.get(sessionContext).isAuthenticated) return;
  const url = new URL(request.url);
  throw redirect(
    `/auth/login?redirectTo=${encodeURIComponent(`${url.pathname}${url.search}`)}`
  );
};
