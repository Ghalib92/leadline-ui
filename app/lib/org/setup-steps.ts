/**
 * Where each backend setup step (`GET /organizations/:id/setup`) is finished:
 * a Settings sheet opened via `?edit=…` (org-relative path).
 */
const stepLinks: Record<string, string> = {
  basics: '/settings/general?edit=basics',
  focus: '/settings/general?edit=focus',
  preferences: '/agents?tab=preferences&edit=preferences',
  documents: '/settings/general?tab=documents&edit=upload',
  links: '/settings/general?tab=links&edit=link',
  team: '/team',
};

export const stepHref = (key: string) => stepLinks[key] ?? '/settings/general';
