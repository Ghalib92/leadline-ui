/**
 * Backend auth: the browser calls our own server (`routes/api.auth.$action.ts`),
 * which calls the auth API and keeps the tokens in the httpOnly cookie.
 */
export class AuthApiError extends Error {
  constructor(
    readonly status: number,
    readonly body: {
      detail: string;
      code?: string;
      email?: string;
      fields?: Record<string, string>;
    }
  ) {
    super(body.detail);
    this.name = 'AuthApiError';
  }
}

export async function postAuth<T>(action: string, body: unknown): Promise<T> {
  const res = await fetch(`/api/auth/${action}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'same-origin',
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new AuthApiError(res.status, {
      detail: 'Something went wrong. Please try again.',
      ...data,
    });
  }
  return data as T;
}

/** Where sign-up (and an unverified sign-in) sends people for the code. */
export const verifyEmailPath = (email: string, redirectTo: string) =>
  `/auth/verify-email?${new URLSearchParams({ email, redirectTo })}`;

/** Show the server's per-field messages under the matching inputs. */
export function applyFieldErrors(
  error: unknown,
  setError: (name: never, error: { message: string }) => void
) {
  if (!(error instanceof AuthApiError)) return;
  for (const [name, message] of Object.entries(error.body.fields ?? {})) {
    setError(name as never, { message });
  }
}
