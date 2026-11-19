import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import {
  documentDtoSchema,
  dossierDtoSchema,
  folderDtoSchema,
  linkDtoSchema,
  orgDtoSchema,
  orgSourceDtoSchema,
  preferencesDtoSchema,
  toOrgWrite,
  toPreferencesWrite,
  type DocumentUpdateForm,
  type DocumentUploadForm,
  type FolderForm,
  type KnowledgeFolder,
  type LinkForm,
  type OnboardingForm,
  type OrgDocument,
  type OrgProfileForm,
  type OrgSource,
  type OrgSourceForm,
  type OrgView,
  type PreferencesForm,
  clientBriefDtoSchema,
  tenderBriefDtoSchema,
  jobBriefDtoSchema,
  toClientBriefWrite,
  toTenderBriefWrite,
  toJobBriefWrite,
  type ClientBrief,
  type ClientBriefForm,
  type TenderBrief,
  type JobBrief,
  type JobBriefForm,
  type CandidateOnboarding,
  type TenderBriefForm,
} from '~/lib/schema';
import { agentKeys } from '../agents/query-keys';
import { runKeys } from '../runs/query-keys';
import { orgKeys } from './query-keys';

const base = (orgId: string) => `/organizations/${orgId}`;
/** Up to 25 MB on a slow uplink takes minutes, not the default 30 s. */
const fileTransferTimeout = 5 * 60_000;

/** Refresh everything org-level, incl. the setup checklist. */
/** Org writes also refresh agents: each shows the org's settings it adds to. */
function useRefreshOrg() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: agentKeys.all });
    return queryClient.invalidateQueries({ queryKey: orgKeys.all });
  };
}

export interface CreateOrgResult {
  view: OrgView;
  /** Steps after creation that didn't save (the org exists regardless). */
  failed: string[];
}

/**
 * Onboarding: create the organization *with* its team invitations in one
 * request (the backend creates nothing unless every invitation is valid),
 * then save its preferences. Only the preferences can fail on their own —
 * reported so the setup checklist picks them up.
 */
/** A job seeker's own workspace, then their job preferences. */
export const useCreateCandidateWorkspace = () => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (
      input: CandidateOnboarding
    ): Promise<CreateOrgResult> => {
      const { data } = await apiClient.post('/organizations', {
        account_type: 'candidate',
        name: input.name,
        country: input.country,
        city: input.city,
        description: input.description,
      });
      const view = orgDtoSchema.parse(data);
      const failed: string[] = [];
      await apiClient
        .patch(
          `${base(view.id)}/job-brief`,
          toJobBriefWrite({
            headline: input.headline,
            targetRoles: input.targetRoles,
            seniority: input.seniority as JobBriefForm['seniority'],
            workplaces: input.workplaces as JobBriefForm['workplaces'],
            skills: input.skills,
            yearsExperience: input.yearsExperience,
          })
        )
        .catch(() => failed.push('job preferences'));
      return { view, failed };
    },
    onSuccess: refresh,
  });
};

export const useCreateOrg = () => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: OnboardingForm): Promise<CreateOrgResult> => {
      const { data } = await apiClient.post('/organizations', {
        name: input.name,
        organization_type: input.organizationType,
        country: input.country,
        goals: input.goals,
        description: input.description,
        mission: input.mission,
        offerings: input.offerings,
        sectors: input.sectors,
        invitations: input.inviteEmails.map((email) => ({
          email,
          role: input.inviteRole,
        })),
      });
      const view = orgDtoSchema.parse(data);
      const failed: string[] = [];
      // The brief of each goal picked; each saves on its own, so one failure
      // doesn't lose the others (the setup checklist asks for what's missing).
      const save = (path: string, body: object, step: string) =>
        apiClient
          .patch(`${base(view.id)}/${path}`, body)
          .catch(() => failed.push(step));

      await Promise.all([
        input.goals.includes('grants') &&
          save(
            'preferences',
            {
              opportunity_types: input.opportunityTypes,
              geographic_scopes: input.geographicScopes,
              target_regions: input.targetRegions,
            },
            'preferences'
          ),
        input.goals.includes('clients') &&
          save(
            'client-brief',
            toClientBriefWrite({
              services: input.services,
              customerTypes: input.customerTypes,
              targetCities: input.targetCities,
            }),
            'clients brief'
          ),
        input.goals.includes('tenders') &&
          save(
            'tender-brief',
            toTenderBriefWrite({ tenderCategories: input.tenderCategories }),
            'tenders brief'
          ),
      ]);

      return { view, failed };
    },
    onSettled: refresh,
  });
};

export const useUpdateOrg = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: OrgProfileForm): Promise<OrgView> => {
      const { data } = await apiClient.patch(base(orgId), toOrgWrite(input));
      return orgDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

const orgAction = (action: 'archive' | 'restore') => (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (): Promise<OrgView> => {
      const { data } = await apiClient.post(`${base(orgId)}/${action}`);
      return orgDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};
export const useArchiveOrg = orgAction('archive');
export const useRestoreOrg = orgAction('restore');

/** Callers navigate away (to `/app`) on success. */
export const useLeaveOrg = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (): Promise<void> => {
      await apiClient.post(`${base(orgId)}/leave`);
    },
    onSuccess: refresh,
  });
};

export const useUpdatePreferences = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: PreferencesForm) => {
      const { data } = await apiClient.patch(
        `${base(orgId)}/preferences`,
        toPreferencesWrite(input)
      );
      return preferencesDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useSaveLink = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async ({ id, ...input }: LinkForm & { id?: string }) => {
      const { data } = id
        ? await apiClient.patch(`${base(orgId)}/links/${id}`, input)
        : await apiClient.post(`${base(orgId)}/links`, input);
      return linkDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useRemoveLink = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (linkId: string) => {
      await apiClient.delete(`${base(orgId)}/links/${linkId}`);
    },
    onSuccess: refresh,
  });
};

export const useSaveSource = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: OrgSourceForm & { id?: string }): Promise<OrgSource> => {
      const { data } = id
        ? await apiClient.patch(`${base(orgId)}/sources/${id}`, input)
        : await apiClient.post(`${base(orgId)}/sources`, input);
      return orgSourceDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useRemoveSource = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (sourceId: string): Promise<void> => {
      await apiClient.delete(`${base(orgId)}/sources/${sourceId}`);
    },
    onSuccess: refresh,
  });
};

export const useToggleSource = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async ({
      id,
      enabled,
    }: {
      id: string;
      enabled: boolean;
    }): Promise<OrgSource> => {
      const { data } = await apiClient.patch(`${base(orgId)}/sources/${id}`, {
        enabled,
      });
      return orgSourceDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useUploadDocument = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: DocumentUploadForm): Promise<OrgDocument> => {
      const form = new FormData();
      form.append('title', input.title);
      form.append('description', input.description ?? '');
      form.append('category', input.category);
      form.append('folder_id', input.folderId);
      form.append('file', input.file);
      const { data } = await apiClient.post(`${base(orgId)}/documents`, form, {
        // Let the browser set the multipart boundary.
        headers: { 'Content-Type': undefined },
        timeout: fileTransferTimeout,
      });
      return documentDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useUpdateDocument = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async ({
      id,
      folderId: _folderId, // moves go through useMoveDocument
      ...input
    }: DocumentUpdateForm & { id: string }) => {
      const { data } = await apiClient.patch(
        `${base(orgId)}/documents/${id}`,
        input
      );
      return documentDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useMoveDocument = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async ({ id, folderId }: { id: string; folderId: string }) => {
      const { data } = await apiClient.patch(`${base(orgId)}/documents/${id}`, {
        folder_id: folderId,
      });
      return documentDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

/** Folder writes also refresh run settings, which list folders by id and name. */
function useRefreshFolders(orgId: string) {
  const queryClient = useQueryClient();
  const refresh = useRefreshOrg();
  return () => {
    queryClient.invalidateQueries({ queryKey: runKeys.settings(orgId) });
    return refresh();
  };
}

export const useCreateFolder = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: FolderForm): Promise<KnowledgeFolder> => {
      const { data } = await apiClient.post(`${base(orgId)}/folders`, input);
      return folderDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useUpdateFolder = (orgId: string) => {
  const refresh = useRefreshFolders(orgId);
  return useMutation({
    mutationFn: async ({
      id,
      ...input
    }: FolderForm & { id: string }): Promise<KnowledgeFolder> => {
      const { data } = await apiClient.patch(
        `${base(orgId)}/folders/${id}`,
        input
      );
      return folderDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

/** Only empty folders can go; the backend answers 409 otherwise. */
export const useDeleteFolder = (orgId: string) => {
  const refresh = useRefreshFolders(orgId);
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(`${base(orgId)}/folders/${id}`);
    },
    onSuccess: refresh,
  });
};

export const useDeleteDocument = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (documentId: string) => {
      await apiClient.delete(`${base(orgId)}/documents/${documentId}`);
    },
    onSuccess: refresh,
  });
};

/** Retry text extraction and embedding, e.g. after a failure. Admins only. */
export const useReprocessDocument = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (documentId: string): Promise<OrgDocument> => {
      const { data } = await apiClient.post(
        `${base(orgId)}/documents/${documentId}/reprocess`
      );
      return documentDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

/** Write the dossier again now. It comes back `generating`, which starts polling. */
export const useRegenerateDossier = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const { data } = await apiClient.post(
        `${base(orgId)}/dossier/regenerate`
      );
      return dossierDtoSchema.parse(data);
    },
    onSuccess: (dossier) =>
      queryClient.setQueryData(orgKeys.dossier(orgId), dossier),
  });
};

/** Files are served only through the member-checked download endpoint. */
export async function downloadDocument(orgId: string, doc: OrgDocument) {
  const { data } = await apiClient.get<Blob>(
    `${base(orgId)}/documents/${doc.id}/download`,
    { responseType: 'blob', timeout: fileTransferTimeout }
  );
  const url = URL.createObjectURL(data);
  const link = globalThis.document.createElement('a');
  link.href = url;
  link.download = doc.fileName;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export const useUpdateClientBrief = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: ClientBriefForm): Promise<ClientBrief> => {
      const { data } = await apiClient.patch(
        `${base(orgId)}/client-brief`,
        toClientBriefWrite(input)
      );
      return clientBriefDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useUpdateJobBrief = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: JobBriefForm): Promise<JobBrief> => {
      const { data } = await apiClient.patch(
        `${base(orgId)}/job-brief`,
        toJobBriefWrite(input)
      );
      return jobBriefDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};

export const useUpdateTenderBrief = (orgId: string) => {
  const refresh = useRefreshOrg();
  return useMutation({
    mutationFn: async (input: TenderBriefForm): Promise<TenderBrief> => {
      const { data } = await apiClient.patch(
        `${base(orgId)}/tender-brief`,
        toTenderBriefWrite(input)
      );
      return tenderBriefDtoSchema.parse(data);
    },
    onSuccess: refresh,
  });
};
