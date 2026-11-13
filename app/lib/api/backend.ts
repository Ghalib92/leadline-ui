import { apiClient } from './client';

/** Helpers for the Leadline backend's org-scoped API (`/organizations/:id/…`). */

export const orgApi = (orgId: string, path = '') =>
  `/organizations/${orgId}${path}`;

/** DRF reads repeated keys (`type=a&type=b`), not axios' default `type[]=a`. */
export const repeatParams = { paramsSerializer: { indexes: null } } as const;

/** Download a file endpoint (proxied with the session) under `fallbackName`. */
export async function downloadFile(path: string, fallbackName: string) {
  const response = await apiClient.get<Blob>(path, {
    responseType: 'blob',
    timeout: 120_000,
  });
  const disposition = String(response.headers['content-disposition'] ?? '');
  const name = /filename="?([^";]+)"?/.exec(disposition)?.[1] ?? fallbackName;
  const url = URL.createObjectURL(response.data);
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
