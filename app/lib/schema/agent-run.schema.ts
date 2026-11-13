import { z } from 'zod';
import { opportunityTypeSchema } from './opportunity.schema';

export const runDepths = ['quick', 'standard', 'deep'] as const;

/** Where a run setting came from: the organization, the automation, or this run only. */
export const settingOriginSchema = z.enum(['organization', 'agent', 'run']);
export type SettingOrigin = z.infer<typeof settingOriginSchema>;
export type RunDepth = (typeof runDepths)[number];

export const runStepKeySchema = z.enum([
  'profile',
  'search',
  'read',
  'match',
  'save',
]);

export const runEventSchema = z.object({
  at: z.string(),
  level: z.enum(['info', 'warning', 'error']),
  message: z.string(),
  /** Backend runs: what the agent used (`search`, `fetch`, `judge`…). */
  tool: z.string().optional(),
  /** Source or site name shown as a chip (`grants.gov`, `devex.com`). */
  source: z.string().optional(),
  url: z.string().optional(),
});

export const runStepSchema = z.object({
  key: runStepKeySchema,
  label: z.string(),
  /** `pending` / `running` only while a backend run is in progress. */
  status: z.enum([
    'pending',
    'running',
    'done',
    'warning',
    'failed',
    'skipped',
  ]),
  startedAt: z.string(),
  durationMs: z.number(),
  events: z.array(runEventSchema),
});

export const runCandidateSchema = z.object({
  title: z.string(),
  funder: z.string(),
  sourceName: z.string(),
  sourceUrl: z.string().optional(),
  type: opportunityTypeSchema,
  matchScore: z.number(),
  matchReasons: z.array(z.string()),
  decision: z.enum(['added', 'duplicate', 'below_threshold']),
  /** Set when the candidate was added to the feed. */
  opportunityId: z.string().optional(),
});

export const runOpportunitySchema = z.object({
  id: z.string(),
  title: z.string(),
  funder: z.string().optional(),
  sourceUrl: z.string().optional(),
  matchScore: z.number(),
  opportunityType: z.string(),
  status: z.string(),
});

export const runStatusSchema = z.enum([
  'queued',
  'running',
  'succeeded',
  'partial',
  'failed',
]);

export const finishedRunStatuses = ['succeeded', 'partial', 'failed'] as const;
export const isRunActive = (status: RunStatus) =>
  status === 'queued' || status === 'running';

/** How a finished run ended, so a run that added nothing can say why. */
export const runOutcomeSchema = z.object({
  added: z.number(),
  duplicates: z.number(),
  belowThreshold: z.number(),
  /** Listings dropped after reading, by reason. */
  skipped: z.object({
    closed: z.number(),
    notAnOpportunity: z.number(),
    wrongType: z.number(),
    excluded: z.number(),
    unreadable: z.number(),
  }),
  bestScore: z.number().nullable(),
  matchThreshold: z.number().nullable(),
});

export const agentRunSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  agentId: z.string(),
  agentName: z.string(),
  trigger: z.enum(['manual', 'schedule']),
  status: runStatusSchema,
  startedAt: z.string(),
  finishedAt: z.string(),
  durationMs: z.number(),
  sourcesScanned: z.number(),
  pagesRead: z.number(),
  found: z.number(),
  steps: z.array(runStepSchema),
  candidates: z.array(runCandidateSchema),
  opportunities: z.array(runOpportunitySchema).optional().default([]),
  error: z.string().optional(),
  /** How thorough the run was, and the folders it was given (empty = all). */
  depth: z.string().optional(),
  folders: z.array(z.object({ id: z.string(), name: z.string() })).optional(),
  /** What the run searched, each part tagged with where it came from. */
  settings: z
    .object({
      /** all, folders (only `folders`) or none: which company documents it read. */
      knowledgeMode: z.enum(['all', 'folders', 'none']),
      depth: z.object({ value: z.string(), origin: settingOriginSchema }),
      builtinSources: z.array(
        z.object({ value: z.string(), origin: settingOriginSchema })
      ),
      websites: z.array(
        z.object({
          url: z.string(),
          label: z.string(),
          origin: settingOriginSchema,
        })
      ),
      opportunityTypes: z.array(
        z.object({ value: opportunityTypeSchema, origin: settingOriginSchema })
      ),
      keywords: z.array(
        z.object({ value: z.string(), origin: settingOriginSchema })
      ),
      folders: z.array(
        z.object({
          id: z.string(),
          name: z.string(),
          origin: settingOriginSchema,
        })
      ),
    })
    .optional(),
  /** Backend runs: limits, what was used, and the prompts/models behind it. */
  budget: z.record(z.string(), z.number()).optional(),
  usage: z.record(z.string(), z.number()).optional(),
  promptVersions: z.record(z.string(), z.string()).optional(),
  modelsUsed: z.record(z.string(), z.string()).optional(),
  outcome: runOutcomeSchema.optional(),
});

export const agentRunListSchema = z.object({
  data: z.array(agentRunSchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export type RunStepKey = z.infer<typeof runStepKeySchema>;
export type RunEvent = z.infer<typeof runEventSchema>;
export type RunStep = z.infer<typeof runStepSchema>;
export type RunCandidate = z.infer<typeof runCandidateSchema>;
export type RunOpportunity = z.infer<typeof runOpportunitySchema>;
export type RunStatus = z.infer<typeof runStatusSchema>;
export type AgentRun = z.infer<typeof agentRunSchema>;
export type AgentRunList = z.infer<typeof agentRunListSchema>;
export type RunOutcome = z.infer<typeof runOutcomeSchema>;
