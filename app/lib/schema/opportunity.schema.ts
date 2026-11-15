import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { OPPORTUNITY_TYPES, enumValues } from '~/data/taxonomy';

export const opportunityTypeSchema = z.enum(enumValues(OPPORTUNITY_TYPES));

export const OPPORTUNITY_STATUSES = [
  { value: 'new', label: 'New' },
  { value: 'reviewing', label: 'Reviewing' },
  { value: 'pursuing', label: 'Pursuing' },
  { value: 'submitted', label: 'Submitted' },
  { value: 'won', label: 'Won' },
  { value: 'lost', label: 'Lost' },
  { value: 'dismissed', label: 'Dismissed' },
] as const;

export const opportunityStatusSchema = z.enum(enumValues(OPPORTUNITY_STATUSES));

export const opportunitySchema = z.object({
  id: z.string(),
  orgId: z.string(),
  agentId: z.string(),
  /** Denormalised by the API; absent when the agent was deleted. */
  agentName: z.string().optional(),
  type: opportunityTypeSchema,
  title: z.string(),
  funder: z.string(),
  summary: z.string(),
  eligibility: z.string().optional(),
  amount: z
    .object({
      min: z.number().optional(),
      max: z.number().optional(),
      currency: z.string(),
    })
    .optional(),
  deadline: z.string().optional(),
  location: z.string().optional(),
  sourceUrl: z.string(),
  sourceName: z.string(),
  matchScore: z.number().min(0).max(100),
  matchReasons: z.array(z.string()),
  status: opportunityStatusSchema,
  saved: z.boolean(),
  notes: z.string().optional(),
  foundAt: z.string(),
  updatedAt: z.string(),
  /** Backend: the precise kind (`rfp`, `fellowship`…) behind the feed `type`. */
  kind: z.string().optional(),
  /** Client leads: the business's listing (contacts, rating, signs it needs you). */
  business: z
    .object({
      category: z.string(),
      address: z.string(),
      city: z.string(),
      country: z.string(),
      phone: z.string(),
      email: z.string(),
      website: z.string(),
      socials: z.record(z.string(), z.string()),
      rating: z.number().optional(),
      reviews: z.number().optional(),
      /** True when the directory reliably lists websites (Google Maps). */
      completeListing: z.boolean(),
      signals: z.array(z.string()),
      pitchAngle: z.string(),
      source: z.string(),
      sourceLabel: z.string(),
      listingUrl: z.string(),
    })
    .optional(),
  /** Backend: what to check before applying, from the verifier and judge. */
  concerns: z.array(z.string()).optional(),
  requirementItems: z.array(z.string()).optional(),
  /** Backend: the analyst's executive brief, once it is ready. */
  brief: z
    .object({
      whatItIs: z.string(),
      whyItFits: z.string(),
      eligibility: z.array(
        z.object({
          criterion: z.string(),
          meets: z.boolean(),
          notes: z.string(),
        })
      ),
      documentsNeeded: z.array(z.string()),
      deadlinePlan: z.string(),
      effort: z.string(),
      nextStep: z.string(),
    })
    .optional(),
  /** `none`: no brief for this kind of find (client leads). */
  briefStatus: z.enum(['pending', 'ready', 'failed', 'none']).optional(),
  /** Which company documents the brief read. */
  briefSources: z
    .object({
      mode: z.enum(['all', 'folders', 'none']),
      folders: z.array(z.string()),
      documents: z.array(z.string()),
    })
    .optional(),
  /** Backend: the latest approve/reject decision; `null` = awaiting review. */
  latestReview: z
    .object({
      id: z.string(),
      decision: z.enum(['approve', 'reject']),
      reason: z.string(),
      comment: z.string(),
      reviewerName: z.string().optional(),
      createdAt: z.string(),
    })
    .nullable()
    .optional(),
});

export const opportunityListSchema = z.object({
  data: z.array(opportunitySchema),
  total: z.number(),
  page: z.number(),
  limit: z.number(),
});

export const updateOpportunitySchema = z.object({
  status: opportunityStatusSchema.optional(),
  saved: z.boolean().optional(),
  notes: z
    .string()
    .max(5000, 'Notes are limited to 5,000 characters')
    .optional(),
});

export const overviewSchema = z.object({
  newThisWeek: z.number(),
  pursuing: z.number(),
  activeAgents: z.number(),
  dueSoon: z.number(),
  upcoming: z.array(opportunitySchema),
  latest: z.array(opportunitySchema),
  /** Open opportunities at each stage. */
  pipeline: z.object({
    new: z.number(),
    reviewing: z.number(),
    pursuing: z.number(),
    submitted: z.number(),
  }),
  /** What needs someone, most urgent first. `target`: a run id, for failed runs. */
  attention: z.array(
    z.object({
      kind: z.enum([
        'deadline_without_proposal',
        'to_review',
        'eligibility_gap',
        'failed_runs',
      ]),
      count: z.number(),
      target: z.string(),
    })
  ),
  checklist: z.object({
    profile: z.boolean(),
    agent: z.boolean(),
    /** Mock only: integrations are not on the backend. */
    integration: z.boolean().optional(),
    teammate: z.boolean(),
  }),
});

export type OpportunityType = z.infer<typeof opportunityTypeSchema>;
export type OpportunityStatus = z.infer<typeof opportunityStatusSchema>;
export type Opportunity = z.infer<typeof opportunitySchema>;
export type OpportunityBusiness = NonNullable<Opportunity['business']>;
export type OpportunityList = z.infer<typeof opportunityListSchema>;
export type UpdateOpportunityInput = z.infer<typeof updateOpportunitySchema>;
export type Overview = z.infer<typeof overviewSchema>;

export const opportunityNotesSchema = z.object({
  notes: z.string().max(5000, 'Notes are limited to 5,000 characters'),
});
export const opportunityNotesResolver = zodResolver(opportunityNotesSchema);
export type OpportunityNotesInput = z.infer<typeof opportunityNotesSchema>;
