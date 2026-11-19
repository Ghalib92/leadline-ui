import axios from 'axios';
import { apiClient } from './client';

/**
 * Files go straight between the browser and the API, not through our `/api/*`
 * proxy: the host the UI runs on (Vercel) caps a request or response at 4.5 MB,
 * and documents go up to 25 MB.
 *
 * The browser still never holds a token. It asks our server (signed in, through
 * the proxy) for a ticket good for this one path and method for a few minutes,
 * then uses it on the API. The API still checks membership as usual.
 */
interface Ticket {
  url: string;
  ticket: string;
}

const fileTransferTimeout = 5 * 60_000;

async function ticketFor(path: string, method: 'GET' | 'POST') {
  const { data } = await apiClient.post<Ticket>('/transfers/ticket', {
    path: path.replace(/^\/+/, ''),
    method,
  });
  return data;
}

/** POST a multipart form (an upload) to an API path, e.g. `/organizations/x/documents`. */
export async function uploadFile<T>(path: string, form: FormData): Promise<T> {
  const { url, ticket } = await ticketFor(path, 'POST');
  // Not `apiClient`: that one talks to our own server, and signs out on a 401.
  const { data } = await axios.post<T>(url, form, {
    headers: { Authorization: `Ticket ${ticket}` },
    timeout: fileTransferTimeout,
  });
  return data;
}

/** Download a file from an API path. The API names it (Content-Disposition). */
export async function downloadFile(path: string) {
  const { url, ticket } = await ticketFor(path, 'GET');
  const link = globalThis.document.createElement('a');
  link.href = `${url}?ticket=${encodeURIComponent(ticket)}`;
  link.rel = 'noopener';
  link.click();
}
