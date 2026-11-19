import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  documentCategories,
  documentExtensions,
  documentMaxMb,
  geographicScopes,
  goalOptions,
  organizationGoalOptions,
  linkKinds,
  opportunityKinds,
  targetRegions,
  eligibilityOptions,
  toFeedTypes,
  toLegacyRegions,
  businessCategories,
  tenderCategories,
} from '~/data/org-taxonomy';
import { enumValues } from '~/data/taxonomy';
import { serviceSchema } from './brief.schema';
import type { MyOrg } from './org.schema';

/**
 * The backend's organization contract (`/organizations/…`, snake_case) and
 * the camelCase view model the UI uses. DTOs are parsed and mapped here, at
 * the edge, so components never see snake_case.
 */

const longTextMax = 5000;
const snake = (key: string) =>
  key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);
const camel = (key: string) =>
  key.replace(/_([a-z])/g, (_, c: string) => c.toUpperCase());

/** DRF page. */
export const paginated = <T extends z.ZodType>(item: T) =>
  z.object({
    count: z.number(),
    next: z.string().nullable(),
    previous: z.string().nullable(),
    results: z.array(item),
  });

// ---- Organization -----------------------------------------------------------

export const profileKeys = [
  'name',
  'legalName',
  'organizationType',
  'registrationNumber',
  'yearFounded',
  'teamSize',
  'annualBudget',
  'website',
  'contactEmail',
  'phone',
  'country',
  'city',
  'address',
  'description',
  'mission',
  'vision',
  'offerings',
  'targetBeneficiaries',
  'trackRecord',
  'pastFunding',
  'industry',
  'sectors',
  'sdgs',
  'operatingCountries',
  'languages',
  'goals',
] as const;
export type ProfileKey = (typeof profileKeys)[number];

export interface OrgProfile {
  name: string;
  legalName: string;
  organizationType: string;
  registrationNumber: string;
  yearFounded: number | null;
  teamSize: string;
  annualBudget: string;
  website: string;
  contactEmail: string;
  phone: string;
  country: string;
  city: string;
  address: string;
  description: string;
  mission: string;
  vision: string;
  offerings: string;
  targetBeneficiaries: string;
  trackRecord: string;
  pastFunding: string;
  industry: string;
  sectors: string[];
  sdgs: number[];
  operatingCountries: string[];
  languages: string[];
  /** What it wants to find; empty until chosen. */
  goals: Goal[];
}

const text = z.string().default('');

export const goalSchema = z.enum(enumValues(goalOptions));
export type Goal = z.infer<typeof goalSchema>;
/** What an organization can pick in its forms (a job seeker's goal is jobs, set
 * for them). */
const goalsField = z
  .array(z.enum(enumValues(organizationGoalOptions)))
  .min(1, 'Pick at least one thing to find')
  .max(organizationGoalOptions.length);
const list = <T extends z.ZodType>(item: T) => z.array(item).default([]);

export const orgDtoSchema = z
  .object({
    id: z.string(),
    slug: z.string(),
    name: z.string(),
    legal_name: text,
    organization_type: text,
    registration_number: text,
    year_founded: z.number().nullable().default(null),
    team_size: text,
    annual_budget: text,
    website: text,
    contact_email: text,
    phone: text,
    country: text,
    city: text,
    address: text,
    description: text,
    mission: text,
    vision: text,
    offerings: text,
    target_beneficiaries: text,
    track_record: text,
    past_funding: text,
    industry: text,
    sectors: list(z.string()),
    sdgs: list(z.number()),
    operating_countries: list(z.string()),
    languages: list(z.string()),
    goals: list(goalSchema),
    // A job seeker's workspace is their own: jobs, their CV, no team.
    account_type: z.enum(['organization', 'candidate']).catch('organization'),
    created_by: z.string().nullable(),
    created_at: z.string(),
    archived_at: z.string().nullable(),
    is_archived: z.boolean(),
    active_member_count: z.number(),
    my_membership: z
      .object({ id: z.string(), role: z.enum(['admin', 'member']) })
      .nullable(),
  })
  .transform((dto) => {
    const profile = Object.fromEntries(
      profileKeys.map((key) => [key, dto[snake(key) as keyof typeof dto]])
    ) as unknown as OrgProfile;
    return {
      id: dto.id,
      slug: dto.slug,
      name: dto.name,
      accountType: dto.account_type,
      isCandidate: dto.account_type === 'candidate',
      createdAt: dto.created_at,
      createdBy: dto.created_by,
      archivedAt: dto.archived_at,
      isArchived: dto.is_archived,
      memberCount: dto.active_member_count,
      myRole: dto.my_membership?.role ?? null,
      profile,
    };
  });
export type OrgView = z.infer<typeof orgDtoSchema>;

const blankOr = <T extends z.ZodType>(schema: T) =>
  z.union([z.literal(''), schema]);
const longText = z
  .string()
  .trim()
  .max(longTextMax, 'Keep it under 5,000 characters');
const currentYear = new Date().getFullYear();

/** Number inputs write `''` when cleared: that means "no value". */
const nullableNumber = <T extends z.ZodType>(schema: T) =>
  z.preprocess((v) => (v === '' ? null : v), schema.nullable());

/** Every editable profile field; sections validate the subset they edit. */
export const orgProfileFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter the organization name').max(200),
    legalName: z.string().trim().max(255),
    organizationType: z.string(),
    registrationNumber: z.string().trim().max(100),
    yearFounded: nullableNumber(
      z
        .number()
        .int()
        .min(1800, 'Enter a valid founding year')
        .max(currentYear, 'Enter a valid founding year')
    ),
    teamSize: z.string(),
    annualBudget: z.string(),
    website: blankOr(
      z.url('Enter a full URL, e.g. https://example.org').max(500)
    ),
    contactEmail: blankOr(z.email('Enter a valid email address')),
    phone: z.string().trim().max(30),
    country: blankOr(z.string().regex(/^[A-Z]{2}$/, 'Choose a country')),
    city: z.string().trim().max(100),
    address: z.string().trim().max(500),
    description: longText,
    mission: longText,
    vision: longText,
    offerings: longText,
    targetBeneficiaries: longText,
    trackRecord: longText,
    pastFunding: longText,
    industry: z.string().trim().max(100),
    sectors: z.array(z.string().trim().min(1).max(100)).max(50),
    sdgs: z.array(z.number().int().min(1).max(17)).max(17),
    operatingCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(250),
    languages: z.array(z.string().regex(/^[a-z]{2}$/)).max(30),
    goals: goalsField,
  })
  .partial();
export type OrgProfileForm = z.infer<typeof orgProfileFormSchema>;
export type OrgProfileFormInput = z.input<typeof orgProfileFormSchema>;

/** Only the keys given, snake-cased: a section edit never clears other fields. */
export function toOrgWrite(form: OrgProfileForm): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(form)
      .filter(
        ([key, value]) =>
          value !== undefined &&
          (profileKeys as readonly string[]).includes(key)
      )
      .map(([key, value]) => [snake(key), value])
  );
}

// ---- Onboarding --------------------------------------------------------------

const opportunityKind = z.enum(enumValues(opportunityKinds));
const geographicScope = z.enum(enumValues(geographicScopes));
const targetRegion = z.enum(enumValues(targetRegions));

/** A list the backend's setup step for `goal` needs, required only when the
 * organization picked that goal. Runs even while other fields are invalid, so
 * each step shows its own errors. */
function needs(
  goal: Goal,
  field: string,
  message: string
): [
  (v: Record<string, unknown>) => boolean,
  { message: string; path: PropertyKey[]; when: () => boolean },
] {
  return [
    (v) =>
      !(v.goals as Goal[] | undefined)?.includes(goal) ||
      ((v[field] as unknown[] | undefined)?.length ?? 0) > 0,
    { message, path: [field], when: () => true },
  ];
}

/** Required = the backend's required setup steps: basics, focus and the brief of
 * each goal picked (grant preferences, the clients brief, the tenders brief). */
export const onboardingFormSchema = z
  .object({
    name: z.string().trim().min(1, 'Enter the organization name').max(200),
    organizationType: z.string().min(1, 'Choose an organization type'),
    country: z.string().regex(/^[A-Z]{2}$/, 'Choose a country'),
    goals: goalsField,
    description: z
      .string()
      .trim()
      .min(1, 'Describe your organization in a sentence or two')
      .max(longTextMax),
    mission: longText,
    offerings: longText,
    sectors: z
      .array(z.string().trim().min(1).max(100))
      .min(1, 'Pick at least one sector')
      .max(50),
    // What you're after: only the picked goals' questions are required (below).
    opportunityTypes: z.array(opportunityKind),
    geographicScopes: z.array(geographicScope),
    targetRegions: z.array(targetRegion),
    services: z.array(serviceSchema).max(20, 'Add up to 20 services'),
    customerTypes: z.array(z.enum(enumValues(businessCategories))),
    targetCities: z.array(z.string().trim().min(1).max(100)).max(50),
    tenderCategories: z.array(z.enum(enumValues(tenderCategories))),
    // Normalized and de-duplicated: the backend rejects the whole creation if
    // any invitation is invalid, duplicates included.
    inviteEmails: z
      .array(
        z
          .string()
          .trim()
          .toLowerCase()
          .pipe(z.email('Enter valid email addresses'))
      )
      .max(20, 'Invite up to 20 people at once')
      .transform((emails) => [...new Set(emails)]),
    inviteRole: z.enum(['admin', 'member']),
  })
  .refine((v) => !!(v.mission?.trim() || v.offerings?.trim()), {
    message: 'Add your mission or what you offer — agents need one of them',
    path: ['mission'],
    // Check it on the "What you do" step too, before later steps are filled in.
    when: () => true,
  })
  .refine(...needs('grants', 'opportunityTypes', 'Pick at least one opportunity type'))
  .refine(...needs('grants', 'geographicScopes', 'Pick at least one scope'))
  .refine(...needs('clients', 'services', 'Add at least one thing you sell'))
  .refine(...needs('clients', 'customerTypes', 'Pick at least one kind of customer'))
  .refine(...needs('tenders', 'tenderCategories', 'Pick at least one kind of tender')); // prettier-ignore
export type OnboardingForm = z.infer<typeof onboardingFormSchema>;

// ---- Preferences ------------------------------------------------------------

const money = z
  .union([z.string(), z.number()])
  .nullable()
  .default(null)
  .transform((v) => (v === null || v === '' ? null : Number(v)));

export const preferencesDtoSchema = z
  .object({
    opportunity_types: list(z.string()),
    geographic_scopes: list(z.string()),
    target_countries: list(z.string()),
    target_regions: list(z.string()),
    focus_areas: list(z.string()),
    keywords: list(z.string()),
    excluded_keywords: list(z.string()),
    preferred_funders: list(z.string()),
    excluded_funders: list(z.string()),
    eligibility: list(z.string()),
    min_funding_amount: money,
    max_funding_amount: money,
    funding_currency: z.string().default('USD'),
    open_to_partnerships: z.boolean().default(true),
    can_provide_cofunding: z.boolean().default(false),
    eligibility_notes: text,
    additional_context: text,
    updated_at: z.string().optional(),
  })
  .transform((dto) =>
    Object.fromEntries(
      Object.entries(dto).map(([key, value]) => [camel(key), value])
    )
  ) as unknown as z.ZodType<PreferencesView>;

export interface PreferencesView {
  opportunityTypes: string[];
  geographicScopes: string[];
  targetCountries: string[];
  targetRegions: string[];
  focusAreas: string[];
  keywords: string[];
  excludedKeywords: string[];
  preferredFunders: string[];
  excludedFunders: string[];
  eligibility: string[];
  minFundingAmount: number | null;
  maxFundingAmount: number | null;
  fundingCurrency: string;
  openToPartnerships: boolean;
  canProvideCofunding: boolean;
  eligibilityNotes: string;
  additionalContext: string;
  updatedAt?: string;
}

const tagList = (max: number) =>
  z.array(z.string().trim().min(1).max(100)).max(max);
const amount = nullableNumber(z.number().min(0, 'Must be 0 or more'));

export const preferencesFormSchema = z
  .object({
    opportunityTypes: z.array(opportunityKind),
    geographicScopes: z.array(geographicScope),
    targetCountries: z.array(z.string().regex(/^[A-Z]{2}$/)).max(250),
    targetRegions: z.array(targetRegion),
    focusAreas: tagList(50),
    keywords: tagList(100),
    excludedKeywords: tagList(100),
    preferredFunders: tagList(50),
    excludedFunders: tagList(50),
    eligibility: z.array(z.enum(enumValues(eligibilityOptions))),
    minFundingAmount: amount,
    maxFundingAmount: amount,
    fundingCurrency: z
      .string()
      .regex(/^[A-Za-z]{3}$/, 'Use a 3-letter code, e.g. USD'),
    openToPartnerships: z.boolean(),
    canProvideCofunding: z.boolean(),
    eligibilityNotes: longText,
    additionalContext: longText,
  })
  .partial()
  .refine(
    (v) =>
      v.minFundingAmount == null ||
      v.maxFundingAmount == null ||
      v.minFundingAmount <= v.maxFundingAmount,
    {
      message: 'Must be greater than or equal to the minimum.',
      path: ['maxFundingAmount'],
    }
  );
export type PreferencesForm = z.infer<typeof preferencesFormSchema>;
export type PreferencesFormInput = z.input<typeof preferencesFormSchema>;

export function toPreferencesWrite(
  form: PreferencesForm
): Record<string, unknown> {
  return Object.fromEntries(
    Object.entries(form)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [
        snake(key),
        key === 'fundingCurrency' && typeof value === 'string'
          ? value.toUpperCase()
          : value,
      ])
  );
}

// ---- Setup checklist --------------------------------------------------------

export const setupStatusSchema = z
  .object({
    steps: z.array(
      z.object({
        key: z.string(),
        label: z.string(),
        required: z.boolean(),
        done: z.boolean(),
      })
    ),
    completed: z.number(),
    total: z.number(),
    percent: z.number(),
    ready_for_matching: z.boolean(),
  })
  .transform(({ ready_for_matching, ...rest }) => ({
    ...rest,
    readyForMatching: ready_for_matching,
  }));
export type SetupStatus = z.infer<typeof setupStatusSchema>;

// ---- Links & documents ------------------------------------------------------

export const linkDtoSchema = z
  .object({
    id: z.string(),
    kind: z.string(),
    url: z.string(),
    label: text,
    created_at: z.string().optional(),
  })
  .transform(({ created_at, ...rest }) => ({ ...rest, createdAt: created_at }));
export type OrgLink = z.infer<typeof linkDtoSchema>;

export const linkFormSchema = z.object({
  kind: z.enum(enumValues(linkKinds)),
  url: z.url('Enter a full URL, e.g. https://example.org').max(500),
  label: z.string().trim().max(100),
});
export type LinkForm = z.infer<typeof linkFormSchema>;

// ---- Sources ----------------------------------------------------------------

export const orgSourceDtoSchema = z
  .object({
    id: z.string(),
    url: z.string(),
    label: text,
    notes: text,
    enabled: z.boolean().default(true),
    created_at: z.string().optional(),
    updated_at: z.string().optional(),
  })
  .transform(({ created_at, updated_at, ...rest }) => ({
    ...rest,
    createdAt: created_at,
    updatedAt: updated_at,
  }));
export type OrgSource = z.infer<typeof orgSourceDtoSchema>;

export const orgSourceFormSchema = z.object({
  url: z.url('Enter a full URL, e.g. https://example.org/calls').max(500),
  label: z.string().trim().max(120),
  notes: z.string().trim().max(500),
  enabled: z.boolean(),
});
export type OrgSourceForm = z.infer<typeof orgSourceFormSchema>;

/**
 * Where the AI is with a document: text extraction, chunking and embedding.
 * `failed` is worth retrying; `unsupported` (images, legacy Office, scanned
 * PDFs) is not — the user should upload a PDF or Word version instead.
 */
export const documentProcessingStatuses = [
  'pending',
  'processing',
  'processed',
  'failed',
  'unsupported',
] as const;
export type DocumentProcessingStatus =
  (typeof documentProcessingStatuses)[number];

export const documentDtoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    description: text,
    category: z.string(),
    folder: z
      .object({ id: z.string(), name: z.string() })
      .nullable()
      .default(null),
    original_filename: z.string(),
    content_type: text,
    size: z.number(),
    // An unknown future status reads as "pending" rather than breaking the list.
    processing_status: z.enum(documentProcessingStatuses).catch('pending'),
    processing_error: text,
    processed_at: z.string().nullable().default(null),
    uploaded_by: z.string().nullable(),
    download_url: z.string(),
    created_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    title: dto.title,
    description: dto.description,
    category: dto.category,
    folder: dto.folder,
    fileName: dto.original_filename,
    contentType: dto.content_type,
    size: dto.size,
    processingStatus: dto.processing_status,
    processingError: dto.processing_error,
    processedAt: dto.processed_at,
    uploadedBy: dto.uploaded_by,
    createdAt: dto.created_at,
  }));
export type OrgDocument = z.infer<typeof documentDtoSchema>;

const extensionOf = (name: string) => {
  const dot = name.lastIndexOf('.');
  return dot === -1 ? '' : name.slice(dot).toLowerCase();
};

/** A named group of documents; agents read its purpose (`O/folders/`). */
export const folderDtoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    purpose: text,
    document_count: z.number().default(0),
  })
  .transform((dto) => ({
    id: dto.id,
    name: dto.name,
    purpose: dto.purpose,
    documentCount: dto.document_count,
  }));
export type KnowledgeFolder = z.infer<typeof folderDtoSchema>;

export const folderFormSchema = z.object({
  name: z.string().trim().min(1, 'Name the folder').max(100),
  purpose: z.string().trim().max(300),
});
export type FolderForm = z.infer<typeof folderFormSchema>;

export const documentUploadFormSchema = z.object({
  title: z.string().trim().min(1, 'Give the document a title').max(200),
  folderId: z.string().min(1, 'Choose a folder'),
  description: longText.optional(),
  category: z.enum(enumValues(documentCategories)),
  file: z
    .instanceof(File, { message: 'Choose a file' })
    .refine(
      (f) =>
        (documentExtensions as readonly string[]).includes(extensionOf(f.name)),
      {
        message: `Unsupported file type. Allowed: ${documentExtensions.join(', ')}.`,
      }
    )
    .refine((f) => f.size <= documentMaxMb * 1024 * 1024, {
      message: `Files must be ${documentMaxMb} MB or smaller.`,
    }),
});
export type DocumentUploadForm = z.infer<typeof documentUploadFormSchema>;

export const documentUpdateFormSchema = documentUploadFormSchema
  .omit({ file: true })
  .partial();
export type DocumentUpdateForm = z.infer<typeof documentUpdateFormSchema>;

// ---- Legacy bridge ----------------------------------------------------------

/**
 * The agents, runs, opportunities and members areas still read the older
 * `MyOrg` shape (four feed types, kebab regions). Keep feeding it.
 */
export function toMyOrg(view: OrgView, prefs?: PreferencesView): MyOrg {
  return {
    role: view.myRole ?? 'member',
    org: {
      id: view.id,
      name: view.name,
      slug: view.slug,
      country: view.profile.country,
      type: view.profile.organizationType,
      size: view.profile.teamSize,
      sectors: view.profile.sectors,
      regions: toLegacyRegions(prefs?.targetRegions ?? []),
      opportunityTypes: toFeedTypes(prefs?.opportunityTypes ?? []),
      createdAt: view.createdAt,
      createdBy: view.createdBy ?? '',
      isCandidate: view.isCandidate,
    },
  };
}

export const orgProfileFormResolver = zodResolver(orgProfileFormSchema);
export const onboardingFormResolver = zodResolver(onboardingFormSchema);
export const preferencesFormResolver = zodResolver(preferencesFormSchema);
export const linkFormResolver = zodResolver(linkFormSchema);
export const orgSourceFormResolver = zodResolver(orgSourceFormSchema);

/** Adding several sources at once: one row each, no URL twice. */
export const orgSourcesFormSchema = z.object({
  sources: z
    .array(orgSourceFormSchema)
    .min(1)
    .max(20, 'Add up to 20 at a time')
    .superRefine((rows, ctx) => {
      const seen = new Set<string>();
      rows.forEach((row, index) => {
        const key = row.url.trim().toLowerCase();
        if (key && seen.has(key))
          ctx.addIssue({
            code: 'custom',
            path: [index, 'url'],
            message: 'Already in this list',
          });
        seen.add(key);
      });
    }),
});
export type OrgSourcesForm = z.infer<typeof orgSourcesFormSchema>;
export const orgSourcesFormResolver = zodResolver(orgSourcesFormSchema);
export const documentUploadFormResolver = zodResolver(documentUploadFormSchema);
export const documentUpdateFormResolver = zodResolver(documentUpdateFormSchema);
export const folderFormResolver = zodResolver(folderFormSchema);

/** A job seeker's onboarding: who they are, then the jobs they want. */
export const candidateOnboardingSchema = z.object({
  name: z.string().trim().min(1, 'Enter your name').max(200),
  country: z.string().regex(/^[A-Z]{2}$/, 'Choose a country'),
  city: z.string().trim().max(100),
  description: z
    .string()
    .trim()
    .min(1, 'Say what you do in a sentence or two')
    .max(longTextMax),
  headline: z.string().trim().max(200),
  targetRoles: z
    .array(z.string().trim().min(1).max(100))
    .min(1, 'Add at least one job title')
    .max(50),
  seniority: z.array(z.string()),
  workplaces: z.array(z.string()),
  skills: z.array(z.string().trim().min(1).max(100)).max(100),
  yearsExperience: z.preprocess(
    (v) => (v === '' || v === undefined || v === null ? null : Number(v)),
    z.number().int().min(0).max(60).nullable()
  ),
});
export type CandidateOnboarding = z.infer<typeof candidateOnboardingSchema>;
export type CandidateOnboardingInput = z.input<
  typeof candidateOnboardingSchema
>;
export const candidateOnboardingResolver = zodResolver(
  candidateOnboardingSchema
);
