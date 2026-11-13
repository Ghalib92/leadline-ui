import {
  keepPreviousData,
  useQuery,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  documentDtoSchema,
  folderDtoSchema,
  dossierDtoSchema,
  linkDtoSchema,
  orgDtoSchema,
  orgSourceDtoSchema,
  overviewDtoSchema,
  paginated,
  preferencesDtoSchema,
  setupStatusSchema,
  toMyOrg,
  type Dossier,
  type MyOrg,
  type KnowledgeFolder,
  type OrgDocument,
  type OrgLink,
  type OrgSource,
  type OrgView,
  type Overview,
  type PreferencesView,
  type SetupStatus,
} from '~/lib/schema';
import { collectPages, findBySlug } from './map';
import { orgKeys, type DocumentFilters } from './query-keys';

const orgPage = paginated(orgDtoSchema);

/** Every organization I belong to, on the backend's contract. */
async function fetchMyOrgViews(): Promise<OrgView[]> {
  return collectPages(async (page) => {
    const { data } = await apiClient.get('/organizations', {
      params: { page, page_size: 100 },
    });
    return orgPage.parse(data);
  });
}

const myOrgsQuery = (enabled = true) => ({
  queryKey: orgKeys.mine(),
  queryFn: fetchMyOrgViews,
  enabled,
});

export const useMyOrgViews = (enabled = true) => useQuery(myOrgsQuery(enabled));

/** The legacy `MyOrg` shape the sidebar, switcher and landing still use. */
export const useMyOrgs = (enabled = true) =>
  useQuery({
    ...myOrgsQuery(enabled),
    select: (views: OrgView[]): MyOrg[] => views.map((view) => toMyOrg(view)),
  });

export interface ActiveOrg extends MyOrg {
  view: OrgView;
  preferences: PreferencesView;
}

async function fetchPreferences(orgId: string): Promise<PreferencesView> {
  const { data } = await apiClient.get(`/organizations/${orgId}/preferences`);
  return preferencesDtoSchema.parse(data);
}

async function fetchActiveOrg(
  queryClient: QueryClient,
  slug: string
): Promise<ActiveOrg> {
  // The URL carries the slug; the API is keyed by id. My orgs list has both.
  const views = await queryClient.fetchQuery({
    queryKey: orgKeys.mine(),
    queryFn: fetchMyOrgViews,
    staleTime: 30_000,
  });
  const view = findBySlug(views, slug);
  const preferences = await queryClient.fetchQuery({
    queryKey: orgKeys.preferences(view.id),
    queryFn: () => fetchPreferences(view.id),
  });
  return { ...toMyOrg(view, preferences), view, preferences };
}

/** No retry: a 404 is an answer, not a blip. */
export const useOrgBySlug = (slug: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: orgKeys.bySlug(slug),
    queryFn: () => fetchActiveOrg(queryClient, slug),
    enabled: !!slug,
    retry: false,
    // Pick up archive / removal soon after it happens elsewhere.
    staleTime: 30_000,
    refetchOnWindowFocus: true,
  });
};

export const usePreferences = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.preferences(orgId),
    queryFn: () => fetchPreferences(orgId),
    enabled: !!orgId,
  });

export const useSetupStatus = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.setup(orgId),
    queryFn: async (): Promise<SetupStatus> => {
      const { data } = await apiClient.get(`/organizations/${orgId}/setup`);
      return setupStatusSchema.parse(data);
    },
    enabled: !!orgId,
  });

export const useLinks = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.links(orgId),
    queryFn: async (): Promise<OrgLink[]> => {
      const { data } = await apiClient.get(`/organizations/${orgId}/links`);
      return linkDtoSchema.array().parse(data);
    },
    enabled: !!orgId,
  });

export const useFolders = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.folders(orgId),
    queryFn: async (): Promise<KnowledgeFolder[]> => {
      const { data } = await apiClient.get(`/organizations/${orgId}/folders`);
      return folderDtoSchema.array().parse(data);
    },
    enabled: !!orgId,
  });

export const useSources = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.sources(orgId),
    queryFn: async (): Promise<OrgSource[]> => {
      const { data } = await apiClient.get(`/organizations/${orgId}/sources`);
      return orgSourceDtoSchema.array().parse(data);
    },
    enabled: !!orgId,
  });

const documentPage = paginated(documentDtoSchema);

/** How often to re-check while the AI is still working in the background. */
export const backgroundPollMs = 3000;

const isInProgress = (doc: OrgDocument) =>
  doc.processingStatus === 'pending' || doc.processingStatus === 'processing';

export const useDocuments = (orgId: string, filters: DocumentFilters = {}) =>
  useQuery({
    // Keep the list on screen while a new search runs.
    placeholderData: keepPreviousData,
    // Processing runs in a background job; poll until every document settles.
    refetchInterval: (query) =>
      query.state.data?.some(isInProgress) ? backgroundPollMs : false,
    queryKey: orgKeys.documents(orgId, filters),
    queryFn: async (): Promise<OrgDocument[]> => {
      // ponytail: first 100 only; add paging when an org keeps more documents.
      const { data } = await apiClient.get(
        `/organizations/${orgId}/documents`,
        {
          params: { page_size: 100, ...filters },
        }
      );
      return documentPage.parse(data).results;
    },
    enabled: !!orgId,
  });

/** What the AI knows about the organization. Polls while it is being written. */
export const useDossier = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.dossier(orgId),
    queryFn: async (): Promise<Dossier> => {
      const { data } = await apiClient.get(`/organizations/${orgId}/dossier`);
      return dossierDtoSchema.parse(data);
    },
    refetchInterval: (query) =>
      query.state.data?.status === 'generating' ? backgroundPollMs : false,
    enabled: !!orgId,
  });

/** Dashboard numbers: the backend's `overview/`. */
export const useOrgOverview = (orgId: string) =>
  useQuery({
    queryKey: orgKeys.overview(orgId),
    queryFn: async (): Promise<Overview> => {
      const { data } = await apiClient.get(orgApi(orgId, '/overview'));
      return overviewDtoSchema.parse(data);
    },
    enabled: !!orgId,
  });
