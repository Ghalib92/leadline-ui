import { useQuery } from '@tanstack/react-query';
import { useRouteLoaderData } from 'react-router';
import { authKeys } from '~/features/auth/query-keys';
import type { AuthUser } from '~/lib/schema';

import type { SessionState } from './context';

export interface AuthView {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

const signedOut: SessionState = { user: null, isAuthenticated: false };

/** What the session query holds. */
export type SessionData = SessionState;

async function fetchSession(): Promise<SessionData> {
  // Our server reads the httpOnly cookie (refreshing it if needed).
  const res = await fetch('/api/auth/me', { credentials: 'same-origin' });
  if (!res.ok) throw new Error('Could not load the session');
  return (await res.json()) as SessionData;
}

/**
 * The single source of truth for *rendering* auth state.
 *
 * The root loader (server middleware read the httpOnly session cookie) decides
 * the first render, so SSR and the client agree. After that the session is a
 * React Query query (`authKeys.session()`), seeded from the loader: invalidate
 * it — `useRefreshSession()` — to reload the user after anything that changes
 * them.
 */
export function useAuth(): AuthView {
  const data = useRouteLoaderData('root') as
    | { auth?: SessionState }
    | undefined;
  const auth = data?.auth ?? signedOut;

  const { data: session } = useQuery({
    queryKey: authKeys.session(),
    queryFn: fetchSession,
    // Only a signed-in session is ever cached, so a stale "signed out" entry
    // can't outlive a sign-in (and sign-out clears the whole cache).
    enabled: auth.isAuthenticated,
    initialData:
      auth.isAuthenticated && auth.user
        ? { user: auth.user, isAuthenticated: true }
        : undefined,
    staleTime: 5 * 60 * 1000,
    retry: false,
  });

  return {
    isAuthenticated: auth.isAuthenticated && (session?.isAuthenticated ?? true),
    user: session?.user ?? auth.user ?? null,
  };
}
