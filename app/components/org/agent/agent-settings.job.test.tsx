import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import agents from '~/lib/schema/__fixtures__/backend/agents.json';
import folders from '~/lib/schema/__fixtures__/backend/folders.json';
import runSettings from '~/lib/schema/__fixtures__/backend/run_settings.json';
import { agentDtoSchema } from '~/lib/schema';
import { AgentSettings } from './agent-settings';

const ORG = 'Kq7vB2mXp9Lt';
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    org: { id: 'Kq7vB2mXp9Lt' },
    view: {
      id: 'Kq7vB2mXp9Lt',
      isCandidate: true,
      profile: { goals: ['jobs'] },
    },
  }),
}));

// A job seeker's search, saved before descriptions and instructions were required.
const search = {
  ...agentDtoSchema.parse(agents[0]),
  orgId: ORG,
  goal: 'jobs' as const,
  name: 'AI jobs',
  description: '',
  instructions: '',
};

function renderSettings() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter initialEntries={['/o/amina/agents/a1?tab=settings']}>
        <Routes>
          <Route
            path="/o/:slug/agents/:id"
            element={<AgentSettings agent={search} canManage />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => {
  server.use(
    http.get(`*/api/organizations/${ORG}/folders`, () =>
      HttpResponse.json(folders)
    ),
    http.get(`*/api/organizations/${ORG}/run-settings`, () =>
      HttpResponse.json(runSettings)
    ),
    http.get(`*/api/organizations/${ORG}/job-brief`, () =>
      HttpResponse.json({
        target_roles: ['AI Engineer'],
        cv_profile: {
          read_at: '2026-11-21T09:00:00+03:00',
          current_title: 'AI Engineer',
          current_employer: 'Digital Appex',
          skills: ['Python', 'LangGraph'],
        },
      })
    )
  );
});

describe("a job seeker's search settings", () => {
  it('say what every run reads, with no organization settings', async () => {
    renderSettings();
    expect(await screen.findByText('What every run reads')).toBeInTheDocument();
    expect(
      await screen.findByText('AI Engineer at Digital Appex, 2 skills')
    ).toBeInTheDocument();
    expect(screen.getAllByText(/^Missing\./).length).toBeGreaterThan(0);
    expect(screen.queryByText('Company documents')).toBeNull();
    expect(screen.queryByText('Opportunity types')).toBeNull();
    expect(screen.queryByText(/organization/i)).toBeNull();
  });

  it('need instructions with real context before saving', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.patch(
        `*/api/organizations/${ORG}/agents/${search.id}`,
        async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(agents[0]);
        }
      )
    );
    const user = userEvent.setup();
    renderSettings();
    await user.click(screen.getByRole('button', { name: 'Edit instructions' }));
    const field = await screen.findByRole('textbox', {
      name: /What should it look for, and skip\?/,
    });
    await user.type(field, 'AI jobs');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    expect(
      await screen.findByText(
        'Tell Leadline what to look for and what to skip. The more context, the better the jobs it finds.'
      )
    ).toBeInTheDocument();
    expect(sent).toBeUndefined();

    await user.type(field, ' with Python and LangGraph; skip sales roles.');
    await user.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() =>
      expect(sent).toEqual({
        instructions: 'AI jobs with Python and LangGraph; skip sales roles.',
      })
    );
  });
});
