import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { toFeedTypes } from '~/data/org-taxonomy';
import type { Agent, AgentInput, AgentScope } from './agent.schema';
import { goalSchema, type Goal } from './organization.schema';
import {
  runDepths,
  runStatusSchema,
  runStepKeySchema,
  type AgentRun,
  type RunCandidate,
  type RunOpportunity,
  type RunOutcome,
  type RunStep,
} from './agent-run.schema';
import {
  opportunityStatusSchema,
  opportunityTypeSchema,
  type Opportunity,
  type OpportunityBusiness,
  type OpportunityType,
  type Overview,
} from './opportunity.schema';

/**
 * The backend's agents, runs, opportunities and overview
 * (`/organizations/:id/…`, snake_case) mapped onto the shapes the agents, runs
 * and feed screens already use, so those screens work on either API.
 * Contract: `my-docs/frontend-integration.md` (tasks 4–8) in leadline_backend.
 */

/** The backend's precise kinds behind each of the four feed types. */
const kindsOf: Record<OpportunityType, string[]> = {
  grant: [
    'grant',
    'fellowship',
    'scholarship',
    'investment',
    'loan',
    'sponsorship',
    'in_kind',
  ],
  tender: ['tender', 'rfp', 'consultancy'],
  partnership: ['partnership', 'accelerator'],
  event: ['conference', 'award', 'competition'],
  client: ['client'],
};

export const toBackendKinds = (types: readonly string[]): string[] => [
  ...new Set(types.flatMap((type) => kindsOf[type as OpportunityType] ?? [])),
];

export const toFeedType = (kind: string): OpportunityType =>
  toFeedTypes([kind])[0] ?? 'grant';

const nullableText = z
  .string()
  .nullish()
  .transform((value) => value ?? undefined);

const optionalBoolean = z
  .boolean()
  .nullish()
  .transform((value) => value ?? undefined);
const optionalNumber = z
  .number()
  .nullish()
  .transform((value) => value ?? undefined);

/** What the lead lookup saw on a business's website (`business.site`). */
const siteCheckDtoSchema = z
  .object({
    url: z.string().default(''),
    reachable: z.boolean().default(true),
    problem: z.string().default(''),
    blocked: z.boolean().default(false),
    https: optionalBoolean,
    certificate_error: z.boolean().default(false),
    mobile_ready: optionalBoolean,
    copyright_year: optionalNumber,
    booking: optionalBoolean,
    chat: optionalBoolean,
    payments: optionalBoolean,
    mobile_speed: optionalNumber,
    checked_at: z.string().default(''),
    read_by: z.string().default(''),
  })
  .transform((dto) => ({
    url: dto.url,
    reachable: dto.reachable,
    problem: dto.problem,
    blocked: dto.blocked,
    https: dto.https,
    certificateError: dto.certificate_error,
    mobileReady: dto.mobile_ready,
    copyrightYear: dto.copyright_year,
    booking: dto.booking,
    chat: dto.chat,
    payments: dto.payments,
    mobileSpeed: dto.mobile_speed,
    checkedAt: dto.checked_at,
    readBy: dto.read_by,
  }));

const websiteStatuses = [
  'listed',
  'found',
  'down',
  'none',
  'not_found',
  'unknown',
] as const;

/** A tender's portal facts (`Opportunity.tender`); `{}` for everything else. */
const tenderDtoSchema = z
  .object({
    reference: z.string().default(''),
    buyer: z.string().default(''),
    category: z.string().default(''),
    method: z.string().default(''),
    published_at: z.string().default(''),
    closes_at: z.string().default(''),
    venue: z.string().default(''),
    tender_fee: z.number().nullish(),
    bid_security: z.string().default(''),
    submission: z.array(z.string()).default([]),
    reserved_for: z.array(z.string()).default([]),
    documents: z
      .array(z.object({ name: z.string().default(''), url: z.string() }))
      .default([])
      .catch([]),
    addenda: z.number().default(0),
    buyer_contact: z
      .object({
        email: z.string().default(''),
        phone: z.string().default(''),
        website: z.string().default(''),
        address: z.string().default(''),
      })
      .default({ email: '', phone: '', website: '', address: '' }),
    source: z.string().default(''),
  })
  .transform((dto) => ({
    reference: dto.reference,
    buyer: dto.buyer,
    category: dto.category,
    method: dto.method,
    publishedAt: dto.published_at,
    closesAt: dto.closes_at,
    venue: dto.venue,
    tenderFee: dto.tender_fee ?? undefined,
    bidSecurity: dto.bid_security,
    submission: dto.submission,
    reservedFor: dto.reserved_for,
    documents: dto.documents.filter((doc) => /^https?:\/\//.test(doc.url)),
    addenda: dto.addenda,
    buyerContact: dto.buyer_contact,
    source: dto.source,
  }));

/** A client lead's business (`Opportunity.business`): what its listing shows, and
 * what the lead lookup found (each with where it came from). */
const businessDtoSchema = z
  .object({
    name: z.string().default(''),
    source: z.string().default(''),
    source_label: z.string().default(''),
    source_url: z.string().default(''),
    category: z.string().default(''),
    address: z.string().default(''),
    city: z.string().default(''),
    country: z.string().default(''),
    phone: z.string().default(''),
    email: z.string().default(''),
    website: z.string().default(''),
    socials: z.record(z.string(), z.string()).default({}),
    rating: z.number().nullish(),
    reviews: z.number().nullish(),
    complete_listing: z.boolean().default(false),
    // Leads saved before the lookup have no status: derived from the listing below.
    website_status: z.enum(websiteStatuses).nullish().catch(undefined),
    signals: z.array(z.string()).default([]),
    evidence: z
      .array(z.object({ signal: z.string(), detail: z.string() }))
      .default([])
      .catch([]),
    found_on: z.record(z.string(), z.string()).default({}).catch({}),
    site: siteCheckDtoSchema.nullish().catch(undefined),
    pitch_angle: z.string().default(''),
  })
  .transform(
    (dto): OpportunityBusiness => ({
      category: dto.category,
      address: dto.address,
      city: dto.city,
      country: dto.country,
      phone: dto.phone,
      email: dto.email,
      website: dto.website,
      socials: dto.socials,
      rating: dto.rating ?? undefined,
      reviews: dto.reviews ?? undefined,
      completeListing: dto.complete_listing,
      websiteStatus:
        dto.website_status ??
        (dto.website ? 'listed' : dto.complete_listing ? 'none' : 'unknown'),
      signals: dto.signals,
      evidence: dto.evidence,
      foundOn: dto.found_on,
      site: dto.site ?? undefined,
      pitchAngle: dto.pitch_angle,
      source: dto.source,
      sourceLabel: dto.source_label,
      listingUrl: dto.source_url,
    })
  );

export const runOpportunityDtoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    funder: z.string().nullish().default(''),
    source_url: z.string().nullish().default(''),
    match_score: z.number(),
    opportunity_type: z.string(),
    status: z.string(),
  })
  .transform(
    (dto): RunOpportunity => ({
      id: dto.id,
      title: dto.title,
      funder: dto.funder || undefined,
      sourceUrl: dto.source_url || undefined,
      matchScore: dto.match_score,
      opportunityType: dto.opportunity_type,
      status: dto.status,
    })
  );

// ---------------------------------------------------------------------------
// Agents
// ---------------------------------------------------------------------------

const originSchema = z.enum(['organization', 'agent']);
const taggedSchema = z.object({ value: z.string(), origin: originSchema });

const agentScopeDtoSchema = z
  .object({
    depth: z.object({ value: z.enum(runDepths), origin: originSchema }),
    sources: z.array(taggedSchema),
    opportunity_types: z.array(taggedSchema),
    keywords: z.array(taggedSchema),
    folders: z.array(
      z.object({ id: z.string(), name: z.string(), origin: originSchema })
    ),
    links: z.array(
      z.object({
        url: z.string(),
        label: z.string().default(''),
        notes: z.string().default(''),
        origin: originSchema,
      })
    ),
    knowledge_mode: z.enum(['all', 'selected', 'none']).catch('all'),
  })
  .transform(
    (dto): AgentScope => ({
      knowledgeMode: dto.knowledge_mode,
      depth: dto.depth,
      sources: dto.sources,
      // Several backend kinds can share one feed type; keep the first.
      opportunityTypes: dto.opportunity_types
        .map((t) => ({ value: toFeedType(t.value), origin: t.origin }))
        .filter((t, i, all) => all.findIndex((o) => o.value === t.value) === i),
      keywords: dto.keywords,
      folders: dto.folders.map(({ id, name, origin }) => ({
        id,
        name,
        origin,
      })),
      links: dto.links,
    })
  );

export const agentDtoSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    description: z.string().default(''),
    instructions: z.string().default(''),
    goal: goalSchema.catch('grants'),
    opportunity_types: z.array(z.string()),
    keywords: z.array(z.string()),
    sources: z.array(z.string()),
    schedule: z.enum(['manual', 'daily', 'weekly']),
    enabled: z.boolean(),
    owner: z.string().nullable(),
    last_run_id: nullableText,
    last_run_at: nullableText,
    last_run_found: z
      .number()
      .nullish()
      .transform((v) => v ?? undefined),
    last_run_status: runStatusSchema.nullish().transform((v) => v ?? undefined),
    last_run_opportunities: z.array(runOpportunityDtoSchema).nullish(),
    folders: z
      .array(z.object({ id: z.string(), name: z.string() }))
      .default([]),
    links: z
      .array(
        z.object({
          url: z.string(),
          label: z.string().default(''),
          notes: z.string().default(''),
          enabled: z.boolean().default(true),
        })
      )
      .default([]),
    customer_types: z.array(z.string()).catch([]).default([]),
    places: z.array(z.string()).catch([]).default([]),
    depth: z.enum(['', ...runDepths]).catch(''),
    effective: agentScopeDtoSchema.nullish(),
    can_manage: z.boolean(),
    created_at: z.string(),
  })
  .transform(
    (dto): Agent => ({
      id: dto.id,
      orgId: '',
      name: dto.name,
      description: dto.description || undefined,
      instructions: dto.instructions || undefined,
      goal: dto.goal,
      opportunityTypes: toFeedTypes(dto.opportunity_types),
      keywords: dto.keywords,
      sources: dto.sources,
      folders: dto.folders,
      links: dto.links,
      customerTypes: dto.customer_types,
      places: dto.places,
      depth: dto.depth,
      effective: dto.effective ?? undefined,
      schedule: dto.schedule,
      enabled: dto.enabled,
      ownerId: dto.owner ?? '',
      lastRunAt: dto.last_run_at,
      lastRunFound: dto.last_run_found,
      lastRunId: dto.last_run_id,
      lastRunStatus: dto.last_run_status,
      lastRunOpportunities: dto.last_run_opportunities ?? undefined,
      createdAt: dto.created_at,
      canManage: dto.can_manage,
    })
  );

export function toAgentBody(input: Partial<AgentInput>) {
  const { opportunityTypes, depth, customerTypes, ...rest } = input;
  return {
    ...rest,
    ...(customerTypes ? { customer_types: customerTypes } : {}),
    ...(opportunityTypes
      ? { opportunity_types: toBackendKinds(opportunityTypes) }
      : {}),
    ...(depth !== undefined ? { depth: depth ?? '' } : {}),
  };
}

/** Form values from an agent (its own additions, not the merged scope). */
export const toAgentInput = (agent: Agent): AgentInput => ({
  name: agent.name,
  description: agent.description ?? '',
  instructions: agent.instructions ?? '',
  goal: agent.goal,
  opportunityTypes: agent.opportunityTypes,
  keywords: agent.keywords,
  sources: agent.sources,
  folders: agent.folders.map((f) => f.id),
  links: agent.links,
  customerTypes: agent.customerTypes,
  places: agent.places,
  depth: agent.depth || null,
  schedule: agent.schedule,
  enabled: agent.enabled,
});

// ---------------------------------------------------------------------------
// Run settings (`O/run-settings/`): the org's "Run with my settings"
// ---------------------------------------------------------------------------

const folderRefSchema = z.object({ id: z.string(), name: z.string() });

/** Which company documents runs may read. */
export const knowledgeModes = ['all', 'selected', 'none'] as const;
export type KnowledgeMode = (typeof knowledgeModes)[number];

export const runSettingsDtoSchema = z
  .object({
    depth: z.enum(runDepths).catch('standard'),
    sources: z.array(z.string()),
    opportunity_types: z.array(z.string()),
    folders: z.array(folderRefSchema),
    knowledge_mode: z.enum(knowledgeModes).catch('all'),
    depths: z.array(
      z.object({ key: z.string(), label: z.string(), description: z.string() })
    ),
    goals: z
      .array(
        z.object({
          key: goalSchema,
          label: z.string(),
          description: z.string(),
          opportunity_types: z.array(z.string()),
          sources: z.array(z.string()),
          available: z.boolean(),
        })
      )
      .default([]),
  })
  .transform((dto) => ({
    depth: dto.depth,
    sources: dto.sources,
    opportunityTypes: toFeedTypes(dto.opportunity_types),
    folders: dto.folders,
    knowledgeMode: dto.knowledge_mode,
    // Picker items: the depth's label with its description underneath.
    depths: dto.depths.map((d) => ({
      value: d.key,
      label: d.label,
      description: d.description,
    })),
    // What each goal searches, so worker forms offer only what fits its goal.
    goals: dto.goals.map(
      (g): GoalOption => ({
        value: g.key,
        label: g.label,
        description: g.description,
        opportunityTypes: toFeedTypes(g.opportunity_types),
        sources: g.sources,
        available: g.available,
      })
    ),
  }));

export interface GoalOption {
  value: Goal;
  label: string;
  description: string;
  /** The UI's opportunity types that belong to the goal. */
  opportunityTypes: OpportunityType[];
  sources: string[];
  /** False: its workers can be set up, but searches arrive in a later update. */
  available: boolean;
}
export type RunSettings = z.infer<typeof runSettingsDtoSchema>;

export const runSettingsFormSchema = z
  .object({
    depth: z.enum(runDepths),
    sources: z.array(z.string()).min(1, 'Pick at least one source'),
    opportunityTypes: z
      .array(opportunityTypeSchema)
      .min(1, 'Pick at least one type'),
    knowledgeMode: z.enum(knowledgeModes),
    folders: z.array(z.string()),
  })
  .refine((form) => form.knowledgeMode !== 'selected' || form.folders.length, {
    path: ['folders'],
    message: 'Pick at least one folder, or use all documents',
  });
export type RunSettingsForm = z.infer<typeof runSettingsFormSchema>;
export const runSettingsFormResolver = zodResolver(runSettingsFormSchema);

export const toRunSettingsBody = (form: RunSettingsForm) => ({
  depth: form.depth,
  sources: form.sources,
  opportunity_types: toBackendKinds(form.opportunityTypes),
  knowledge_mode: form.knowledgeMode,
  // Folders only matter for "selected"; the backend clears them otherwise.
  folders: form.knowledgeMode === 'selected' ? form.folders : [],
});

/** Form values from the org's run settings. Pass the agent a run will use:
 * its own sources and types apply to its runs, so they prefill those fields. */
export const toRunSettingsForm = (settings: RunSettings): RunSettingsForm => ({
  depth: settings.depth,
  sources: settings.sources,
  opportunityTypes: settings.opportunityTypes,
  knowledgeMode: settings.knowledgeMode,
  folders: settings.folders.map((f) => f.id),
});

// ---------------------------------------------------------------------------
// Runs
// ---------------------------------------------------------------------------

const runEventDtoSchema = z.object({
  seq: z.number(),
  step: z.string(),
  level: z.enum(['info', 'warning', 'error']).catch('info'),
  message: z.string(),
  tool: z.string().default(''),
  source: z.string().default(''),
  url: z.string().default(''),
  data: z.unknown().optional(),
  at: z.string(),
});

const runStepDtoSchema = z.object({
  // A step this UI doesn't know yet is dropped (below), not a failed parse.
  key: z.string(),
  label: z.string(),
  status: z
    .enum(['pending', 'running', 'done', 'warning', 'failed', 'skipped'])
    .catch('pending'),
  started_at: z.string().nullable(),
  duration_ms: z.number().nullable().default(0),
  events: z.array(runEventDtoSchema),
});

const candidateDtoSchema = z.object({
  title: z.string(),
  funder: z.string().default(''),
  source_name: z.string().default(''),
  source_url: z.string().default(''),
  opportunity_type: z.string(),
  match_score: z.number(),
  match_reasons: z.array(z.string()).default([]),
  decision: z.enum(['added', 'duplicate', 'below_threshold']),
  opportunity: z.string().nullable(),
});

const usedOrigin = z
  .enum(['organization', 'agent', 'run'])
  .catch('organization');
const usedTagged = z.object({ value: z.string(), origin: usedOrigin });

const runSettingsUsedDtoSchema = z
  .object({
    depth: z.object({ value: z.string(), origin: usedOrigin }),
    builtin_sources: z.array(usedTagged),
    websites: z.array(
      z.object({
        url: z.string(),
        label: z.string().default(''),
        origin: usedOrigin,
      })
    ),
    opportunity_types: z.array(usedTagged),
    keywords: z.array(usedTagged),
    folders: z.array(
      z.object({ id: z.string(), name: z.string(), origin: usedOrigin })
    ),
    knowledge_mode: z.enum(['all', 'folders', 'none']).catch('all'),
  })
  .transform((dto) => ({
    knowledgeMode: dto.knowledge_mode,
    depth: dto.depth,
    builtinSources: dto.builtin_sources,
    websites: dto.websites,
    // Several backend kinds share one feed type; keep the first.
    opportunityTypes: dto.opportunity_types
      .map((t) => ({ value: toFeedType(t.value), origin: t.origin }))
      .filter((t, i, all) => all.findIndex((o) => o.value === t.value) === i),
    keywords: dto.keywords,
    folders: dto.folders,
  }));

const runFields = {
  id: z.string(),
  agent: z.string().nullable(),
  agent_name: z.string(),
  trigger: z.enum(['manual', 'schedule']),
  status: runStatusSchema,
  created_at: z.string(),
  started_at: z.string().nullable(),
  finished_at: z.string().nullable(),
  duration_ms: z.number().nullable(),
  sources_scanned: z.number(),
  pages_read: z.number(),
  found: z.number(),
  opportunities: z.array(runOpportunityDtoSchema).default([]),
  error: z.string().default(''),
  // "" / [] for runs from before depths and folders.
  depth: z.string().default(''),
  folders: z.array(folderRefSchema).default([]),
  settings: runSettingsUsedDtoSchema.nullish().catch(null),
};

type RunDto = z.infer<z.ZodObject<typeof runFields>>;

const runBase = (dto: RunDto): Omit<AgentRun, 'steps' | 'candidates'> => ({
  id: dto.id,
  orgId: '',
  agentId: dto.agent ?? '',
  agentName: dto.agent_name,
  trigger: dto.trigger,
  status: dto.status,
  startedAt: dto.started_at ?? dto.created_at,
  finishedAt: dto.finished_at ?? '',
  durationMs: dto.duration_ms ?? 0,
  sourcesScanned: dto.sources_scanned,
  pagesRead: dto.pages_read,
  found: dto.found,
  opportunities: dto.opportunities,
  error: dto.error || undefined,
  depth: dto.depth || undefined,
  folders: dto.folders,
  settings: dto.settings ?? undefined,
});

export const runListItemDtoSchema = z
  .object(runFields)
  .transform(
    (dto): AgentRun => ({ ...runBase(dto), steps: [], candidates: [] })
  );

const runOutcomeDtoSchema = z.object({
  added: z.number(),
  duplicates: z.number(),
  below_threshold: z.number(),
  skipped: z.object({
    closed: z.number(),
    not_an_opportunity: z.number(),
    wrong_type: z.number(),
    excluded: z.number(),
    unreadable: z.number(),
  }),
  best_score: z.number().nullable(),
  match_threshold: z.number().nullable(),
});

const toRunOutcome = (
  dto: z.infer<typeof runOutcomeDtoSchema> | undefined
): RunOutcome | undefined =>
  dto && {
    added: dto.added,
    duplicates: dto.duplicates,
    belowThreshold: dto.below_threshold,
    skipped: {
      closed: dto.skipped.closed,
      notAnOpportunity: dto.skipped.not_an_opportunity,
      wrongType: dto.skipped.wrong_type,
      excluded: dto.skipped.excluded,
      unreadable: dto.skipped.unreadable,
    },
    bestScore: dto.best_score,
    matchThreshold: dto.match_threshold,
  };

const numbers = z.record(z.string(), z.number()).catch({});
const strings = z.record(z.string(), z.string()).catch({});

export const runDetailDtoSchema = z
  .object({
    ...runFields,
    budget: numbers,
    usage: numbers,
    prompt_versions: strings,
    models_used: strings,
    steps: z.array(runStepDtoSchema),
    candidates: z.array(candidateDtoSchema),
    // Missing on backends from before run outcomes.
    outcome: runOutcomeDtoSchema.optional(),
  })
  .transform(
    (dto): AgentRun => ({
      ...runBase(dto),
      steps: dto.steps.flatMap((step): RunStep[] => {
        const key = runStepKeySchema.safeParse(step.key);
        if (!key.success) return [];
        return [
          {
            key: key.data,
            label: step.label,
            status: step.status,
            startedAt: step.started_at ?? '',
            durationMs: step.duration_ms ?? 0,
            events: step.events.map((event) => ({
              at: event.at,
              level: event.level,
              message: event.message,
              tool: event.tool || undefined,
              source: event.source || undefined,
              url: event.url || undefined,
            })),
          },
        ];
      }),
      candidates: dto.candidates.map(
        (c): RunCandidate => ({
          title: c.title,
          funder: c.funder,
          sourceName: c.source_name,
          sourceUrl: c.source_url || undefined,
          type: toFeedType(c.opportunity_type),
          matchScore: c.match_score,
          matchReasons: c.match_reasons,
          decision: c.decision,
          opportunityId: c.opportunity ?? undefined,
        })
      ),
      budget: dto.budget,
      usage: dto.usage,
      promptVersions: dto.prompt_versions,
      modelsUsed: dto.models_used,
      outcome: toRunOutcome(dto.outcome),
    })
  );

// ---------------------------------------------------------------------------
// Opportunities
// ---------------------------------------------------------------------------

const decimal = z
  .union([z.string(), z.number()])
  .nullish()
  .transform((value) =>
    value === null || value === undefined || value === ''
      ? undefined
      : Number(value)
  );

export const reviewDtoSchema = z
  .object({
    id: z.string(),
    decision: z.enum(['approve', 'reject']),
    reason: z.string().default(''),
    comment: z.string().default(''),
    reviewer: z
      .object({ id: z.string(), email: z.string(), name: z.string() })
      .nullable(),
    status_before: z.string(),
    match_score: z.number(),
    created_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    decision: dto.decision,
    reason: dto.reason,
    comment: dto.comment,
    reviewerName: dto.reviewer?.name || dto.reviewer?.email,
    statusBefore: dto.status_before,
    matchScore: dto.match_score,
    createdAt: dto.created_at,
  }));
export type Review = z.infer<typeof reviewDtoSchema>;

const stringList = z.array(z.string()).catch([]);

export const opportunityDtoSchema = z
  .object({
    id: z.string(),
    agent: z.string().nullable(),
    agent_name: z.string().nullable(),
    opportunity_type: z.string(),
    title: z.string(),
    funder: z.string().default(''),
    summary: z.string().default(''),
    eligibility: z.string().default(''),
    amount: z
      .object({ min: decimal, max: decimal, currency: z.string() })
      .nullable(),
    deadline: z.string().nullable(),
    location: z.string().default(''),
    source_url: z.string(),
    source_name: z.string().default(''),
    match_score: z.number(),
    match_reasons: z.array(z.string()).default([]),
    status: opportunityStatusSchema,
    saved: z.boolean(),
    notes: z.string().default(''),
    requirements: z
      .object({ items: stringList, concerns: stringList })
      .partial()
      .nullish()
      .catch(null),
    latest_review: reviewDtoSchema.nullable().optional(),
    brief: z
      .object({
        what_it_is: z.string(),
        why_it_fits: z.string(),
        eligibility_checklist: z
          .array(
            z.object({
              criterion: z.string(),
              meets: z.boolean(),
              notes: z.string().default(''),
            })
          )
          .default([]),
        documents_needed: z.array(z.string()).default([]),
        deadline_plan: z.string().default(''),
        effort_estimate: z.string().default(''),
        next_step: z.string().default(''),
      })
      .nullish()
      .catch(null),
    brief_status: z
      .enum(['pending', 'ready', 'failed', 'none'])
      .optional()
      .catch(undefined),
    business: businessDtoSchema.nullish().catch(null),
    tender: z.record(z.string(), z.unknown()).nullish().catch(null),
    brief_sources: z
      .object({
        mode: z.enum(['all', 'folders', 'none']).catch('all'),
        folders: z.array(z.string()).default([]),
        documents: z.array(z.string()).default([]),
      })
      .nullish()
      .catch(null),
    found_at: z.string(),
    updated_at: z.string(),
  })
  .transform(
    (dto): Opportunity => ({
      id: dto.id,
      orgId: '',
      agentId: dto.agent ?? '',
      agentName: dto.agent_name ?? undefined,
      type: toFeedType(dto.opportunity_type),
      kind: dto.opportunity_type,
      title: dto.title,
      funder: dto.funder,
      summary: dto.summary,
      eligibility: dto.eligibility || undefined,
      amount: dto.amount
        ? {
            min: dto.amount.min,
            max: dto.amount.max,
            currency: dto.amount.currency,
          }
        : undefined,
      deadline: dto.deadline ?? undefined,
      location: dto.location || undefined,
      sourceUrl: dto.source_url,
      sourceName: dto.source_name,
      matchScore: dto.match_score,
      matchReasons: dto.match_reasons,
      status: dto.status,
      saved: dto.saved,
      notes: dto.notes || undefined,
      foundAt: dto.found_at,
      updatedAt: dto.updated_at,
      brief: dto.brief
        ? {
            whatItIs: dto.brief.what_it_is,
            whyItFits: dto.brief.why_it_fits,
            eligibility: dto.brief.eligibility_checklist,
            documentsNeeded: dto.brief.documents_needed,
            deadlinePlan: dto.brief.deadline_plan,
            effort: dto.brief.effort_estimate,
            nextStep: dto.brief.next_step,
          }
        : undefined,
      briefStatus: dto.brief_status,
      business: dto.business ?? undefined,
      // `{}` (not a portal tender) or unreadable: no tender card.
      tender:
        dto.tender && Object.keys(dto.tender).length > 0
          ? (tenderDtoSchema.safeParse(dto.tender).data ?? undefined)
          : undefined,
      briefSources: dto.brief_sources ?? undefined,
      concerns: dto.requirements?.concerns ?? [],
      requirementItems: dto.requirements?.items ?? [],
      latestReview: dto.latest_review
        ? {
            id: dto.latest_review.id,
            decision: dto.latest_review.decision,
            reason: dto.latest_review.reason,
            comment: dto.latest_review.comment,
            reviewerName: dto.latest_review.reviewerName,
            createdAt: dto.latest_review.createdAt,
          }
        : dto.latest_review === null
          ? null
          : undefined,
    })
  );

const attentionKinds = [
  'deadline_without_proposal',
  'to_review',
  'eligibility_gap',
  'failed_runs',
] as const;
type AttentionKind = (typeof attentionKinds)[number];

export const overviewDtoSchema = z
  .object({
    new_this_week: z.number(),
    pursuing: z.number(),
    active_agents: z.number(),
    due_soon: z.number(),
    upcoming: z.array(opportunityDtoSchema),
    latest: z.array(opportunityDtoSchema),
    pipeline: z
      .object({
        new: z.number(),
        reviewing: z.number(),
        pursuing: z.number(),
        submitted: z.number(),
      })
      .default({ new: 0, reviewing: 0, pursuing: 0, submitted: 0 }),
    attention: z
      .array(
        z.object({
          // A kind this UI doesn't know yet is dropped below, not a failed parse.
          kind: z.string(),
          count: z.number(),
          target: z.string().default(''),
        })
      )
      .default([]),
    checklist: z.object({
      profile: z.boolean(),
      agent: z.boolean(),
      teammate: z.boolean(),
    }),
  })
  .transform(
    (dto): Overview => ({
      newThisWeek: dto.new_this_week,
      pursuing: dto.pursuing,
      activeAgents: dto.active_agents,
      dueSoon: dto.due_soon,
      upcoming: dto.upcoming,
      latest: dto.latest,
      pipeline: dto.pipeline,
      attention: dto.attention.flatMap((item) =>
        attentionKinds.includes(item.kind as AttentionKind)
          ? [{ ...item, kind: item.kind as AttentionKind }]
          : []
      ),
      checklist: dto.checklist,
    })
  );

// ---------------------------------------------------------------------------
// DRF pages → the `{data, total, page, limit}` the list screens read
// ---------------------------------------------------------------------------

export const drfPage = <T extends z.ZodTypeAny>(item: T) =>
  z.object({
    count: z.number(),
    results: z.array(item),
  });

export function toListPage<T>(
  page: { count: number; results: T[] },
  params: { page: number; limit: number }
) {
  return {
    data: page.results,
    total: page.count,
    page: params.page,
    limit: params.limit,
  };
}

const SORTS: Record<string, string> = {
  'foundAt:desc': '-found_at',
  'foundAt:asc': 'found_at',
  'matchScore:desc': '-match_score',
  'matchScore:asc': 'match_score',
  'deadline:asc': 'deadline',
  'deadline:desc': '-deadline',
};

type Params = Record<string, string | string[] | number | undefined>;

const first = (value: Params[string]) =>
  Array.isArray(value) ? value[0] : value;

/** The feed's filter state (UI names) as the backend's query parameters. */
export function toOpportunityQuery(params: Params = {}) {
  const page = Number(first(params.page) ?? 1) || 1;
  const limit = Number(first(params.limit) ?? 25) || 25;
  const query: Record<string, string | string[] | number> = {
    page,
    page_size: limit,
  };
  const type = first(params.type);
  if (type) query.type = toBackendKinds([String(type)]);
  if (params.status) query.status = params.status as string | string[];
  const agent = first(params.agentId);
  if (agent) query.agent = String(agent);
  const run = first(params.run ?? params.runId);
  if (run) query.run = String(run);
  if (first(params.saved)) query.saved = 'true';
  const search = first(params.q);
  if (search) query.search = String(search);
  const review = first(params.review);
  if (review) query.review = String(review);
  const sort = first(params.sort);
  query.sort = SORTS[String(sort)] ?? '-found_at';
  return { query, page, limit };
}

export function toRunQuery(params: Params = {}) {
  const page = Number(first(params.page) ?? 1) || 1;
  const limit = Number(first(params.limit) ?? 25) || 25;
  const query: Record<string, string | number> = { page, page_size: limit };
  const agent = first(params.agentId);
  if (agent) query.agent = String(agent);
  const status = first(params.status);
  if (status) query.status = String(status);
  return { query, page, limit };
}
