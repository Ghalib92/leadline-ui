/**
 * A job seeker's search runs on their own words: Leadline plans its searches and
 * scores each job from the description and instructions (with their CV and
 * preferences), so both are required and the form asks for context.
 */
export const JOB_SEARCH_COPY = {
  name: 'e.g. Remote AI engineer jobs',
  description: {
    label: 'What is this search for?',
    help: 'One sentence: the kind of job, where, and at what kind of company.',
    placeholder:
      'e.g. Remote or Nairobi AI engineering roles at product companies',
  },
  instructions: {
    label: 'What should it look for, and skip?',
    help: 'The more context, the better the jobs it finds: skills to match, level, industries, companies to prefer or avoid, deal-breakers.',
    placeholder:
      'e.g. Python, Django or LangGraph work building AI products; mid-level, remote or hybrid in Nairobi. Prefer fintech and SaaS. Skip sales, support and call-centre roles, and anything needing 8+ years.',
  },
} as const;
