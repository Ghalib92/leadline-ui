import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import organization from '~/lib/schema/__fixtures__/backend/organization.json';
import type { OnboardingForm } from '~/lib/schema';
import { useCreateOrg } from './mutations';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const form: OnboardingForm = {
  name: 'Mto Water Trust',
  organizationType: 'ngo',
  country: 'KE',
  goals: ['grants'],
  description: 'Rural water points',
  mission: 'Safe water for all',
  offerings: '',
  sectors: ['wash'],
  opportunityTypes: ['grant'],
  geographicScopes: ['national'],
  targetRegions: [],
  services: [],
  customerTypes: [],
  targetCities: [],
  tenderCategories: [],
  inviteEmails: ['wanjiru@mto.org', 'otieno@mto.org'],
  inviteRole: 'admin',
};

describe('useCreateOrg', () => {
  it('sends the team invites inside the create request (one atomic call)', async () => {
    const bodies: unknown[] = [];
    server.use(
      http.post('*/api/organizations', async ({ request }) => {
        bodies.push(await request.json());
        return HttpResponse.json(organization, { status: 201 });
      }),
      http.patch(`*/api/organizations/${organization.id}/preferences`, () =>
        HttpResponse.json({})
      )
    );
    const { result } = renderHook(() => useCreateOrg(), { wrapper });
    const created = await result.current.mutateAsync(form);

    expect(created.failed).toEqual([]);
    expect(created.view.id).toBe(organization.id);
    expect(bodies).toEqual([
      expect.objectContaining({
        name: 'Mto Water Trust',
        goals: ['grants'],
        invitations: [
          { email: 'wanjiru@mto.org', role: 'admin' },
          { email: 'otieno@mto.org', role: 'admin' },
        ],
      }),
    ]);
  });

  it('saves the brief of each goal picked, and only those', async () => {
    const patched: Record<string, unknown> = {};
    server.use(
      http.post('*/api/organizations', () =>
        HttpResponse.json(organization, { status: 201 })
      ),
      http.patch(
        `*/api/organizations/${organization.id}/:brief`,
        async ({ request, params }) => {
          patched[params.brief as string] = await request.json();
          return HttpResponse.json({});
        }
      )
    );
    const { result } = renderHook(() => useCreateOrg(), { wrapper });
    const created = await result.current.mutateAsync({
      ...form,
      goals: ['clients', 'tenders'],
      services: [{ name: 'Websites', description: '', price: 'From KES 40k' }],
      customerTypes: ['hospitality'],
      targetCities: ['Nairobi'],
      tenderCategories: ['consultancy'],
    });

    expect(created.failed).toEqual([]);
    expect(Object.keys(patched).sort()).toEqual([
      'client-brief',
      'tender-brief',
    ]);
    expect(patched['client-brief']).toEqual({
      services: [{ name: 'Websites', description: '', price: 'From KES 40k' }],
      customer_types: ['hospitality'],
      target_cities: ['Nairobi'],
    });
    expect(patched['tender-brief']).toEqual({ categories: ['consultancy'] });
  });

  it('names a brief that did not save, so the checklist can finish it', async () => {
    server.use(
      http.post('*/api/organizations', () =>
        HttpResponse.json(organization, { status: 201 })
      ),
      http.patch(`*/api/organizations/${organization.id}/tender-brief`, () =>
        HttpResponse.json({ detail: 'Oops' }, { status: 500 })
      )
    );
    const { result } = renderHook(() => useCreateOrg(), { wrapper });
    const created = await result.current.mutateAsync({
      ...form,
      goals: ['tenders'],
    });
    expect(created.failed).toEqual(['tenders brief']);
  });

  it('rejects the whole creation when the backend refuses an invitation', async () => {
    server.use(
      http.post('*/api/organizations', () =>
        HttpResponse.json(
          { invitations: ['Duplicate email in invitations.'] },
          { status: 400 }
        )
      )
    );
    const { result } = renderHook(() => useCreateOrg(), { wrapper });
    await expect(
      result.current.mutateAsync({
        ...form,
        inviteEmails: ['a@x.org', 'A@X.org'],
      })
    ).rejects.toMatchObject({ response: { status: 400 } });
  });
});
