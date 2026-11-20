/**
 * Where each backend setup step (`GET /organizations/:id/setup`) is finished:
 * a Settings sheet opened via `?edit=…` (org-relative path).
 */
const stepLinks: Record<string, string> = {
  basics: '/settings/general?edit=basics',
  focus: '/settings/general?edit=focus',
  preferences: '/agents?tab=preferences&edit=preferences',
  client_brief: '/agents?tab=clients&edit=client_brief',
  tender_brief: '/agents?tab=tenders&edit=tender_brief',
  documents: '/settings/general?tab=documents&edit=upload',
  links: '/settings/general?tab=links&edit=link',
  team: '/team',
  // A job seeker's steps: all on Profile & CV.
  job_brief: '/settings/general?edit=job_brief',
  skills: '/settings/general?edit=job_brief',
  cv: '/settings/general?tab=cv',
};

export const stepHref = (key: string) => stepLinks[key] ?? '/settings/general';
