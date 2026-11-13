import { createContext } from 'react-router';
import type { AuthUser } from '~/lib/schema';

/**
 * The signed-in user, resolved server-side. Tokens stay in the httpOnly cookie
 * (`lib/auth/session.server.ts`) — the client never sees one.
 */
export interface SessionState {
  user: AuthUser | null;
  isAuthenticated: boolean;
}

/** Filled by `sessionMiddleware` on every server request. */
export const sessionContext = createContext<SessionState>({
  user: null,
  isAuthenticated: false,
});
