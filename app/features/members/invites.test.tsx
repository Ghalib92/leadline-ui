import { describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import invitations from '~/lib/schema/__fixtures__/backend/invitations.json';
import { useInviteMembers, useInvites } from './index';

const ORG = 'Kq7vB2mXp9Lt';
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

describe('invitation hooks', () => {
  it('invites a batch; existing members and duplicates are skipped', async () => {
    server.use(
      http.post(
        `*/api/organizations/${ORG}/invitations`,
        async ({ request }) => {
          const { email } = (await request.json()) as { email: string };
          if (email === 'amina.otieno@example.org') {
            return HttpResponse.json(
              { email: ['This person is already a member.'] },
              { status: 400 }
            );
          }
          return HttpResponse.json(
            { ...invitations.results[0], email },
            { status: 201 }
          );
        }
      )
    );
    const { result } = renderHook(() => useInviteMembers(ORG), { wrapper });
    const outcome = await result.current.mutateAsync({
      emails: ['fresh@mto.org', 'amina.otieno@example.org'],
      role: 'member',
    });
    expect(outcome.created.map((i) => i.email)).toEqual(['fresh@mto.org']);
    expect(outcome.skipped).toEqual(['amina.otieno@example.org']);
  });

  it('lists pending invitations in the Team page shape', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/invitations`, ({ request }) => {
        expect(new URL(request.url).searchParams.get('status')).toBe('pending');
        return HttpResponse.json(invitations);
      })
    );
    const { result } = renderHook(() => useInvites(ORG), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data![0]).toMatchObject({
      orgId: ORG,
      email: 'grace@mto.org',
      role: 'member',
      status: 'pending',
    });
  });
});
