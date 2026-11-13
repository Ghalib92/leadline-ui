import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import dossier from '~/lib/schema/__fixtures__/backend/dossier.json';
import documents from '~/lib/schema/__fixtures__/backend/documents.json';
import {
  orgKeys,
  useDocuments,
  useDossier,
  useRegenerateDossier,
} from './index';

const ORG = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient();
});

describe('company knowledge hooks', () => {
  it('reads the dossier in the view shape', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/dossier`, () =>
        HttpResponse.json({ ...dossier, status: 'pending', content: null })
      )
    );
    const { result } = renderHook(() => useDossier(ORG), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({
      status: 'pending',
      content: null,
      generatedAt: dossier.generated_at,
    });
  });

  it('regenerating puts the returned dossier in the cache', async () => {
    server.use(
      http.post(`*/api/organizations/${ORG}/dossier/regenerate`, () =>
        HttpResponse.json(dossier, { status: 202 })
      )
    );
    const { result } = renderHook(() => useRegenerateDossier(ORG), {
      wrapper,
    });
    await result.current.mutateAsync();
    expect(client.getQueryData(orgKeys.dossier(ORG))).toMatchObject({
      status: 'generating',
      content: { summary: expect.stringContaining('mobile clinics') },
    });
  });

  it('documents carry their processing state', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/documents`, () =>
        HttpResponse.json(documents)
      )
    );
    const { result } = renderHook(() => useDocuments(ORG), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data![0]).toMatchObject({
      processingStatus: 'unsupported',
      processingError: expect.stringMatching(/can't be read yet/),
      processedAt: null,
    });
  });
});
