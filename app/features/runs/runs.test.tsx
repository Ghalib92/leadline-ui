import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import runDetail from '~/lib/schema/__fixtures__/backend/run_detail.json';
import { useRunAgent } from '~/features/agents';
import { runKeys } from './query-keys';
import { useRun } from './queries';

const ORG = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient();
});

describe('agent runs', () => {
  it('"Run now" seeds the run page from the 202 response', async () => {
    server.use(
      http.post(`*/api/organizations/${ORG}/agents/:agent/run`, () =>
        HttpResponse.json(
          { ...runDetail, status: 'queued', started_at: null },
          { status: 202 }
        )
      )
    );
    const { result } = renderHook(() => useRunAgent(ORG), { wrapper });
    const { run } = await result.current.mutateAsync({
      agentId: runDetail.agent!,
    });
    expect(run).toMatchObject({
      id: runDetail.id,
      status: 'queued',
      orgId: ORG,
    });
    expect(client.getQueryData(runKeys.detail(ORG, run.id))).toEqual(run);
  });

  it('"Run with my settings" sends no body', async () => {
    let body: unknown = 'unset';
    server.use(
      http.post(
        `*/api/organizations/${ORG}/agents/:agent/run`,
        async ({ request }) => {
          body = await request.text();
          return HttpResponse.json(runDetail, { status: 202 });
        }
      )
    );
    const { result } = renderHook(() => useRunAgent(ORG), { wrapper });
    const { run } = await result.current.mutateAsync({ agentId: 'a1' });
    expect(body).toBe('');
    expect(run).toMatchObject({
      depth: 'quick',
      folders: [{ id: 'qdWPq2z3bYTt', name: 'Past proposals' }],
    });
  });

  it('"Configure this run" sends the chosen settings', async () => {
    let body: unknown;
    server.use(
      http.post(
        `*/api/organizations/${ORG}/agents/:agent/run`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json(runDetail, { status: 202 });
        }
      )
    );
    const { result } = renderHook(() => useRunAgent(ORG), { wrapper });
    await result.current.mutateAsync({
      agentId: 'a1',
      settings: {
        depth: 'deep',
        sources: ['web'],
        opportunityTypes: ['event'],
        knowledgeMode: 'all',
        folders: [],
      },
    });
    expect(body).toEqual({
      depth: 'deep',
      sources: ['web'],
      opportunity_types: ['conference', 'award', 'competition'],
      knowledge_mode: 'all',
      folders: [],
    });
  });

  it('polls a run until it finishes', async () => {
    const statuses = ['queued', 'running', 'succeeded'];
    let calls = 0;
    server.use(
      http.get(`*/api/organizations/${ORG}/runs/${runDetail.id}`, () => {
        const status = statuses[Math.min(calls, statuses.length - 1)];
        calls += 1;
        return HttpResponse.json({ ...runDetail, status });
      })
    );
    const { result } = renderHook(() => useRun(ORG, runDetail.id), {
      wrapper,
    });
    await waitFor(() => expect(result.current.data?.status).toBe('succeeded'), {
      timeout: 5000,
    });
    expect(calls).toBe(3);
    // Settled: no more polling.
    await new Promise((resolve) => setTimeout(resolve, 1800));
    expect(calls).toBe(3);
  }, 10_000);
});
