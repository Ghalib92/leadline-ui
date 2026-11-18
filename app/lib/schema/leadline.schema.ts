import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { opportunityDtoSchema } from './backend.schema';

/**
 * Reviews, insights, proposals, contacts, outreach and deadlines: backend-only
 * areas (`/organizations/:id/…`). DTOs are snake_case and mapped to camelCase
 * here. Contract: `my-docs/frontend-integration.md` (tasks 8–13) in leadline_backend.
 */

export const choiceSchema = z.object({ value: z.string(), label: z.string() });
export type Choice = z.infer<typeof choiceSchema>;

const person = z
  .object({ id: z.string(), name: z.string() })
  .nullable()
  .optional()
  .transform((value) => value ?? null);

// ---------------------------------------------------------------------------
// Reviews
// ---------------------------------------------------------------------------

export const reviewResultDtoSchema = z.object({
  opportunity: opportunityDtoSchema,
});

export const rejectFormSchema = z.object({
  reason: z.string().min(1, 'Pick a reason'),
  comment: z
    .string()
    .trim()
    .min(1, 'Say why, so the agents learn from it')
    .max(2000, 'Keep it under 2,000 characters'),
});
export const rejectFormResolver = zodResolver(rejectFormSchema);
export type RejectFormInput = z.infer<typeof rejectFormSchema>;

const countList = z.array(z.object({ key: z.string(), count: z.number() }));

export const insightsDtoSchema = z
  .object({
    days: z.number(),
    runs_by_week: z.array(
      z.object({
        week: z.string(),
        runs: z.number(),
        succeeded: z.number(),
        partial: z.number(),
        failed: z.number(),
        found: z.number(),
      })
    ),
    opportunities_found: z.number(),
    by_type: countList,
    by_source: countList,
    by_score: z.array(
      z.object({
        label: z.string(),
        min: z.number(),
        max: z.number(),
        count: z.number(),
      })
    ),
    reviews: z.object({
      approved: z.number(),
      rejected: z.number(),
      pending: z.number(),
      approval_rate: z.number().nullable(),
    }),
    rejection_reasons: countList,
  })
  .transform((dto) => ({
    days: dto.days,
    runsByWeek: dto.runs_by_week,
    opportunitiesFound: dto.opportunities_found,
    byType: dto.by_type,
    bySource: dto.by_source,
    byScore: dto.by_score,
    reviews: {
      approved: dto.reviews.approved,
      rejected: dto.reviews.rejected,
      pending: dto.reviews.pending,
      approvalRate: dto.reviews.approval_rate,
    },
    rejectionReasons: dto.rejection_reasons,
  }));
export type Insights = z.infer<typeof insightsDtoSchema>;

// ---------------------------------------------------------------------------
// Proposals
// ---------------------------------------------------------------------------

export const proposalStatuses = [
  'queued',
  'drafting',
  'ready',
  'failed',
] as const;
export type ProposalStatus = (typeof proposalStatuses)[number];

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');
const texts = z.array(z.string()).catch([]);

export const sectionSchema = z
  .object({
    key: z.string(),
    title: z.string(),
    purpose: text,
    key_points: texts,
    target_words: z.number().catch(0),
    content: text,
    evidence: z
      .array(
        z.object({
          n: z.number(),
          document_id: text,
          document_title: text,
          location: text,
          excerpt: text,
        })
      )
      .catch([]),
    missing_information: texts,
    drafted: z.boolean().catch(true),
  })
  .transform((dto) => ({
    key: dto.key,
    title: dto.title,
    purpose: dto.purpose,
    keyPoints: dto.key_points,
    targetWords: dto.target_words,
    content: dto.content,
    evidence: dto.evidence.map((item) => ({
      n: item.n,
      documentTitle: item.document_title,
      location: item.location,
      excerpt: item.excerpt,
    })),
    missingInformation: dto.missing_information,
    drafted: dto.drafted,
  }));
export type ProposalSection = z.infer<typeof sectionSchema>;

const requirementsSchema = z
  .object({
    summary: text,
    sections: z
      .array(
        z.object({
          title: z.string(),
          guidance: text,
          word_limit: z.number().nullish(),
        })
      )
      .catch([]),
    evaluation_criteria: texts,
    eligibility: texts,
    documents_required: texts,
    budget_rules: texts,
    format_rules: texts,
    deadline: text,
    // Tenders (bids) only.
    reference: text,
    key_dates: z
      .array(
        z.object({
          event: z.string(),
          date: z.string(),
          time: text,
          kind: text,
        })
      )
      .catch([]),
    submission: texts,
    pass_mark: text,
    bid_security: text,
    validity: text,
  })
  .partial()
  .nullish()
  .catch(null);

export const checklistStatuses = [
  'ready',
  'check',
  'missing',
  'prepare',
] as const;
export type ChecklistStatus = (typeof checklistStatuses)[number];

/** A tender requirement against the organization's documents. */
const checklistItemSchema = z
  .object({
    key: z.string(),
    n: z.number().catch(0),
    code: text,
    requirement: z.string(),
    kind: text,
    status: z.enum(checklistStatuses).catch('check'),
    documents: z
      .array(z.object({ id: z.string(), title: z.string() }))
      .catch([]),
    note: text,
    done: z.boolean().catch(false),
    done_at: z.string().nullish(),
  })
  .transform((dto) => ({
    key: dto.key,
    n: dto.n,
    code: dto.code,
    requirement: dto.requirement,
    kind: dto.kind,
    status: dto.status,
    documents: dto.documents,
    note: dto.note,
    done: dto.done,
    doneAt: dto.done_at ?? null,
  }));
export type ChecklistItem = z.infer<typeof checklistItemSchema>;

export const bidStepStates = ['done', 'past', 'today', 'upcoming'] as const;

/** The steps to a submitted bid, counted back from closing (worked out by the server). */
const bidPlanSchema = z
  .object({
    closes_at: z.string(),
    days_left: z.number(),
    closed: z.boolean().catch(false),
    tight: z.boolean().catch(false),
    steps: z
      .array(
        z.object({
          key: z.string(),
          title: z.string(),
          due: z.string(),
          time: text,
          from_tender: z.boolean().catch(false),
          note: text,
          state: z.enum(bidStepStates).catch('upcoming'),
        })
      )
      .catch([]),
  })
  .transform((dto) => ({
    closesAt: dto.closes_at,
    daysLeft: dto.days_left,
    closed: dto.closed,
    tight: dto.tight,
    steps: dto.steps.map((step) => ({
      key: step.key,
      title: step.title,
      due: step.due,
      time: step.time,
      fromTender: step.from_tender,
      note: step.note,
      state: step.state,
    })),
  }));
export type BidPlan = z.infer<typeof bidPlanSchema>;

const reviewSchema = z
  .object({
    score: z.number(),
    strengths: texts,
    issues: z
      .array(z.object({ section: text, issue: z.string(), suggestion: text }))
      .catch([]),
    missing_requirements: texts,
  })
  .nullish()
  .catch(null);

export const proposalDtoSchema = z
  .object({
    id: z.string(),
    opportunity: z.object({
      id: z.string(),
      title: z.string(),
      funder: text,
      deadline: z.string().nullable(),
      status: z.string(),
      opportunity_type: text,
    }),
    status: z.enum(proposalStatuses).catch('failed'),
    job: z
      .object({
        kind: z.string(),
        section: text,
        instructions: text,
        queued_at: z.string().nullable(),
        started_at: z.string().nullable(),
      })
      .nullish(),
    version: z.number(),
    warning: text,
    error: text,
    drafted_at: z.string().nullable(),
    sections: z.array(sectionSchema).default([]),
    requirements: requirementsSchema,
    checklist: z.array(checklistItemSchema).catch([]).default([]),
    checked_at: z.string().nullish(),
    bid_plan: bidPlanSchema.nullish().catch(null),
    review: reviewSchema,
    models_used: z.record(z.string(), z.string()).catch({}),
    usage: z.record(z.string(), z.number()).catch({}),
    knowledge: z
      .object({
        source: z.enum(['proposal', 'run']).catch('run'),
        mode: z.enum(['all', 'folders', 'none']).catch('all'),
        folders: z
          .array(z.object({ id: z.string(), name: z.string() }))
          .default([]),
      })
      .nullish()
      .catch(null),
  })
  .transform((dto) => ({
    id: dto.id,
    opportunity: dto.opportunity,
    status: dto.status,
    job: dto.job ?? null,
    version: dto.version,
    warning: dto.warning,
    error: dto.error,
    draftedAt: dto.drafted_at,
    sections: dto.sections,
    requirements: dto.requirements ?? null,
    // Tenders are bids: a compliance checklist and a deadline plan come with them.
    isTender: dto.opportunity.opportunity_type === 'tender',
    checklist: dto.checklist,
    checkedAt: dto.checked_at ?? null,
    bidPlan: dto.bid_plan ?? null,
    review: dto.review ?? null,
    modelsUsed: dto.models_used,
    usage: dto.usage,
    // Which company documents evidence comes from; `run` follows the finding run.
    knowledge: dto.knowledge ?? {
      source: 'run' as const,
      mode: 'all' as const,
      folders: [],
    },
  }));
export type Proposal = z.infer<typeof proposalDtoSchema>;

/** Choose the proposal's documents: follow the run, all, some folders, or none. */
export const proposalKnowledgeFormSchema = z
  .object({
    mode: z.enum(['run', 'all', 'selected', 'none']),
    folders: z.array(z.string()),
  })
  .refine((form) => form.mode !== 'selected' || form.folders.length, {
    path: ['folders'],
    message: 'Pick at least one folder',
  });
export type ProposalKnowledgeForm = z.infer<typeof proposalKnowledgeFormSchema>;
export const proposalKnowledgeResolver = zodResolver(
  proposalKnowledgeFormSchema
);

export const proposalEventsDtoSchema = z.object({
  status: z.enum(proposalStatuses).catch('failed'),
  last_seq: z.number(),
  events: z.array(
    z.object({
      seq: z.number(),
      step: z.string(),
      level: z.string(),
      message: z.string(),
      at: z.string(),
    })
  ),
});
export type ProposalEvents = z.infer<typeof proposalEventsDtoSchema>;

export const versionSummarySchema = z
  .object({
    number: z.number(),
    source: z.string(),
    note: text,
    created_by: person,
    created_at: z.string(),
  })
  .transform((dto) => ({
    number: dto.number,
    source: dto.source,
    note: dto.note,
    createdBy: dto.created_by,
    createdAt: dto.created_at,
  }));
export type VersionSummary = z.infer<typeof versionSummarySchema>;

// ---------------------------------------------------------------------------
// Contacts and outreach
// ---------------------------------------------------------------------------

export const contactDtoSchema = z
  .object({
    id: z.string(),
    opportunity_id: z.string(),
    name: text,
    role: text,
    email: text,
    phone: text,
    kind: z.enum(['person', 'inbox']).catch('person'),
    relevance: text,
    confidence: z.number(),
    source: z.enum(['page', 'hunter', 'manual']).catch('manual'),
    source_url: text,
    verified: z.boolean(),
    do_not_contact: z.boolean(),
    notes: text,
    can_email: z.boolean(),
  })
  .transform((dto) => ({
    id: dto.id,
    opportunityId: dto.opportunity_id,
    name: dto.name,
    role: dto.role,
    email: dto.email,
    phone: dto.phone,
    kind: dto.kind,
    relevance: dto.relevance,
    confidence: dto.confidence,
    source: dto.source,
    sourceUrl: dto.source_url,
    verified: dto.verified,
    doNotContact: dto.do_not_contact,
    notes: dto.notes,
    canEmail: dto.can_email,
  }));
export type Contact = z.infer<typeof contactDtoSchema>;

export const contactSearchDtoSchema = z
  .object({
    id: z.string(),
    status: z.enum(['queued', 'running', 'done', 'failed']),
    found: z.number(),
    warning: text,
    error: text,
    finished_at: z.string().nullable(),
    created_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    status: dto.status,
    found: dto.found,
    warning: dto.warning,
    error: dto.error,
    finishedAt: dto.finished_at,
    createdAt: dto.created_at,
  }));
export type ContactSearch = z.infer<typeof contactSearchDtoSchema>;

export const emailStatuses = [
  'drafting',
  'draft',
  'sending',
  'sent',
  'failed',
  'discarded',
] as const;
export type EmailStatus = (typeof emailStatuses)[number];

export const outreachEmailDtoSchema = z
  .object({
    id: z.string(),
    opportunity: z.object({
      id: z.string(),
      title: z.string(),
      funder: text,
      deadline: z.string().nullable(),
      status: z.string(),
    }),
    contact_id: z.string().nullable(),
    to_email: z.string(),
    to_name: text,
    purpose: z.string(),
    instructions: text,
    subject: text,
    body: text,
    status: z.enum(emailStatuses),
    error: text,
    created_by: person,
    approved_by: person,
    approved_at: z.string().nullable(),
    sent_at: z.string().nullable(),
    updated_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    opportunity: dto.opportunity,
    contactId: dto.contact_id,
    toEmail: dto.to_email,
    toName: dto.to_name,
    purpose: dto.purpose,
    instructions: dto.instructions,
    subject: dto.subject,
    body: dto.body,
    status: dto.status,
    error: dto.error,
    createdBy: dto.created_by,
    approvedBy: dto.approved_by,
    approvedAt: dto.approved_at,
    sentAt: dto.sent_at,
    updatedAt: dto.updated_at,
  }));
export type OutreachEmail = z.infer<typeof outreachEmailDtoSchema>;

export const contactFormSchema = z
  .object({
    name: z.string().trim().max(150),
    role: z.string().trim().max(150),
    email: z.union([z.literal(''), z.string().trim().email('Not an email')]),
    phone: z.string().trim().max(40),
  })
  .refine((v) => v.name || v.email || v.phone, {
    message: 'Give at least a name, an email or a phone number',
    path: ['name'],
  });
export const contactFormResolver = zodResolver(contactFormSchema);
export type ContactFormInput = z.infer<typeof contactFormSchema>;

export const emailDraftFormSchema = z.object({
  purpose: z.string().min(1, 'Pick what the email is for'),
  instructions: z.string().max(2000, 'Keep it under 2,000 characters'),
});
export const emailDraftFormResolver = zodResolver(emailDraftFormSchema);
export type EmailDraftFormInput = z.infer<typeof emailDraftFormSchema>;

export const emailEditFormSchema = z.object({
  subject: z.string().trim().min(1, 'Add a subject').max(200),
  body: z.string().trim().min(1, 'Write the message').max(20000),
});
export const emailEditFormResolver = zodResolver(emailEditFormSchema);
export type EmailEditFormInput = z.infer<typeof emailEditFormSchema>;

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

export const deadlineDtoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    funder: text,
    opportunity_type: z.string(),
    status: z.string(),
    saved: z.boolean(),
    deadline: z.string(),
    days_left: z.number(),
    source_url: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    title: dto.title,
    funder: dto.funder,
    kind: dto.opportunity_type,
    status: dto.status,
    saved: dto.saved,
    deadline: dto.deadline,
    daysLeft: dto.days_left,
    sourceUrl: dto.source_url,
  }));
export type Deadline = z.infer<typeof deadlineDtoSchema>;

export const reminderPreferenceSchema = z
  .object({ enabled: z.boolean(), days_before: z.array(z.number()) })
  .transform((dto) => ({ enabled: dto.enabled, daysBefore: dto.days_before }));
export type ReminderPreference = z.infer<typeof reminderPreferenceSchema>;

export const sectionEditSchema = z.object({
  content: z.string().trim().min(1, 'The section cannot be empty'),
});
export const sectionEditResolver = zodResolver(sectionEditSchema);
export type SectionEditInput = z.infer<typeof sectionEditSchema>;

export const rewriteFormSchema = z.object({
  instructions: z.string().max(1000, 'Keep it under 1,000 characters'),
});
export const rewriteFormResolver = zodResolver(rewriteFormSchema);
export type RewriteFormInput = z.infer<typeof rewriteFormSchema>;
