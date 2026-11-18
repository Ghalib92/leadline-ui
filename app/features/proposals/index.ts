import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '~/lib/api/client';
import { downloadFile, orgApi } from '~/lib/api/backend';
import {
  proposalDtoSchema,
  proposalEventsDtoSchema,
  versionSummarySchema,
  type Proposal,
  type ProposalEvents,
  type ProposalKnowledgeForm,
  type VersionSummary,
} from '~/lib/schema';

/** The Proposal Writer (backend task 10): drafts, edits, rewrites, versions. */
export const proposalKeys = {
  all: ['proposals'] as const,
  forOpportunity: (orgId: string, oppId: string) =>
    [...proposalKeys.all, orgId, 'opportunity', oppId] as const,
  events: (orgId: string, id: string) =>
    [...proposalKeys.all, orgId, 'events', id] as const,
  versions: (orgId: string, id: string) =>
    [...proposalKeys.all, orgId, 'versions', id] as const,
};

export const isProposalBusy = (proposal: Pick<Proposal, 'status'>) =>
  proposal.status === 'queued' || proposal.status === 'drafting';

/** The opportunity's proposal, or `null` before one exists. Polls while drafting. */
export const useOpportunityProposal = (orgId: string, oppId: string) =>
  useQuery({
    queryKey: proposalKeys.forOpportunity(orgId, oppId),
    queryFn: async (): Promise<Proposal | null> => {
      try {
        const { data } = await apiClient.get(
          orgApi(orgId, `/opportunities/${oppId}/proposal`)
        );
        return proposalDtoSchema.parse(data);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!orgId && !!oppId,
    refetchInterval: (query) =>
      query.state.data && isProposalBusy(query.state.data) ? 2000 : false,
  });

/** Live progress while a draft or rewrite runs. */
export const useProposalEvents = (
  orgId: string,
  proposal: Proposal | null | undefined
) =>
  useQuery({
    queryKey: proposalKeys.events(orgId, proposal?.id ?? ''),
    queryFn: async (): Promise<ProposalEvents> => {
      const { data } = await apiClient.get(
        orgApi(orgId, `/proposals/${proposal?.id}/events`)
      );
      return proposalEventsDtoSchema.parse(data);
    },
    enabled: !!proposal,
    refetchInterval: proposal && isProposalBusy(proposal) ? 1500 : false,
  });

function useSetProposal(orgId: string, oppId: string) {
  const queryClient = useQueryClient();
  return (proposal: Proposal) => {
    queryClient.setQueryData(
      proposalKeys.forOpportunity(orgId, oppId),
      proposal
    );
    queryClient.invalidateQueries({
      queryKey: proposalKeys.versions(orgId, proposal.id),
    });
    queryClient.invalidateQueries({
      queryKey: proposalKeys.events(orgId, proposal.id),
    });
  };
}

export const useStartProposal = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async (): Promise<Proposal> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/opportunities/${oppId}/proposal`)
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

/** Which company documents the next drafts read (`mode: 'run'` follows the search). */
export const useSetProposalKnowledge = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async ({
      proposal,
      form,
    }: {
      proposal: Proposal;
      form: ProposalKnowledgeForm;
    }): Promise<Proposal> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/proposals/${proposal.id}`),
        {
          knowledge_mode: form.mode,
          folders: form.mode === 'selected' ? form.folders : [],
        }
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

export const useEditSection = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async ({
      proposal,
      key,
      content,
    }: {
      proposal: Proposal;
      key: string;
      content: string;
    }): Promise<Proposal> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/proposals/${proposal.id}/sections/${key}`),
        { base_version: proposal.version, content }
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

export const useRewriteSection = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async ({
      proposal,
      key,
      instructions,
    }: {
      proposal: Proposal;
      key: string;
      instructions: string;
    }): Promise<Proposal> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/proposals/${proposal.id}/sections/${key}/rewrite`),
        { instructions }
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

/** Tick a bid requirement as in hand for this bid, or untick it. */
export const useTickChecklistItem = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async ({
      proposal,
      key,
      done,
    }: {
      proposal: Proposal;
      key: string;
      done: boolean;
    }): Promise<Proposal> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/proposals/${proposal.id}/checklist/${key}`),
        { done }
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

/** Check the tender's requirements against company documents again (after uploads). */
export const useRecheckDocuments = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async (proposal: Proposal): Promise<Proposal> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/proposals/${proposal.id}/checklist/recheck`)
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

export const useVersions = (orgId: string, proposalId: string | undefined) =>
  useQuery({
    queryKey: proposalKeys.versions(orgId, proposalId ?? ''),
    queryFn: async (): Promise<VersionSummary[]> => {
      const { data } = await apiClient.get(
        orgApi(orgId, `/proposals/${proposalId}/versions`)
      );
      return versionSummarySchema.array().parse(data);
    },
    enabled: !!proposalId,
  });

export const useRestoreVersion = (orgId: string, oppId: string) => {
  const set = useSetProposal(orgId, oppId);
  return useMutation({
    mutationFn: async ({
      proposalId,
      number,
    }: {
      proposalId: string;
      number: number;
    }): Promise<Proposal> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/proposals/${proposalId}/versions/${number}/restore`)
      );
      return proposalDtoSchema.parse(data);
    },
    onSuccess: set,
  });
};

export const exportProposal = (orgId: string, proposal: Proposal) =>
  downloadFile(
    orgApi(orgId, `/proposals/${proposal.id}/export`),
    'proposal.docx'
  );
