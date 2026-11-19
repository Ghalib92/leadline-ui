import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';

/**
 * Client leads after approval: the pitch (what to say), calls and messages logged by
 * people, and the call list. Backend: `apps/outreach` (pitch, activity, call-list).
 * Nothing is sent by Leadline; people send from their own phone or email.
 *
 * For a job seeker the same log and list track their applications (applied,
 * interview, offer…), and an approved job gets a cover letter and a tailored CV
 * (`application`). They apply themselves.
 */

const text = z
  .string()
  .nullish()
  .transform((value) => value ?? '');

const person = z
  .object({ id: z.string(), name: z.string() })
  .nullable()
  .optional()
  .transform((value) => value ?? null);

// ---------------------------------------------------------------------------
// Vocabularies (apps/outreach/choices.py)
// ---------------------------------------------------------------------------

export const leadChannels = [
  { value: 'call', label: 'Phone call' },
  { value: 'whatsapp', label: 'WhatsApp' },
  { value: 'email', label: 'Email' },
  { value: 'visit', label: 'Visit' },
  { value: 'online', label: 'Online form or job site' },
  { value: 'other', label: 'Other' },
] as const;
export type LeadChannel = (typeof leadChannels)[number]['value'];

export const leadOutcomes = [
  { value: 'no_answer', label: 'No answer' },
  { value: 'call_back', label: 'Asked us to call back' },
  { value: 'message_sent', label: 'Message sent, waiting' },
  { value: 'talked', label: 'Talked, not decided' },
  { value: 'interested', label: 'Interested' },
  { value: 'meeting', label: 'Meeting booked' },
  { value: 'not_interested', label: 'Not interested' },
  { value: 'wrong_contact', label: 'Wrong number or contact' },
  // A job seeker's application steps.
  { value: 'applied', label: 'Applied' },
  { value: 'interview', label: 'Interview booked' },
  { value: 'offer', label: 'Offer received' },
  { value: 'rejected', label: 'Not selected' },
  { value: 'withdrew', label: 'Withdrew' },
] as const;
export type LeadOutcome = (typeof leadOutcomes)[number]['value'];

const JOB_OUTCOME_VALUES: readonly LeadOutcome[] = [
  'applied',
  'interview',
  'offer',
  'rejected',
  'withdrew',
];
/** What can happen with a client lead, or with a job application. */
export const clientOutcomes = leadOutcomes.filter(
  (o) => !JOB_OUTCOME_VALUES.includes(o.value)
);
export const jobOutcomes = leadOutcomes.filter((o) =>
  JOB_OUTCOME_VALUES.includes(o.value)
);
/** How a job seeker applied or heard back (no visits to sell to). */
export const jobChannels = leadChannels.filter((c) =>
  ['online', 'email', 'call', 'whatsapp', 'other'].includes(c.value)
);

/** After these, nobody needs to reach the business (or employer) again. */
export const CLOSED_OUTCOMES: readonly LeadOutcome[] = [
  'not_interested',
  'wrong_contact',
  'rejected',
  'withdrew',
];

const channelValues = leadChannels.map((c) => c.value) as [
  LeadChannel,
  ...LeadChannel[],
];
const outcomeValues = leadOutcomes.map((o) => o.value) as [
  LeadOutcome,
  ...LeadOutcome[],
];

export const callListViews = [
  { value: 'to_contact', label: 'To contact' },
  { value: 'follow_up', label: 'Follow up' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
] as const;
export type CallListView = (typeof callListViews)[number]['value'];

/** The same views, named for a job seeker's application tracker. */
export const applicationViews = [
  { value: 'to_contact', label: 'To apply' },
  { value: 'follow_up', label: 'In progress' },
  { value: 'closed', label: 'Closed' },
  { value: 'all', label: 'All' },
] as const satisfies readonly { value: CallListView; label: string }[];

// ---------------------------------------------------------------------------
// The pitch
// ---------------------------------------------------------------------------

export const pitchStatuses = ['writing', 'ready', 'failed'] as const;
export type PitchStatus = (typeof pitchStatuses)[number];

export const pitchDtoSchema = z
  .object({
    id: z.string(),
    status: z.enum(pitchStatuses),
    whatsapp: text,
    email_subject: text,
    email_body: text,
    call_points: z.array(z.string()).default([]),
    /** International digits for wa.me, "" when the number can't be placed. */
    whatsapp_number: text,
    instructions: text,
    error: text,
    edited_by: person,
    edited_at: z.string().nullish(),
    updated_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    status: dto.status,
    whatsapp: dto.whatsapp,
    emailSubject: dto.email_subject,
    emailBody: dto.email_body,
    callPoints: dto.call_points,
    whatsappNumber: dto.whatsapp_number,
    instructions: dto.instructions,
    error: dto.error,
    editedBy: dto.edited_by,
    editedAt: dto.edited_at ?? null,
    updatedAt: dto.updated_at,
  }));
export type LeadPitch = z.infer<typeof pitchDtoSchema>;

export const pitchFormSchema = z.object({
  whatsapp: z.string().trim().max(2000, 'Keep it under 2,000 characters'),
  emailSubject: z.string().trim().max(200, 'Keep it under 200 characters'),
  emailBody: z.string().trim().max(5000, 'Keep it under 5,000 characters'),
  /** One talking point per line. */
  callPoints: z.string().max(1500),
});
export const pitchFormResolver = zodResolver(pitchFormSchema);
export type PitchFormInput = z.infer<typeof pitchFormSchema>;

export const toPitchBody = (input: PitchFormInput) => ({
  whatsapp: input.whatsapp,
  email_subject: input.emailSubject,
  email_body: input.emailBody,
  call_points: input.callPoints
    .split('\n')
    .map((point) => point.trim())
    .filter(Boolean)
    .slice(0, 4),
});

// ---------------------------------------------------------------------------
// Calls and messages
// ---------------------------------------------------------------------------

export const leadActivityDtoSchema = z
  .object({
    id: z.string(),
    channel: z.enum(channelValues).catch('other'),
    outcome: z.enum(outcomeValues).catch('talked'),
    note: text,
    follow_up_on: z.string().nullish(),
    actor: person,
    created_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    channel: dto.channel,
    outcome: dto.outcome,
    note: dto.note,
    followUpOn: dto.follow_up_on ?? null,
    actor: dto.actor,
    createdAt: dto.created_at,
  }));
export type LeadActivity = z.infer<typeof leadActivityDtoSchema>;

export const logActivityFormSchema = z
  .object({
    channel: z.enum(channelValues, { message: 'Pick how you reached them' }),
    outcome: z.enum(outcomeValues, { message: 'Pick what happened' }),
    note: z.string().trim().max(2000, 'Keep it under 2,000 characters'),
    /** yyyy-mm-dd, or empty for none. */
    followUpOn: z.string(),
  })
  .refine((v) => !(v.followUpOn && CLOSED_OUTCOMES.includes(v.outcome)), {
    message: 'Nothing to follow up once it’s closed',
    path: ['followUpOn'],
  });
export const logActivityFormResolver = zodResolver(logActivityFormSchema);
export type LogActivityFormInput = z.infer<typeof logActivityFormSchema>;

export const toActivityBody = (input: LogActivityFormInput) => ({
  channel: input.channel,
  outcome: input.outcome,
  note: input.note,
  follow_up_on: input.followUpOn || null,
});

// ---------------------------------------------------------------------------
// The call list
// ---------------------------------------------------------------------------

export const callListItemDtoSchema = z
  .object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    match_score: z.number(),
    location: text,
    /** A job's employer. */
    funder: text,
    deadline: z.string().nullish(),
    /** Where to apply for a job ("" for client leads). */
    apply_url: text,
    application: z
      .object({ status: z.enum(pitchStatuses).catch('ready') })
      .nullish(),
    category: text,
    phone: text,
    whatsapp_number: text,
    email: text,
    website: text,
    website_status: text,
    evidence: z.array(z.string()).default([]),
    pitch: z
      .object({
        status: z.enum(pitchStatuses).catch('ready'),
        whatsapp: text,
        email_subject: text,
        email_body: text,
      })
      .nullish(),
    last_outcome: z.enum(outcomeValues).nullish().catch(null),
    last_channel: z.enum(channelValues).nullish().catch(null),
    last_note: text,
    last_contacted_at: z.string().nullish(),
    follow_up_on: z.string().nullish(),
  })
  .transform((dto) => ({
    id: dto.id,
    title: dto.title,
    status: dto.status,
    matchScore: dto.match_score,
    location: dto.location,
    funder: dto.funder,
    deadline: dto.deadline ?? null,
    applyUrl: dto.apply_url,
    application: dto.application ? { status: dto.application.status } : null,
    category: dto.category,
    phone: dto.phone,
    whatsappNumber: dto.whatsapp_number,
    email: dto.email,
    website: dto.website,
    websiteStatus: dto.website_status,
    evidence: dto.evidence,
    pitch: dto.pitch
      ? {
          status: dto.pitch.status,
          whatsapp: dto.pitch.whatsapp,
          emailSubject: dto.pitch.email_subject,
          emailBody: dto.pitch.email_body,
        }
      : null,
    lastOutcome: dto.last_outcome ?? null,
    lastChannel: dto.last_channel ?? null,
    lastNote: dto.last_note,
    lastContactedAt: dto.last_contacted_at ?? null,
    followUpOn: dto.follow_up_on ?? null,
  }));
export type CallListItem = z.infer<typeof callListItemDtoSchema>;

// ---------------------------------------------------------------------------
// A job application: the cover letter and tailored CV for an approved job
// ---------------------------------------------------------------------------

export const applicationDtoSchema = z
  .object({
    id: z.string(),
    status: z.enum(pitchStatuses),
    cover_letter: text,
    /** Simple Markdown ("# Name", "## Experience", "- " bullets). */
    cv: text,
    gaps: z.array(z.string()).default([]),
    /** Lines of the CV or letter that the original CV doesn't support. */
    unverified: z.array(z.string()).default([]),
    cv_document_title: text,
    apply_url: text,
    instructions: text,
    error: text,
    edited_by: person,
    edited_at: z.string().nullish(),
    updated_at: z.string(),
  })
  .transform((dto) => ({
    id: dto.id,
    status: dto.status,
    coverLetter: dto.cover_letter,
    cv: dto.cv,
    gaps: dto.gaps,
    unverified: dto.unverified,
    cvDocumentTitle: dto.cv_document_title,
    applyUrl: dto.apply_url,
    instructions: dto.instructions,
    error: dto.error,
    editedBy: dto.edited_by,
    editedAt: dto.edited_at ?? null,
    updatedAt: dto.updated_at,
  }));
export type JobApplication = z.infer<typeof applicationDtoSchema>;

export const applicationFormSchema = z.object({
  coverLetter: z.string().trim().max(6000, 'Keep it under 6,000 characters'),
  cv: z.string().trim().max(15000, 'Keep it under 15,000 characters'),
});
export const applicationFormResolver = zodResolver(applicationFormSchema);
export type ApplicationFormInput = z.infer<typeof applicationFormSchema>;

export const toApplicationBody = (input: ApplicationFormInput) => ({
  cover_letter: input.coverLetter,
  cv: input.cv,
});

// ---------------------------------------------------------------------------
// Links that open the person's own apps (nothing is sent by Leadline)
// ---------------------------------------------------------------------------

/** WhatsApp click-to-chat with the message filled in; the person presses send. */
export function whatsappLink(number: string, message = '') {
  if (!/^\d{8,15}$/.test(number)) return null;
  const query = message ? `?text=${encodeURIComponent(message)}` : '';
  return `https://wa.me/${number}${query}`;
}

/** The person's email app with the pitch filled in. */
export function mailtoLink(email: string, subject = '', body = '') {
  if (!email) return null;
  const params = new URLSearchParams();
  if (subject) params.set('subject', subject);
  if (body) params.set('body', body);
  // mailto wants %20 for spaces, not "+".
  const query = params.toString().replaceAll('+', '%20');
  return `mailto:${email}${query ? `?${query}` : ''}`;
}
