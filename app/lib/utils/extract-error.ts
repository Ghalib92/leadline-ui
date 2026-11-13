import { AxiosError } from 'axios';

/**
 * Pull a human-readable message out of an unknown thrown value.
 *
 * Mutation `catch` blocks should surface the API's actual reason rather than a
 * hardcoded "Please try again" — the server already told us what went wrong.
 *
 * @example
 * } catch (error) {
 *   toastUtils.error('Update Failed', extractError(error, 'Failed to update product.'));
 * }
 */
export function extractError(error: unknown, fallbackMessage?: string): string {
  if (error instanceof AxiosError) {
    const data = error.response?.data as
      | ({ detail?: string; message?: string } & Record<string, unknown>)
      | undefined;

    return (
      data?.detail ||
      data?.message ||
      (typeof data === 'object' ? firstFieldMessage(data) : undefined) ||
      // The caller's wording beats axios's "Request failed with status code 400".
      fallbackMessage ||
      error.message ||
      'An unknown error occurred'
    );
  }

  if (error instanceof Error) return error.message;

  return fallbackMessage || 'An unknown error occurred';
}

/**
 * DRF validation errors: `{ field: ["msg"] }`, `{ field: "msg" }`, or per-item
 * lists like `{ invitations: [{}, { email: ["msg"] }] }`.
 */
function firstFieldMessage(data: unknown): string | undefined {
  if (typeof data === 'string') return data || undefined;
  // A proxy/gateway error page arrives as a string at the top level, not here.
  if (!data || typeof data !== 'object') return undefined;
  for (const value of Array.isArray(data) ? data : Object.values(data)) {
    const message = firstFieldMessage(value);
    if (message) return message;
  }
  return undefined;
}
