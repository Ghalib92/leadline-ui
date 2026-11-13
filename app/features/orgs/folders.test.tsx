import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import folders from '~/lib/schema/__fixtures__/backend/folders.json';
import documents from '~/lib/schema/__fixtures__/backend/documents.json';
import { extractError } from '~/lib/utils/extract-error';
import { runKeys } from '~/features/runs';
import {
  useDeleteFolder,
  useDocuments,
  useFolders,
  useMoveDocument,
} from './index';

const org = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('folders', () => {
  it('lists folders in the view shape', async () => {
    server.use(
      http.get(`*/api/organizations/${org}/folders`, () =>
        HttpResponse.json(folders)
      )
    );
    const { result } = renderHook(() => useFolders(org), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.[0]).toEqual({
      id: folders[0].id,
      name: folders[0].name,
      purpose: folders[0].purpose,
      documentCount: folders[0].document_count,
    });
  });

  it('asks for one folder’s documents and reads their folder', async () => {
    let asked = '';
    server.use(
      http.get(`*/api/organizations/${org}/documents`, ({ request }) => {
        asked = new URL(request.url).searchParams.get('folder') ?? '';
        return HttpResponse.json(documents);
      })
    );
    const { result } = renderHook(
      () => useDocuments(org, { folder: 'qdWPq2z3bYTt' }),
      { wrapper }
    );
    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(asked).toBe('qdWPq2z3bYTt');
    expect(result.current.data?.[0].folder).toEqual({
      id: 'qdWPq2z3bYTt',
      name: 'Past proposals',
    });
  });

  it('shows why a folder can’t be deleted', async () => {
    server.use(
      http.delete(`*/api/organizations/${org}/folders/:id`, () =>
        HttpResponse.json(
          { detail: 'Move or delete its documents first.' },
          { status: 409 }
        )
      )
    );
    const { result } = renderHook(() => useDeleteFolder(org), { wrapper });
    const error = await result.current
      .mutateAsync('f1')
      .catch((e: unknown) => e);
    expect(extractError(error)).toBe('Move or delete its documents first.');
  });

  it('moves a document with folder_id', async () => {
    let sent: unknown;
    server.use(
      http.patch(
        `*/api/organizations/${org}/documents/:id`,
        async ({ request }) => {
          sent = await request.json();
          return HttpResponse.json(documents.results[0]);
        }
      )
    );
    const { result } = renderHook(() => useMoveDocument(org), { wrapper });
    await result.current.mutateAsync({ id: 'd1', folderId: 'f2' });
    expect(sent).toEqual({ folder_id: 'f2' });
  });

  it('deleting a folder refreshes the run settings that may point at it', async () => {
    server.use(
      http.delete(
        `*/api/organizations/${org}/folders/:id`,
        () => new HttpResponse(null, { status: 204 })
      )
    );
    client.setQueryData(runKeys.settings(org), { folders: [{ id: 'f1' }] });
    const { result } = renderHook(() => useDeleteFolder(org), { wrapper });
    await result.current.mutateAsync('f1');
    expect(client.getQueryState(runKeys.settings(org))?.isInvalidated).toBe(
      true
    );
  });
});
