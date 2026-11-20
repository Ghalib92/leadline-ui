import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import { SourcesTab } from './sources-tab';

const ORG = 'Kq7vB2mXp9Lt';
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    view: { id: 'Kq7vB2mXp9Lt', myRole: 'admin', isArchived: false },
  }),
}));

describe('adding sources', () => {
  it('adds several in one go', async () => {
    const added: string[] = [];
    server.use(
      http.get(`*/api/organizations/${ORG}/sources`, () =>
        HttpResponse.json([])
      ),
      http.post(`*/api/organizations/${ORG}/sources`, async ({ request }) => {
        const body = (await request.json()) as { url: string };
        added.push(body.url);
        return HttpResponse.json(
          {
            id: `s${added.length}`,
            url: body.url,
            label: '',
            notes: '',
            enabled: true,
            created_at: '2026-10-21T00:00:00Z',
            updated_at: '2026-10-21T00:00:00Z',
          },
          { status: 201 }
        );
      })
    );
    const onClose = vi.fn();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <SourcesTab editing="source" setEditing={onClose} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    const user = userEvent.setup();
    await user.type(
      await screen.findByRole('textbox', { name: /^link/i }),
      'https://a.example.org/calls'
    );
    await user.click(screen.getByRole('button', { name: /add another/i }));
    const urls = screen.getAllByRole('textbox', { name: /^link/i });
    await user.type(urls[1], 'https://b.example.org/rfps');
    await user.click(screen.getByRole('button', { name: 'Add 2 sources' }));
    await waitFor(() => expect(onClose).toHaveBeenCalledWith(null));
    expect(added).toEqual([
      'https://a.example.org/calls',
      'https://b.example.org/rfps',
    ]);
  });
});
