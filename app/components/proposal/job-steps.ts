import type { Proposal } from '~/lib/schema';

const STEPS = [
  { key: 'requirements', label: 'Reading what the call asks for' },
  { key: 'outline', label: 'Planning the sections' },
  { key: 'evidence', label: 'Finding evidence in your documents' },
  { key: 'draft', label: 'Writing each section' },
  { key: 'review', label: 'Checking it against the requirements' },
];
const BID_STEPS = [
  { key: 'requirements', label: 'Reading the tender documents' },
  {
    key: 'checklist',
    label: 'Checking your documents against its requirements',
  },
  ...STEPS.slice(1),
];

/** The progress steps of the running job: a full draft, one section, or a recheck. */
export function jobSteps(proposal: Pick<Proposal, 'job' | 'isTender'>) {
  if (proposal.job?.kind === 'section')
    return STEPS.filter((s) => s.key === 'evidence' || s.key === 'draft');
  if (proposal.job?.kind === 'checklist')
    return BID_STEPS.filter((s) => s.key === 'checklist');
  return proposal.isTender ? BID_STEPS : STEPS;
}
