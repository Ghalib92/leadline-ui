import type { Route } from './+types/api.$';
import { backendUrl } from '~/lib/auth/backend.server';
import { backendSessionContext } from '~/lib/auth/middleware.server';
import { isCrossSite } from '~/lib/auth/same-site.server';

/**
 * Same-origin proxy to the Leadline backend: `/api/<path>` → `${API_URL}/<path>/`.
 *
 * The browser never holds a backend token, so it can't call the API itself.
 * This route adds the signed-in user's access token (kept fresh by
 * `sessionMiddleware`) and passes the answer back — status and JSON only, never
 * the backend's cookies. Which paths use it is decided in `lib/api/routing.ts`.
 *
 * Auth is not proxied: those responses carry tokens. It goes through
 * `routes/api.auth.$action.ts`, which keeps them in the cookie.
 */
const json = (body: unknown, status: number) => Response.json(body, { status });

/** Endpoints that answer with a file: documents, proposal DOCX, calendar .ics. */
const FILE_SUFFIXES = ['/download', '/export', '/calendar'];
const isFilePath = (path: string) =>
  FILE_SUFFIXES.some((suffix) => path.endsWith(suffix));

/** A safe relative API path, or `null`: no dot segments, no empty segments. */
function apiPath(splat: string | undefined): string | null {
  const segments = (splat ?? '').replace(/\/+$/, '').split('/');
  if (
    segments.length === 0 ||
    segments.some(
      (s) => s === '' || s === '.' || s === '..' || s.includes('\\')
    )
  ) {
    return null;
  }
  if (segments[0] === 'auth') return null;
  return segments.map(encodeURIComponent).join('/');
}

async function proxy({ request, params, context }: Route.LoaderArgs) {
  if (isCrossSite(request)) {
    return json({ detail: 'Cross-site request refused' }, 403);
  }

  const base = backendUrl();
  const path = apiPath(params['*']);
  if (!path) return json({ detail: 'Not found' }, 404);

  const contentType = request.headers.get('Content-Type') ?? '';
  // A plain HTML form can't send JSON cross-site without a CORS preflight.
  // File uploads are multipart — which a form *can* send — so they also need
  // a header only our own client sets.
  const multipart =
    contentType.startsWith('multipart/form-data') &&
    request.headers.get('X-Requested-With') === 'leadline';
  const canHaveBody = !['GET', 'HEAD'].includes(request.method);
  // Read the body up front: browsers send DELETE (and some POSTs) with no body
  // and no Content-Length, which is not a JSON body and must not be refused.
  const raw = canHaveBody && !multipart ? await request.text() : '';
  if (raw && !contentType.startsWith('application/json')) {
    return json({ detail: 'Expected JSON' }, 415);
  }
  const hasBody = multipart || raw.length > 0;

  const session = context.get(backendSessionContext);
  const { search } = new URL(request.url);

  let res: Response;
  try {
    res = await fetch(`${base}/${path}/${search}`, {
      method: request.method,
      headers: {
        Accept: 'application/json',
        ...(hasBody
          ? { 'Content-Type': multipart ? contentType : 'application/json' }
          : {}),
        ...(session ? { Authorization: `Bearer ${session.token}` } : {}),
      },
      // ponytail: uploads are buffered (≤ 25 MB backend limit); stream if that grows.
      body: !hasBody
        ? undefined
        : multipart
          ? await request.arrayBuffer()
          : raw,
      // File transfers get minutes; everything else fails fast.
      signal: AbortSignal.timeout(
        multipart || isFilePath(path) ? 300_000 : 15_000
      ),
    });
  } catch {
    return json(
      { detail: 'The server is unavailable. Try again shortly.' },
      503
    );
  }

  if (res.status === 204 || res.status === 304) {
    return new Response(null, { status: res.status });
  }
  // Downloads are files: pass the bytes and what names them, nothing else.
  if (res.ok && isFilePath(path)) {
    // Served from our origin: never let the browser sniff it into HTML.
    const headers = new Headers({ 'X-Content-Type-Options': 'nosniff' });
    for (const name of [
      'Content-Type',
      'Content-Disposition',
      'Content-Length',
    ]) {
      const value = res.headers.get(name);
      if (value) headers.set(name, value);
    }
    return new Response(res.body, { status: res.status, headers });
  }
  // JSON only: Django's HTML error pages (the debug 404 lists every backend
  // route) must not reach the browser.
  if (!res.headers.get('Content-Type')?.includes('application/json')) {
    await res.body?.cancel();
    return json(
      { detail: res.statusText || 'Unexpected response' },
      res.status
    );
  }
  return new Response(res.body, {
    status: res.status,
    headers: { 'Content-Type': 'application/json' },
  });
}

export const loader = (args: Route.LoaderArgs) => proxy(args);
export const action = (args: Route.ActionArgs) => proxy(args);
