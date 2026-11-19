import { describe, expect, it } from 'vitest';
import { renderHook } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import organization from '~/lib/schema/__fixtures__/backend/organization.json';
import { candidateOnboardingSchema, orgDtoSchema } from '~/lib/schema';
import { useCreateCandidateWorkspace } from './mutations';

const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={new QueryClient()}>
    {children}
  </QueryClientProvider>
);

const candidate = {
  ...organization,
  name: 'Amina Otieno',
  account_type: 'candidate',
  goals: ['jobs'],
};

describe('a job seeker’s workspace', () => {
  it('is created as a candidate workspace, then saves the job preferences', async () => {
    const posted: unknown[] = [];
    const patched: unknown[] = [];
    server.use(
      http.post('*/api/organizations', async ({ request }) => {
        posted.push(await request.json());
        return HttpResponse.json(candidate, { status: 201 });
      }),
      http.patch(
        `*/api/organizations/${organization.id}/job-brief`,
        async ({ request }) => {
          patched.push(await request.json());
          return HttpResponse.json({});
        }
      )
    );
    const input = candidateOnboardingSchema.parse({
      name: 'Amina Otieno',
      country: 'KE',
      city: 'Nairobi',
      description: 'Backend developer, 4 years of Python.',
      headline: 'Backend developer',
      targetRoles: ['Backend developer'],
      seniority: ['mid'],
      workplaces: ['remote'],
      skills: ['Python', 'Django'],
      yearsExperience: '4',
    });
    const { result } = renderHook(() => useCreateCandidateWorkspace(), {
      wrapper,
    });
    const created = await result.current.mutateAsync(input);

    expect(created.view.isCandidate).toBe(true);
    expect(posted).toEqual([
      {
        account_type: 'candidate',
        name: 'Amina Otieno',
        country: 'KE',
        city: 'Nairobi',
        description: 'Backend developer, 4 years of Python.',
      },
    ]);
    expect(patched).toEqual([
      {
        headline: 'Backend developer',
        target_roles: ['Backend developer'],
        seniority: ['mid'],
        workplaces: ['remote'],
        skills: ['Python', 'Django'],
        years_experience: 4,
      },
    ]);
  });

  it('needs a name, a country, a summary and a job title', () => {
    const empty = candidateOnboardingSchema.safeParse({
      name: '',
      country: '',
      city: '',
      description: '',
      headline: '',
      targetRoles: [],
      seniority: [],
      workplaces: [],
      skills: [],
      yearsExperience: '',
    });
    expect(empty.success).toBe(false);
    const fields = empty.error?.issues.map((issue) => issue.path[0]);
    expect(fields).toEqual(
      expect.arrayContaining(['name', 'country', 'description', 'targetRoles'])
    );
  });

  it('reads the account type of a workspace', () => {
    expect(orgDtoSchema.parse(organization).isCandidate).toBe(false);
    expect(orgDtoSchema.parse(candidate).accountType).toBe('candidate');
  });
});
