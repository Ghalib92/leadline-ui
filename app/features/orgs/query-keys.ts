export const orgKeys = {
  all: ['orgs'] as const,
  mine: () => [...orgKeys.all, 'mine'] as const,
  bySlug: (slug: string) => [...orgKeys.all, 'slug', slug] as const,
  overview: (orgId: string) => [...orgKeys.all, orgId, 'overview'] as const,
  setup: (orgId: string) => [...orgKeys.all, orgId, 'setup'] as const,
  preferences: (orgId: string) =>
    [...orgKeys.all, orgId, 'preferences'] as const,
  clientBrief: (orgId: string) =>
    [...orgKeys.all, orgId, 'client-brief'] as const,
  tenderBrief: (orgId: string) =>
    [...orgKeys.all, orgId, 'tender-brief'] as const,
  jobBrief: (orgId: string) => [...orgKeys.all, orgId, 'job-brief'] as const,
  links: (orgId: string) => [...orgKeys.all, orgId, 'links'] as const,
  sources: (orgId: string) => [...orgKeys.all, orgId, 'sources'] as const,
  documents: (orgId: string, filters: DocumentFilters = {}) =>
    [...orgKeys.all, orgId, 'documents', filters] as const,
  dossier: (orgId: string) => [...orgKeys.all, orgId, 'dossier'] as const,
  folders: (orgId: string) => [...orgKeys.all, orgId, 'folders'] as const,
};

export interface DocumentFilters {
  category?: string;
  search?: string;
  folder?: string;
}
