import type { AuthUser } from '~/lib/schema';

/**
 * Server-side client for the Django auth API (`leadline_backend`). Only our own
 * server talks to it: tokens never reach the browser (they live in the
 * httpOnly session cookie), so there's no CORS and no JWT in page JavaScript.
 */

type Env = Record<string, string | undefined>;

/** Leadline backend base URL (`API_URL`), e.g. `http://127.0.0.1:8000/api/v1`. Required. */
export function backendUrl(env: Env = process.env): string {
  const url = env.API_URL?.trim();
  if (!url) {
    throw new Error(
      'API_URL must be set to the Leadline backend, e.g. http://127.0.0.1:8000/api/v1'
    );
  }
  return url.replace(/\/+$/, '');
}

/**
 * Who the visitor is, for the API's throttles. Every call reaches the API from
 * this server, so without this all visitors would share one limit (5 sign-in
 * attempts a minute, for everyone). Vercel puts the visitor's address in
 * `x-real-ip` (and overwrites `x-forwarded-for`, so neither can be forged
 * there). The shared `UI_PROXY_SECRET` tells the API the address is ours to
 * vouch for; without it the API ignores the address.
 */
export function visitorHeaders(
  request: Request,
  env: Env = process.env
): Record<string, string> {
  const secret = env.UI_PROXY_SECRET?.trim();
  const address =
    request.headers.get('x-real-ip')?.trim() ||
    request.headers.get('x-forwarded-for')?.split(',')[0]?.trim();
  if (!secret || !address) return {};
  return { 'X-Leadline-Proxy': secret, 'X-Leadline-Client-IP': address };
}

export interface BackendUser {
  id: string | number;
  email: string;
  first_name?: string;
  last_name?: string;
  date_joined?: string;
  profile?: { first_name?: string; last_name?: string } | null;
}

export interface BackendSession {
  access: string;
  refresh: string;
  user: BackendUser;
}

export function toAuthUser(user: BackendUser): AuthUser {
  const first = user.profile?.first_name ?? user.first_name ?? '';
  const last = user.profile?.last_name ?? user.last_name ?? '';
  const name = `${first} ${last}`.trim() || user.email;
  return {
    id: String(user.id),
    email: user.email,
    name,
    firstName: first,
    lastName: last,
    ...(user.date_joined ? { createdAt: user.date_joined } : {}),
  };
}

/**
 * True when the JWT is expired or about to be (30s margin), or unreadable.
 * Only reads the payload — the backend verifies the signature on every call.
 */
export function isExpired(
  token: string,
  now = Date.now(),
  skewMs = 30_000
): boolean {
  try {
    const payload = token.split('.')[1];
    if (!payload) return true;
    const { exp } = JSON.parse(
      Buffer.from(payload, 'base64url').toString('utf8')
    ) as {
      exp?: number;
    };
    return typeof exp !== 'number' || exp * 1000 - skewMs <= now;
  } catch {
    return true;
  }
}

export interface NormalizedError {
  detail: string;
  code?: string;
  email?: string;
  /** First message per field, for showing under form inputs. */
  fields?: Record<string, string>;
}

/**
 * DRF errors come as `{ detail, code }` or as field maps
 * (`{ email: ["…"] }`). Flatten both into one shape the UI can use.
 */
export function normalizeBackendError(
  body: unknown,
  fallback: string
): NormalizedError {
  if (!body || typeof body !== 'object') return { detail: fallback };
  const record = body as Record<string, unknown>;

  if (typeof record.detail === 'string') {
    return {
      detail: record.detail,
      ...(typeof record.code === 'string' ? { code: record.code } : {}),
      ...(typeof record.email === 'string' ? { email: record.email } : {}),
    };
  }

  const fields: Record<string, string> = {};
  // Nested serializers (`profile: { first_name: [...] }`) report by inner key.
  const collect = (entries: [string, unknown][]) => {
    for (const [key, value] of entries) {
      const first = Array.isArray(value) ? value[0] : value;
      if (typeof first === 'string') fields[key] ??= first;
      else if (first && typeof first === 'object') {
        collect(Object.entries(first as Record<string, unknown>));
      }
    }
  };
  collect(Object.entries(record));
  const messages = Object.values(fields);
  if (messages.length === 0) return { detail: fallback };
  return { detail: messages[0], fields };
}

interface CallOptions {
  method?: 'GET' | 'POST' | 'PATCH';
  body?: unknown;
  access?: string;
  /** The visitor's request: passes their address on (`visitorHeaders`). */
  request?: Request;
  fetchImpl?: typeof fetch;
  timeoutMs?: number;
}

export async function callBackend(
  base: string,
  path: string,
  {
    method = 'POST',
    body,
    access,
    request,
    fetchImpl = fetch,
    timeoutMs = 8000,
  }: CallOptions = {}
): Promise<{ status: number; data: unknown }> {
  try {
    const res = await fetchImpl(`${base}${path}`, {
      method,
      headers: {
        ...(request ? visitorHeaders(request) : {}),
        Accept: 'application/json',
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
        ...(access ? { Authorization: `Bearer ${access}` } : {}),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
      signal: AbortSignal.timeout(timeoutMs),
    });
    const data = await res.json().catch(() => null);
    return { status: res.status, data };
  } catch {
    return {
      status: 503,
      data: {
        detail: 'The server is unavailable. Try again shortly.',
      },
    };
  }
}
