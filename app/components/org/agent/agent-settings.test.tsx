import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  useOrg: () => ({ org: { id: 'Kq7vB2mXp9Lt' } }),
}));

const agent = { ...agentDtoSchema.parse(agents[0]), orgId: ORG };

function renderSettings(canManage = true) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/o/tujenge/agents/a1?tab=settings']}>
        <Routes>
          <Route
            path="/o/:slug/agents/:id"
            element={<AgentSettings agent={agent} canManage={canManage} />}
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
    )
  );
});

describe('automation settings', () => {
  it('shows the saved settings, not a form', () => {
    renderSettings();
    expect(screen.queryByRole('textbox')).toBeNull();
    const sources = screen.getByText('Websites').closest('div') as HTMLElement;
    expect(within(sources).getByText('County tenders')).toHaveAttribute(
      'title',
      'From your organization'
    );
    expect(within(sources).getByText('Partner calls')).toHaveAttribute(
      'title',
      'Added by this worker'
    );
  });

  it('hides Edit from people who cannot manage it', () => {
    renderSettings(false);
    expect(screen.queryByRole('button', { name: /^edit/i })).toBeNull();
  });

  it('saves only the section being edited', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.patch(
        `*/api/organizations/${ORG}/agents/${agent.id}`,
        async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(agents[0]);
        }
      )
    );
    renderSettings();
    await userEvent.click(screen.getByRole('button', { name: 'Edit basics' }));
    const name = await screen.findByRole('textbox', { name: /name/i });
    await userEvent.clear(name);
    await userEvent.type(name, 'Renamed');
    await userEvent.click(screen.getByRole('button', { name: 'Save changes' }));
    await waitFor(() => expect(sent).toBeDefined());
    expect(Object.keys(sent!).sort()).toEqual([
      'depth',
      'description',
      'name',
      'schedule',
    ]);
    expect(sent).toMatchObject({ name: 'Renamed', depth: '' });
  });

  it('closes on Escape while nothing has changed', async () => {
    renderSettings();
    const user = userEvent.setup();
    await user.click(screen.getByRole('button', { name: 'Edit basics' }));
    expect(await screen.findByRole('dialog')).toBeInTheDocument();
    await user.keyboard('{Escape}');
    await waitFor(() => expect(screen.queryByRole('dialog')).toBeNull());
  });
});
