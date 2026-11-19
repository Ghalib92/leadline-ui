import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import invitations from '~/lib/schema/__fixtures__/backend/invitations.json';
import { InviteSheet } from './invite-sheet';

const ORG = 'Kq7vB2mXp9Lt';
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({ org: { id: 'Kq7vB2mXp9Lt', name: 'Acme' } }),
}));

describe('InviteSheet', () => {
  it('sends the address you typed even if you never pressed Enter', async () => {
    const sent: string[] = [];
    server.use(
      http.post(
        `*/api/organizations/${ORG}/invitations`,
        async ({ request }) => {
          const { email } = (await request.json()) as { email: string };
          sent.push(email);
          return HttpResponse.json(
            { ...invitations.results[0], email },
            { status: 201 }
          );
        }
      )
    );
    const onOpenChange = vi.fn();
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={new QueryClient()}>
        <InviteSheet open onOpenChange={onOpenChange} />
      </QueryClientProvider>
    );

    await user.type(
      screen.getByPlaceholderText(/name@company\.com/),
      'ghalib@acme.co.ke'
    );
    await user.click(screen.getByRole('button', { name: 'Send invites' }));

    await waitFor(() => expect(sent).toEqual(['ghalib@acme.co.ke']));
    expect(screen.queryByText('Add at least one email')).toBeNull();
    await waitFor(() => expect(onOpenChange).toHaveBeenCalledWith(false));
  });
});
