import type { z } from 'zod';
import type { Route } from './+types/api.auth.$action';
import {
  backendUrl,
  callBackend,
  normalizeBackendError,
  toAuthUser,
  type BackendSession,
  type BackendUser,
} from '~/lib/auth/backend.server';
import { backendSessionContext } from '~/lib/auth/middleware.server';
import { sessionContext } from '~/lib/auth/context';
import { isCrossSite } from '~/lib/auth/same-site.server';
import { sessionCookie, type StoredSession } from '~/lib/auth/session.server';
import {
  changeEmailSchema,
  changePasswordSchema,
  deleteAccountSchema,
  forgotPasswordSchema,
  loginSchema,
  registerSchema,
  resetPasswordWithCodeSchema,
  updateProfileSchema,
  verifyEmailSchema,
} from '~/lib/schema';

/**
 * Backend auth (`API_URL` set): the browser posts JSON here and this
 * route talks to the auth API. Access and refresh tokens only ever travel
 * between this server and the API — they go into the httpOnly session cookie
 * and never into a response body.
 *
 * Success: `{ user? , email?, detail? }`. Failure: the API's status with
 * `{ detail, code?, email?, fields? }` (`fields` keyed by *our* form names).
 */
interface Endpoint {
  schema: z.ZodType;
  path: string;
  method?: 'POST' | 'PATCH';
  /** Calls the API as the signed-in user. */
  auth?: boolean;
  toBackend: (input: never) => unknown;
  /** Backend field name → form field name, for validation errors. */
  fields?: Record<string, string>;
  /** Success signs the user out here (the backend revoked their tokens). */
  endsSession?: boolean;
  fallback: string;
}

const endpoints: Record<string, Endpoint> = {
  login: {
    schema: loginSchema,
    path: '/auth/login/',
    toBackend: ({ email, password }: z.infer<typeof loginSchema>) => ({
      email,
      password,
    }),
    fallback: 'Could not sign in.',
  },
  register: {
    schema: registerSchema,
    path: '/auth/register/',
    toBackend: ({
      firstName,
      lastName,
      email,
      password,
    }: z.infer<typeof registerSchema>) => ({
      email,
      password,
      profile: { first_name: firstName, last_name: lastName },
    }),
    fields: { first_name: 'firstName', last_name: 'lastName' },
    fallback: 'Could not create the account.',
  },
  'verify-email': {
    schema: verifyEmailSchema,
    path: '/auth/verify-email/',
    toBackend: ({ email, code }: z.infer<typeof verifyEmailSchema>) => ({
      email,
      otp_code: code,
    }),
    fields: { otp_code: 'code' },
    fallback: 'Could not verify the code.',
  },
  'resend-verification': {
    schema: forgotPasswordSchema,
    path: '/auth/resend-verification/',
    toBackend: ({ email }: z.infer<typeof forgotPasswordSchema>) => ({ email }),
    fallback: 'Could not send a new code.',
  },
  'forgot-password': {
    schema: forgotPasswordSchema,
    path: '/auth/forgot-password/',
    toBackend: ({ email }: z.infer<typeof forgotPasswordSchema>) => ({ email }),
    fallback: 'Could not send a reset code.',
  },
  'reset-password': {
    schema: resetPasswordWithCodeSchema,
    path: '/auth/reset-password/',
    toBackend: ({
      email,
      code,
      password,
    }: z.infer<typeof resetPasswordWithCodeSchema>) => ({
      email,
      otp_code: code,
      new_password: password,
    }),
    fields: { otp_code: 'code', new_password: 'password' },
    fallback: 'Could not reset the password.',
  },
  'change-password': {
    schema: changePasswordSchema,
    path: '/auth/change-password/',
    auth: true,
    toBackend: ({
      current,
      next,
      confirm,
    }: z.infer<typeof changePasswordSchema>) => ({
      old_password: current,
      new_password: next,
      confirm_password: confirm,
    }),
    fields: {
      old_password: 'current',
      new_password: 'next',
      confirm_password: 'confirm',
    },
    fallback: 'Could not change the password.',
  },
  'change-email': {
    schema: changeEmailSchema,
    path: '/auth/change-email/',
    auth: true,
    toBackend: ({ newEmail, password }: z.infer<typeof changeEmailSchema>) => ({
      new_email: newEmail,
      password,
    }),
    fields: { new_email: 'newEmail' },
    endsSession: true,
    fallback: 'Could not change the email.',
  },
  'delete-account': {
    schema: deleteAccountSchema,
    path: '/auth/delete-account/',
    auth: true,
    toBackend: ({ password }: z.infer<typeof deleteAccountSchema>) => ({
      password,
    }),
    endsSession: true,
    fallback: 'Could not delete the account.',
  },
  profile: {
    schema: updateProfileSchema,
    path: '/auth/profile/',
    method: 'PATCH',
    auth: true,
    toBackend: ({
      firstName,
      lastName,
    }: z.infer<typeof updateProfileSchema>) => ({
      profile: { first_name: firstName, last_name: lastName },
    }),
    fields: { first_name: 'firstName', last_name: 'lastName' },
    fallback: 'Could not update the profile.',
  },
};

const json = (body: unknown, status = 200, headers?: HeadersInit) =>
  Response.json(body, { status, headers });

function fieldErrors(error: z.ZodError) {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = String(issue.path[0] ?? 'form');
    fields[key] ??= issue.message;
  }
  return fields;
}

/** GET `/api/auth/me` — the session for `useAuth()` (never a token). */
export function loader({ params, context }: Route.LoaderArgs) {
  if (params.action !== 'me') {
    return json({ detail: 'Not found' }, 404);
  }
  const { user, isAuthenticated } = context.get(sessionContext);
  return json({ user, isAuthenticated });
}

export async function action({ request, params, context }: Route.ActionArgs) {
  if (isCrossSite(request)) {
    return json({ detail: 'Cross-site request refused' }, 403);
  }
  if (request.method !== 'POST') {
    return json({ detail: 'Method not allowed' }, 405);
  }
  // A plain HTML form can't send JSON cross-site without a CORS preflight.
  if (!request.headers.get('Content-Type')?.startsWith('application/json')) {
    return json({ detail: 'Expected JSON' }, 415);
  }

  const base = backendUrl();
  const endpoint = Object.hasOwn(endpoints, params.action)
    ? endpoints[params.action]
    : undefined;
  if (!endpoint) return json({ detail: 'Not found' }, 404);

  const parsed = endpoint.schema.safeParse(
    await request.json().catch(() => null)
  );
  if (!parsed.success) {
    const fields = fieldErrors(parsed.error);
    return json(
      { detail: Object.values(fields)[0] ?? 'Invalid request', fields },
      400
    );
  }

  const session = context.get(backendSessionContext);
  if (endpoint.auth && !session) {
    return json({ detail: 'Sign in again to continue.' }, 401);
  }

  const { status, data } = await callBackend(base, endpoint.path, {
    method: endpoint.method,
    body: endpoint.toBackend(parsed.data as never),
    access: endpoint.auth ? session?.token : undefined,
    request,
  });

  if (status >= 400) {
    const error = normalizeBackendError(data, endpoint.fallback);
    if (error.fields && endpoint.fields) {
      error.fields = Object.fromEntries(
        Object.entries(error.fields).map(([k, v]) => [
          endpoint.fields?.[k] ?? k,
          v,
        ])
      );
    }
    return json(error, status);
  }

  const body = (data ?? {}) as Partial<BackendSession> & {
    detail?: string;
    email?: string;
    data?: BackendUser;
  };

  // Login, verify, reset and change-password answer with a fresh session.
  if (body.access && body.refresh && body.user) {
    const next: StoredSession = { token: body.access, refresh: body.refresh };
    return json({ user: toAuthUser(body.user) }, 200, {
      'Set-Cookie': await sessionCookie.commitSession(next),
    });
  }
  if (body.data) return json({ user: toAuthUser(body.data) });
  return json(
    {
      ...(body.detail ? { detail: body.detail } : {}),
      ...(body.email ? { email: body.email } : {}),
    },
    200,
    endpoint.endsSession
      ? { 'Set-Cookie': await sessionCookie.destroy(request) }
      : undefined
  );
}
