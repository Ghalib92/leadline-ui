import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import { extractError } from '~/lib/utils/extract-error';
import members from '~/lib/schema/__fixtures__/backend/members.json';
import { useMembers, useRemoveMember, useUpdateMemberRole } from './index';

const ORG = 'Kq7vB2mXp9Lt';
const brian = members.results[1];
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient();
});

describe('member roster', () => {
  it('maps the backend memberships and hides removed ones', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/members`, () =>
        HttpResponse.json({
          ...members,
          results: [
            ...members.results,
            { ...brian, id: 'gone', status: 'removed' },
          ],
        })
      )
    );
    const { result } = renderHook(() => useMembers(ORG), { wrapper });
    await waitFor(() => expect(result.current.data).toBeDefined());
    expect(result.current.data).toEqual([
      expect.objectContaining({
        name: 'Amina Otieno',
        email: 'amina.otieno@example.org',
        role: 'admin',
        status: 'active',
      }),
      expect.objectContaining({ id: brian.id, role: 'member' }),
    ]);
  });

  it('changes a role and refreshes the roster', async () => {
    let body: unknown;
    server.use(
      http.patch(
        `*/api/organizations/${ORG}/members/${brian.id}`,
        async ({ request }) => {
          body = await request.json();
          return HttpResponse.json({ ...brian, role: 'admin' });
        }
      )
    );
    client.setQueryData(['members', ORG, 'list'], []);
    const { result } = renderHook(() => useUpdateMemberRole(ORG), { wrapper });
    const updated = await result.current.mutateAsync({
      memberId: brian.id,
      role: 'admin',
    });
    expect(body).toEqual({ role: 'admin' });
    expect(updated.role).toBe('admin');
    expect(client.getQueryState(['members', ORG, 'list'])?.isInvalidated).toBe(
      true
    );
  });

  it('removes a member', async () => {
    let removed = false;
    server.use(
      http.delete(`*/api/organizations/${ORG}/members/${brian.id}`, () => {
        removed = true;
        return new HttpResponse(null, { status: 204 });
      })
    );
    const { result } = renderHook(() => useRemoveMember(ORG), { wrapper });
    await result.current.mutateAsync(brian.id);
    expect(removed).toBe(true);
  });

  it("surfaces the backend's reason when the last admin can't be demoted", async () => {
    server.use(
      http.patch(`*/api/organizations/${ORG}/members/:id`, () =>
        HttpResponse.json(
          { detail: 'An organization needs at least one admin.' },
          { status: 409 }
        )
      )
    );
    const { result } = renderHook(() => useUpdateMemberRole(ORG), { wrapper });
    const error = await result.current
      .mutateAsync({ memberId: members.results[0].id, role: 'member' })
      .catch((e: unknown) => e);
    expect(extractError(error)).toBe(
      'An organization needs at least one admin.'
    );
  });
});
