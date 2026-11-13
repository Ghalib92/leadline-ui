import { data, redirect } from 'react-router';
import type { Route } from './+types/auth.session';
import { sessionCookie } from '~/lib/auth/session.server';
import { safeRedirect } from '~/lib/auth/safe-redirect';
import { isCrossSite } from '~/lib/auth/same-site.server';
import { backendUrl, callBackend } from '~/lib/auth/backend.server';

/**
 * Resource route that ends the httpOnly session.
 *
 * DELETE { redirectTo? } → revoke the refresh token and drop the cookie.
 *
 * Sessions start in `routes/api.auth.$action.ts`, which keeps the tokens
 * server-side; a client-supplied token never becomes a session.
 */

/** Blacklist the refresh token. Best-effort — sign-out never fails. */
async function revokeBackendSession(request: Request) {
  const refresh = (await sessionCookie.readSession(request))?.refresh;
  if (refresh) {
    await callBackend(backendUrl(), '/auth/logout/', {
      body: { refresh },
      timeoutMs: 3000,
    });
  }
}

export async function action({ request }: Route.ActionArgs) {
  if (isCrossSite(request)) {
    throw data({ detail: 'Cross-site request refused' }, { status: 403 });
  }
  if (request.method !== 'DELETE') {
    throw data({ detail: 'Method not allowed' }, { status: 405 });
  }

  const form = await request.formData().catch(() => new FormData());
  const redirectTo = safeRedirect(String(form.get('redirectTo') ?? ''), '/');
  await revokeBackendSession(request);
  return redirect(redirectTo, {
    headers: { 'Set-Cookie': await sessionCookie.destroy(request) },
  });
}
