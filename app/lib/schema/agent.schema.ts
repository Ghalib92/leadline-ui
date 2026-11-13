import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { opportunityTypeSchema } from './opportunity.schema';
import {
  agentRunSchema,
  runDepths,
  runOpportunitySchema,
  runStatusSchema,
} from './agent-run.schema';

export const agentScheduleSchema = z.enum(['manual', 'daily', 'weekly']);

/** Where a part of an agent's search comes from. */
export const scopeOriginSchema = z.enum(['organization', 'agent']);

export const agentLinkSchema = z.object({
  url: z.url('Enter a full URL, e.g. https://example.org/calls').max(500),
  label: z.string().trim().max(120, 'Keep the label under 120 characters'),
  notes: z.string().trim().max(500, 'Keep the note under 500 characters'),
  enabled: z.boolean(),
});

/** What a run of the agent searches: the organization's settings plus the
 * agent's additions, each part tagged with where it came from. */
export const agentScopeSchema = z.object({
  /** The organization's documents mode: all, only selected folders, or none. */
  knowledgeMode: z.enum(['all', 'selected', 'none']),
  depth: z.object({ value: z.enum(runDepths), origin: scopeOriginSchema }),
  sources: z.array(z.object({ value: z.string(), origin: scopeOriginSchema })),
  opportunityTypes: z.array(
    z.object({ value: opportunityTypeSchema, origin: scopeOriginSchema })
  ),
  keywords: z.array(z.object({ value: z.string(), origin: scopeOriginSchema })),
  folders: z.array(
    z.object({ id: z.string(), name: z.string(), origin: scopeOriginSchema })
  ),
  links: z.array(
    z.object({
      url: z.string(),
      label: z.string(),
      notes: z.string(),
      origin: scopeOriginSchema,
    })
  ),
});

export const agentSchema = z.object({
  id: z.string(),
  orgId: z.string(),
  name: z.string(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  /** What the agent adds to the organization's search settings. */
  opportunityTypes: z.array(opportunityTypeSchema),
  keywords: z.array(z.string()),
  sources: z.array(z.string()),
  folders: z.array(z.object({ id: z.string(), name: z.string() })),
  links: z.array(agentLinkSchema),
  /** Empty: the organization's depth. */
  depth: z.enum(['', ...runDepths]),
  effective: agentScopeSchema.optional(),
  schedule: agentScheduleSchema,
  enabled: z.boolean(),
  ownerId: z.string(),
  lastRunAt: z.string().optional(),
  lastRunFound: z.number().optional(),
  lastRunId: z.string().optional(),
  lastRunStatus: runStatusSchema.optional(),
  lastRunOpportunities: z.array(runOpportunitySchema).optional(),
  createdAt: z.string(),
  /** Backend: whether I may edit, delete or run it (admins and the owner). */
  canManage: z.boolean().optional(),
});

export const agentInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Give the agent a name')
    .max(60, 'Keep the name under 60 characters'),
  description: z.string().max(280, 'Keep it under 280 characters').optional(),
  instructions: z
    .string()
    .max(2000, 'Keep instructions under 2000 characters')
    .optional(),
  // Additions to the organization's settings, so each may be empty.
  opportunityTypes: z.array(opportunityTypeSchema),
  keywords: z.array(z.string().trim().min(1)).max(20, 'Use up to 20 keywords'),
  sources: z.array(z.string()),
  folders: z.array(z.string()),
  links: z.array(agentLinkSchema).max(30, 'Use up to 30 websites'),
  /** null: the organization's depth (the picker writes null when cleared). */
  depth: z.enum(runDepths).nullable(),
  schedule: agentScheduleSchema,
  enabled: z.boolean(),
});

export const runResultSchema = z.object({
  run: agentRunSchema,
});

export const agentInputResolver = zodResolver(agentInputSchema);

export type AgentSchedule = z.infer<typeof agentScheduleSchema>;
export type Agent = z.infer<typeof agentSchema>;
export type AgentLink = z.infer<typeof agentLinkSchema>;
export type AgentScope = z.infer<typeof agentScopeSchema>;
export type ScopeOrigin = z.infer<typeof scopeOriginSchema>;
export type AgentInput = z.infer<typeof agentInputSchema>;
export type RunResult = z.infer<typeof runResultSchema>;
