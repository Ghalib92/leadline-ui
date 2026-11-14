import { useState } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import clientBrief from '~/lib/schema/__fixtures__/backend/client_brief.json';
import tenderBrief from '~/lib/schema/__fixtures__/backend/tender_brief.json';
import { ClientBriefTab, TenderBriefTab } from './brief-tabs';

const ORG = 'Kq7vB2mXp9Lt';
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    org: { id: 'Kq7vB2mXp9Lt' },
    view: {
      id: 'Kq7vB2mXp9Lt',
      myRole: 'admin',
      isArchived: false,
      profile: { goals: ['clients', 'tenders'] },
    },
  }),
}));

function Harness({ tab }: Readonly<{ tab: 'clients' | 'tenders' }>) {
  const [editing, setEditing] = useState<string | null>(null);
  const Tab = tab === 'clients' ? ClientBriefTab : TenderBriefTab;
  return <Tab editing={editing} setEditing={setEditing} />;
}

function renderTab(tab: 'clients' | 'tenders') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter>
        <Harness tab={tab} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('clients brief tab', () => {
  it('shows what you sell and who to, in words', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/client-brief`, () =>
        HttpResponse.json(clientBrief)
      )
    );
    renderTab('clients');
    expect(await screen.findByText('Business websites')).toBeInTheDocument();
    expect(screen.getByText(/From KES 40,000/)).toBeInTheDocument();
    expect(
      screen.getByText('Hotels, lodges & guest houses')
    ).toBeInTheDocument();
    expect(
      screen.getByText('No online booking or ordering')
    ).toBeInTheDocument();
  });

  it('edits the services and sends only the brief', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.get(`*/api/organizations/${ORG}/client-brief`, () =>
        HttpResponse.json(clientBrief)
      ),
      http.patch(
        `*/api/organizations/${ORG}/client-brief`,
        async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(clientBrief);
        }
      )
    );
    const user = userEvent.setup();
    renderTab('clients');
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    await user.click(
      await screen.findByRole('button', { name: /add a service/i })
    );
    const names = screen.getAllByRole('textbox', { name: /^service/i });
    await user.type(names[names.length - 1], 'Mobile apps');
    await user.click(screen.getByRole('button', { name: /save/i }));

    await waitFor(() => expect(sent).toBeDefined());
    const services = sent!.services as { name: string }[];
    expect(services.map((s) => s.name)).toEqual([
      'Business websites',
      'AI chatbots',
      'Mobile apps',
    ]);
    expect(sent).toHaveProperty('customer_types', ['hospitality', 'health']);
  });
});

describe('tenders brief tab', () => {
  it('shows what you bid for and the contract size', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/tender-brief`, () =>
        HttpResponse.json(tenderBrief)
      )
    );
    renderTab('tenders');
    expect(
      await screen.findByText('Software, systems & apps')
    ).toBeInTheDocument();
    expect(
      screen.getByText('KES 500,000 – KES 20,000,000')
    ).toBeInTheDocument();
    expect(screen.getByText('AGPO: youth-owned')).toBeInTheDocument();
  });
});
