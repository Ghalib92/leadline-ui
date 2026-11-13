import { beforeEach, describe, expect, it } from 'vitest';
import { render, renderHook, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import runDetail from '~/lib/schema/__fixtures__/backend/run_detail.json';
import { runDetailDtoSchema, type AgentRun } from '~/lib/schema';
import { runKeys } from './query-keys';
import { useStartSearch } from './mutations';
import { RunNextStep, noResultReasons } from './run-next-step';

const ORG = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient();
});

const parsed = runDetailDtoSchema.parse(runDetail);
const emptyRun: AgentRun = {
  ...parsed,
  agentId: '',
  found: 0,
  outcome: {
    added: 0,
    duplicates: 0,
    belowThreshold: 6,
    skipped: {
      closed: 3,
      notAnOpportunity: 8,
      wrongType: 0,
      excluded: 0,
      unreadable: 1,
    },
    bestScore: 20,
    matchThreshold: 55,
  },
};

function renderAt(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/o/tujenge/runs/r1']}>
      <Routes>
        <Route path="/o/:slug/runs/:id" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe('"Search for opportunities"', () => {
  it('starts a search from the search settings, with no saved search', async () => {
    let body: unknown = 'unset';
    server.use(
      http.post(`*/api/organizations/${ORG}/runs`, async ({ request }) => {
        body = await request.text();
        return HttpResponse.json(
          { ...runDetail, agent: null, agent_name: 'Opportunity search' },
          { status: 202 }
        );
      })
    );
    const { result } = renderHook(() => useStartSearch(ORG), { wrapper });
    const { run } = await result.current.mutateAsync(undefined);
    expect(body).toBe('');
    expect(run).toMatchObject({ agentId: '', agentName: 'Opportunity search' });
    expect(client.getQueryData(runKeys.detail(ORG, run.id))).toEqual(run);
  });

  it('sends "Configure this search" choices for this run only', async () => {
    let body: unknown;
    server.use(
      http.post(`*/api/organizations/${ORG}/runs`, async ({ request }) => {
        body = await request.json();
        return HttpResponse.json(runDetail, { status: 202 });
      })
    );
    const { result } = renderHook(() => useStartSearch(ORG), { wrapper });
    await result.current.mutateAsync({
      depth: 'deep',
      sources: ['web'],
      opportunityTypes: ['grant'],
      knowledgeMode: 'none',
      folders: ['ignored'],
    });
    // Folders only go with "selected".
    expect(body).toMatchObject({
      depth: 'deep',
      sources: ['web'],
      knowledge_mode: 'none',
      folders: [],
    });
  });
});

describe('what to do after a search', () => {
  it('sends you to review what it added', () => {
    renderAt(<RunNextStep run={parsed} />);
    expect(screen.getByText('3 new opportunities to review')).toBeTruthy();
    expect(
      screen.getByRole('link', { name: /review now/i }).getAttribute('href')
    ).toBe(`/o/tujenge/opportunities?run=${parsed.id}`);
  });

  it('explains a search that added nothing, most common reason first', () => {
    expect(noResultReasons(emptyRun.outcome!)).toEqual([
      '8 pages were not a single open call (lists, news, reports)',
      '6 matches scored below 55 (best: 20)',
      '3 calls were already closed',
      '1 page could not be read',
    ]);
    renderAt(<RunNextStep run={emptyRun} onSearchAgain={() => {}} />);
    expect(screen.getByText('Nothing good enough this time')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Search again' })).toBeTruthy();
    expect(
      screen
        .getByRole('link', { name: 'Add your own sources' })
        .getAttribute('href')
    ).toBe('/o/tujenge/settings/general?tab=sources');
  });

  it('still helps when the backend sends no outcome', () => {
    renderAt(<RunNextStep run={{ ...emptyRun, outcome: undefined }} />);
    expect(screen.getByText(/no open opportunity matched/i)).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Search again' })).toBeNull();
  });
});
