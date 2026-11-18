import { describe, expect, it } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import bid from '~/lib/schema/__fixtures__/backend/bid.json';
import { proposalDtoSchema } from '~/lib/schema';
import { BidChecklist } from './bid-checklist';

const ORG = 'Kq7vB2mXp9Lt';
const proposal = proposalDtoSchema.parse(bid);
const BASE = `*/api/organizations/${ORG}/proposals/${proposal.id}`;

function renderChecklist(busy = false) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/o/appex/opportunities/x/proposal']}>
        <Routes>
          <Route
            path="/o/:slug/opportunities/:id/proposal"
            element={
              <BidChecklist
                orgId={ORG}
                oppId={proposal.opportunity.id}
                proposal={proposal}
                busy={busy}
              />
            }
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('BidChecklist', () => {
  it('shows each requirement with its verdict and your documents', () => {
    renderChecklist();
    expect(
      screen.getByText('1 of 12 in hand', { exact: false })
    ).toBeInTheDocument();
    const first = screen.getAllByRole('listitem')[0];
    expect(within(first).getByText('Check')).toBeInTheDocument();
    expect(
      within(first).getByText(
        'Certificate of Incorporation - Digital Appex Ltd'
      )
    ).toBeInTheDocument();
    expect(
      within(first).getByText(/Confirm issuance date/)
    ).toBeInTheDocument();
    // The bid bond was ticked: in hand, struck through, no verdict.
    expect(screen.getByText('In hand')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /upload documents/i })
    ).toHaveAttribute('href', '/o/appex/settings/general?tab=documents');
  });

  it('ticks an item as in hand', async () => {
    let sent: unknown;
    server.use(
      http.patch(`${BASE}/checklist/r2`, async ({ request }) => {
        sent = await request.json();
        return HttpResponse.json(bid);
      })
    );
    renderChecklist();
    const user = userEvent.setup();
    await user.click(
      screen.getByRole('checkbox', { name: /In hand: .*Tax Compliance/ })
    );
    await waitFor(() => expect(sent).toEqual({ done: true }));
  });

  it('rechecks documents, but not while the AI is working', async () => {
    let posted = false;
    server.use(
      http.post(`${BASE}/checklist/recheck`, () => {
        posted = true;
        return HttpResponse.json(bid, { status: 202 });
      })
    );
    renderChecklist();
    await userEvent
      .setup()
      .click(screen.getByRole('button', { name: /recheck documents/i }));
    await waitFor(() => expect(posted).toBe(true));
  });

  it('disables the recheck while busy', () => {
    renderChecklist(true);
    expect(
      screen.getByRole('button', { name: /recheck documents/i })
    ).toBeDisabled();
  });
});
