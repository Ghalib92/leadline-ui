import { describe, expect, it } from 'vitest';
import {
  documentUploadFormSchema,
  onboardingFormSchema,
  orgDtoSchema,
  orgProfileFormSchema,
  paginated,
  preferencesDtoSchema,
  preferencesFormSchema,
  setupStatusSchema,
  toMyOrg,
  toOrgWrite,
  toPreferencesWrite,
} from './organization.schema';

// Captured from the running backend (POST /organizations/).
const backendOrg = {
  id: 'LSLX8YNC2hW8',
  slug: 'e2e-test-org-LSLX8YNC2hW8',
  name: 'E2E Test Org',
  legal_name: '',
  organization_type: '',
  registration_number: '',
  year_founded: null,
  team_size: '',
  annual_budget: '',
  website: '',
  contact_email: '',
  phone: '',
  country: '',
  city: '',
  address: '',
  description: '',
  mission: '',
  vision: '',
  offerings: '',
  target_beneficiaries: '',
  track_record: '',
  past_funding: '',
  industry: '',
  sectors: [],
  sdgs: [],
  operating_countries: [],
  languages: [],
  created_by: 'bb6c8275-042',
  created_at: '2026-09-25T04:21:11.339757+03:00',
  updated_at: '2026-09-25T04:21:11.339770+03:00',
  archived_at: null,
  is_archived: false,
  active_member_count: 1,
  my_membership: {
    id: 'pA5ZhhQcLdQk',
    role: 'admin',
    status: 'active',
    joined_at: '2026-09-25T04:21:11.341352+03:00',
  },
};

describe('orgDtoSchema', () => {
  it('maps the backend payload to the view model', () => {
    const view = orgDtoSchema.parse({
      ...backendOrg,
      organization_type: 'ngo',
      sdgs: [3, 6],
      year_founded: 2019,
    });
    expect(view).toMatchObject({
      id: 'LSLX8YNC2hW8',
      slug: 'e2e-test-org-LSLX8YNC2hW8',
      name: 'E2E Test Org',
      isArchived: false,
      archivedAt: null,
      memberCount: 1,
      myRole: 'admin',
      createdBy: 'bb6c8275-042',
      profile: {
        organizationType: 'ngo',
        sdgs: [3, 6],
        yearFounded: 2019,
        sectors: [],
      },
    });
  });

  it('parses a DRF page', () => {
    const page = paginated(orgDtoSchema).parse({
      count: 1,
      next: null,
      previous: null,
      results: [backendOrg],
    });
    expect(page.results[0].name).toBe('E2E Test Org');
  });
});

describe('profile form → write body', () => {
  it('snake-cases and blanks optional fields', () => {
    const form = orgProfileFormSchema.parse({
      name: ' Kijani ',
      organizationType: 'ngo',
      website: '',
      yearFounded: 2019,
      sectors: ['health'],
      sdgs: [3],
    });
    expect(toOrgWrite(form)).toMatchObject({
      name: 'Kijani',
      organization_type: 'ngo',
      website: '',
      year_founded: 2019,
      sectors: ['health'],
      sdgs: [3],
    });
  });

  it('only sends the fields a section edits', () => {
    expect(toOrgWrite({ mission: 'Clean water' })).toEqual({
      mission: 'Clean water',
    });
  });

  it('checks backend limits', () => {
    const bad = orgProfileFormSchema.safeParse({
      name: 'x',
      website: 'not a url',
      yearFounded: 1700,
      contactEmail: 'nope',
    });
    expect(bad.success).toBe(false);
    const keys = bad.error!.issues.map((i) => i.path[0]);
    expect(keys).toEqual(
      expect.arrayContaining(['website', 'yearFounded', 'contactEmail'])
    );
  });
});

describe('preferences', () => {
  it('reads DRF decimal strings as numbers', () => {
    const view = preferencesDtoSchema.parse({
      opportunity_types: ['grant'],
      geographic_scopes: ['national'],
      target_countries: ['KE'],
      target_regions: ['east_africa'],
      focus_areas: [],
      keywords: [],
      excluded_keywords: [],
      preferred_funders: [],
      excluded_funders: [],
      eligibility: [],
      min_funding_amount: '10000.00',
      max_funding_amount: null,
      funding_currency: 'USD',
      open_to_partnerships: true,
      can_provide_cofunding: false,
      eligibility_notes: '',
      additional_context: '',
      updated_at: '2026-09-25T00:00:00Z',
    });
    expect(view.minFundingAmount).toBe(10000);
    expect(view.maxFundingAmount).toBeNull();
    expect(view.opportunityTypes).toEqual(['grant']);
  });

  it('puts a min > max error under the maximum', () => {
    const res = preferencesFormSchema.safeParse({
      minFundingAmount: 50000,
      maxFundingAmount: 1000,
    });
    expect(res.success).toBe(false);
    expect(res.error!.issues[0].path).toEqual(['maxFundingAmount']);
  });

  it('writes snake_case with upper-case currency', () => {
    expect(
      toPreferencesWrite({
        opportunityTypes: ['grant'],
        fundingCurrency: 'kes',
      })
    ).toEqual({ opportunity_types: ['grant'], funding_currency: 'KES' });
  });
});

describe('setup status', () => {
  it('camel-cases the checklist', () => {
    const s = setupStatusSchema.parse({
      steps: [{ key: 'basics', label: 'x', required: true, done: false }],
      completed: 0,
      total: 6,
      percent: 0,
      ready_for_matching: false,
    });
    expect(s.readyForMatching).toBe(false);
  });
});

describe('onboarding form', () => {
  const emptyLists = {
    sectors: [],
    opportunityTypes: [],
    geographicScopes: [],
    targetRegions: [],
    services: [],
    customerTypes: [],
    targetCities: [],
    tenderCategories: [],
  };
  const missing = (input: Record<string, unknown>) =>
    onboardingFormSchema
      .safeParse({
        name: 'Kijani',
        inviteEmails: [],
        inviteRole: 'member',
        ...emptyLists,
        ...input,
      })
      .error!.issues.map((i) => i.path[0]);

  it('requires the backend setup basics, focus and preferences', () => {
    expect(missing({ goals: ['grants'] })).toEqual(
      expect.arrayContaining([
        'organizationType',
        'country',
        'description',
        'sectors',
        'opportunityTypes',
        'geographicScopes',
      ])
    );
    expect(missing({})).toContain('goals');
  });

  it('asks only the questions of the goals picked', () => {
    const clients = missing({ goals: ['clients'] });
    expect(clients).toEqual(
      expect.arrayContaining(['services', 'customerTypes'])
    );
    expect(clients).not.toContain('opportunityTypes');
    expect(clients).not.toContain('tenderCategories');

    const tenders = missing({ goals: ['tenders'] });
    expect(tenders).toContain('tenderCategories');
    expect(tenders).not.toContain('services');
    expect(tenders).not.toContain('geographicScopes');
  });
});

describe('goals', () => {
  it('reads what the organization wants to find, none before onboarding', () => {
    expect(orgDtoSchema.parse(backendOrg).profile.goals).toEqual([]);
    const view = orgDtoSchema.parse({
      ...backendOrg,
      goals: ['clients', 'tenders'],
    });
    expect(view.profile.goals).toEqual(['clients', 'tenders']);
  });

  it('needs at least one known goal when edited', () => {
    expect(orgProfileFormSchema.safeParse({ goals: [] }).success).toBe(false);
    expect(orgProfileFormSchema.safeParse({ goals: ['jobs'] }).success).toBe(
      false
    );
    const form = orgProfileFormSchema.parse({ goals: ['grants'] });
    expect(toOrgWrite(form)).toEqual({ goals: ['grants'] });
  });
});

describe('document upload form', () => {
  const file = (name: string) =>
    new File([new Uint8Array(1)], name, { type: 'application/octet-stream' });
  it('rejects unsupported extensions and oversized files', () => {
    expect(
      documentUploadFormSchema.safeParse({
        title: 'x',
        category: 'other',
        folderId: 'f1',
        file: file('a.exe'),
      }).success
    ).toBe(false);
    const big = file('a.pdf');
    Object.defineProperty(big, 'size', { value: 26 * 1024 * 1024 });
    expect(
      documentUploadFormSchema.safeParse({
        title: 'x',
        category: 'other',
        folderId: 'f1',
        file: big,
      }).success
    ).toBe(false);
    expect(
      documentUploadFormSchema.safeParse({
        title: 'x',
        category: 'other',
        folderId: 'f1',
        file: file('a.PDF'),
      }).success
    ).toBe(true);
    expect(
      documentUploadFormSchema.safeParse({
        title: 'x',
        category: 'other',
        file: file('a.pdf'),
      }).success
    ).toBe(false); // no folder
  });
});

describe('toMyOrg (legacy bridge)', () => {
  it('maps onto the legacy UI vocabulary', () => {
    const view = orgDtoSchema.parse({
      ...backendOrg,
      sectors: ['health'],
      country: 'KE',
    });
    const prefs = preferencesDtoSchema.parse({
      opportunity_types: ['rfp', 'grant'],
      target_regions: ['east_africa', 'europe'],
      geographic_scopes: [],
      funding_currency: 'USD',
      open_to_partnerships: true,
      can_provide_cofunding: false,
    });
    expect(toMyOrg(view, prefs)).toEqual({
      role: 'admin',
      org: expect.objectContaining({
        id: 'LSLX8YNC2hW8',
        slug: 'e2e-test-org-LSLX8YNC2hW8',
        country: 'KE',
        sectors: ['health'],
        regions: ['east-africa'],
        opportunityTypes: ['tender', 'grant'],
      }),
    });
  });
});

describe('empty number inputs', () => {
  it('treat a cleared number field as "no value"', () => {
    expect(
      orgProfileFormSchema.parse({ yearFounded: '' }).yearFounded
    ).toBeNull();
    expect(
      preferencesFormSchema.parse({ minFundingAmount: '', maxFundingAmount: 5 })
    ).toMatchObject({ minFundingAmount: null, maxFundingAmount: 5 });
  });
});

describe('onboarding focus step', () => {
  const base = {
    name: 'Kijani',
    organizationType: 'ngo',
    country: 'KE',
    goals: ['grants'],
    description: 'x',
    sectors: ['health'],
    opportunityTypes: ['grant'],
    geographicScopes: ['national'],
    targetRegions: [],
    services: [],
    customerTypes: [],
    targetCities: [],
    tenderCategories: [],
    inviteEmails: [],
    inviteRole: 'member',
  };
  it('needs a mission or offerings, like the backend focus step', () => {
    const res = onboardingFormSchema.safeParse({
      ...base,
      mission: '',
      offerings: '',
    });
    expect(res.success).toBe(false);
    expect(res.error!.issues[0].path).toEqual(['mission']);
    expect(
      onboardingFormSchema.safeParse({
        ...base,
        mission: '',
        offerings: 'Boreholes',
      }).success
    ).toBe(true);
  });
});

describe('onboarding invites', () => {
  it('drops duplicate emails (any case) so one typo can’t sink the whole creation', () => {
    const parsed = onboardingFormSchema.parse({
      name: 'Kijani',
      organizationType: 'ngo',
      country: 'KE',
      goals: ['grants'],
      description: 'x',
      mission: 'y',
      offerings: '',
      sectors: ['health'],
      opportunityTypes: ['grant'],
      geographicScopes: ['national'],
      targetRegions: [],
      services: [],
      customerTypes: [],
      targetCities: [],
      tenderCategories: [],
      inviteEmails: ['a@x.org', 'A@X.org ', 'b@x.org'],
      inviteRole: 'member',
    });
    expect(parsed.inviteEmails).toEqual(['a@x.org', 'b@x.org']);
  });
});
