import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import runSettings from '~/lib/schema/__fixtures__/backend/run_settings.json';
import { useRunSettings, useUpdateRunSettings } from './index';

const org = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient();
});

describe('run settings', () => {
  it('maps backend kinds to feed types', async () => {
    server.use(
      http.get(`*/api/organizations/${org}/run-settings`, () =>
        HttpResponse.json(runSettings)
      )
    );
    const { result } = renderHook(() => useRunSettings(org), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toMatchObject({
      depth: 'quick',
      sources: ['web', 'grants'],
      opportunityTypes: ['grant'],
      folders: [{ id: 'qdWPq2z3bYTt', name: 'Past proposals' }],
    });
    expect(result.current.data?.depths.map((d) => d.value)).toEqual([
      'quick',
      'standard',
      'deep',
    ]);
  });

  it('saves snake_case with backend kinds', async () => {
    let sent: unknown;
    server.use(
      http.put(
        `*/api/organizations/${org}/run-settings`,
        async ({ request }) => {
          sent = await request.json();
          return HttpResponse.json(runSettings);
        }
      )
    );
    const { result } = renderHook(() => useUpdateRunSettings(org), {
      wrapper,
    });
    await result.current.mutateAsync({
      depth: 'deep',
      sources: ['news'],
      opportunityTypes: ['tender'],
      knowledgeMode: 'selected',
      folders: ['f1'],
    });
    expect(sent).toEqual({
      depth: 'deep',
      sources: ['news'],
      opportunity_types: ['tender', 'rfp', 'consultancy'],
      knowledge_mode: 'selected',
      folders: ['f1'],
    });
  });
});
