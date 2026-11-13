import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import { extractError } from '~/lib/utils/extract-error';
import {
  useRemoveSource,
  useSaveSource,
  useSources,
  useToggleSource,
} from './index';

const org = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

const fixtureSource = {
  id: 'src-1',
  url: 'https://example.org/calls',
  label: 'Example Calls Feed',
  notes: 'Updated weekly',
  enabled: true,
  created_at: '2026-10-14T00:00:00Z',
  updated_at: '2026-10-14T00:00:00Z',
};

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('organization sources hooks', () => {
  it('lists sources in the view shape', async () => {
    server.use(
      http.get(`*/api/organizations/${org}/sources`, () =>
        HttpResponse.json([fixtureSource])
      )
    );
    const { result } = renderHook(() => useSources(org), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data?.[0]).toEqual({
      id: fixtureSource.id,
      url: fixtureSource.url,
      label: fixtureSource.label,
      notes: fixtureSource.notes,
      enabled: fixtureSource.enabled,
      createdAt: fixtureSource.created_at,
      updatedAt: fixtureSource.updated_at,
    });
  });

  it('creates a custom source', async () => {
    let sent: unknown;
    server.use(
      http.post(`*/api/organizations/${org}/sources`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(fixtureSource, { status: 201 });
      })
    );
    const { result } = renderHook(() => useSaveSource(org), { wrapper });
    const created = await result.current.mutateAsync({
      url: 'https://example.org/calls',
      label: 'Example Calls Feed',
      notes: 'Updated weekly',
      enabled: true,
    });
    expect(created.id).toBe('src-1');
    expect(sent).toEqual({
      url: 'https://example.org/calls',
      label: 'Example Calls Feed',
      notes: 'Updated weekly',
      enabled: true,
    });
  });

  it('updates an existing source', async () => {
    let sent: unknown;
    server.use(
      http.patch(
        `*/api/organizations/${org}/sources/:id`,
        async ({ request }) => {
          sent = await request.json();
          return HttpResponse.json({
            ...fixtureSource,
            label: 'Updated Label',
          });
        }
      )
    );
    const { result } = renderHook(() => useSaveSource(org), { wrapper });
    const updated = await result.current.mutateAsync({
      id: 'src-1',
      url: 'https://example.org/calls',
      label: 'Updated Label',
      notes: 'Updated notes',
      enabled: true,
    });
    expect(updated.label).toBe('Updated Label');
    expect(sent).toEqual({
      url: 'https://example.org/calls',
      label: 'Updated Label',
      notes: 'Updated notes',
      enabled: true,
    });
  });

  it('toggles source enabled status', async () => {
    let sent: unknown;
    server.use(
      http.patch(
        `*/api/organizations/${org}/sources/:id`,
        async ({ request }) => {
          sent = await request.json();
          return HttpResponse.json({
            ...fixtureSource,
            enabled: false,
          });
        }
      )
    );
    const { result } = renderHook(() => useToggleSource(org), { wrapper });
    const toggled = await result.current.mutateAsync({
      id: 'src-1',
      enabled: false,
    });
    expect(toggled.enabled).toBe(false);
    expect(sent).toEqual({ enabled: false });
  });

  it('reports duplicate URL error from backend', async () => {
    server.use(
      http.post(`*/api/organizations/${org}/sources`, () =>
        HttpResponse.json(
          { url: ['This source has already been added.'] },
          { status: 400 }
        )
      )
    );
    const { result } = renderHook(() => useSaveSource(org), { wrapper });
    const error = await result.current
      .mutateAsync({
        url: 'https://example.org/calls',
        label: '',
        notes: '',
        enabled: true,
      })
      .catch((e: unknown) => e);
    expect(extractError(error)).toBe('This source has already been added.');
  });

  it('removes a source', async () => {
    let deletedId = '';
    server.use(
      http.delete(
        `*/api/organizations/${org}/sources/:id`,
        ({ params }) => {
          deletedId = params.id as string;
          return new HttpResponse(null, { status: 204 });
        }
      )
    );
    const { result } = renderHook(() => useRemoveSource(org), { wrapper });
    await result.current.mutateAsync('src-1');
    expect(deletedId).toBe('src-1');
  });
});
