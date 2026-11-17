import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import callList from '~/lib/schema/__fixtures__/backend/call_list.json';
import activity from '~/lib/schema/__fixtures__/backend/lead_activity.json';
import CallListPage from './o.$slug.calls';

const ORG = 'Kq7vB2mXp9Lt';
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    org: { id: 'Kq7vB2mXp9Lt' },
    role: 'member',
    can: () => true,
  }),
}));
vi.mock('~/lib/org/use-org-path', () => ({
  useOrgPath: () => (path: string) => `/o/acme${path}`,
}));

function renderPage(initial = '/o/acme/calls') {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[initial]}>
        <CallListPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('Call list', () => {
  it('lists leads to reach, with the pitch ready to send from your own apps', async () => {
    const views: string[] = [];
    server.use(
      http.get(`*/api/organizations/${ORG}/call-list`, ({ request }) => {
        views.push(new URL(request.url).searchParams.get('view') ?? '');
        return HttpResponse.json(callList);
      })
    );
    renderPage();
    const savannah = (
      await screen.findByRole('link', { name: 'Savannah Lodge' })
    ).closest('li')!;
    expect(views).toEqual(['to_contact']);
    expect(within(savannah).getByText('Asked us to call back')).toBeVisible();
    expect(
      within(savannah).getByText('Google Maps lists no website for it.')
    ).toBeInTheDocument();
    expect(
      within(savannah).getByRole('link', { name: /whatsapp/i })
    ).toHaveAttribute(
      'href',
      "https://wa.me/254700000001?text=Hello%20Savannah%20Lodge%2C%20I'm%20with%20Digital%20Appex."
    );
    expect(
      within(savannah)
        .getByRole('link', { name: /^email$/i })
        .getAttribute('href')
    ).toMatch(/^mailto:info@savannah\.co\.ke\?subject=Online%20booking/);

    const hibiscus = screen
      .getByRole('link', { name: 'Hibiscus Guest House' })
      .closest('li')!;
    expect(within(hibiscus).getByText('Not contacted')).toBeInTheDocument();
    expect(
      within(hibiscus).queryByRole('link', { name: /whatsapp/i })
    ).toBeNull();
    expect(
      within(hibiscus).getByRole('link', { name: 'try their website' })
    ).toBeInTheDocument();
  });

  it('switches views', async () => {
    const views: string[] = [];
    server.use(
      http.get(`*/api/organizations/${ORG}/call-list`, ({ request }) => {
        views.push(new URL(request.url).searchParams.get('view') ?? '');
        return HttpResponse.json({ ...callList, count: 0, results: [] });
      })
    );
    const user = userEvent.setup();
    renderPage();
    expect(await screen.findByText(/Approve client leads/)).toBeInTheDocument();
    await user.click(screen.getByRole('tab', { name: 'Follow up' }));
    await waitFor(() => expect(views).toEqual(['to_contact', 'follow_up']));
  });

  it('logs what happened from the list', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.get(`*/api/organizations/${ORG}/call-list`, () =>
        HttpResponse.json(callList)
      ),
      http.post(
        `*/api/organizations/${ORG}/opportunities/Kp9Hd2Ls6Tz4/activity`,
        async ({ request }) => {
          sent = (await request.json()) as Record<string, unknown>;
          return HttpResponse.json(activity[1], { status: 201 });
        }
      )
    );
    const user = userEvent.setup();
    renderPage();
    const hibiscus = (
      await screen.findByRole('link', { name: 'Hibiscus Guest House' })
    ).closest('li')!;
    await user.click(within(hibiscus).getByRole('button', { name: /log/i }));
    const dialog = await screen.findByRole('dialog');
    // The second picker in the form: "What happened".
    const pickers = dialog.querySelectorAll<HTMLElement>(
      '[aria-haspopup="listbox"]'
    );
    await user.click(pickers[1]);
    await user.click(await screen.findByRole('option', { name: 'No answer' }));
    await user.click(within(dialog).getByRole('button', { name: 'Log it' }));
    await waitFor(() => expect(sent).toBeDefined());
    expect(sent).toEqual({
      channel: 'call',
      outcome: 'no_answer',
      note: '',
      follow_up_on: null,
    });
  });
});
