import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  agentDtoSchema,
  runDetailDtoSchema,
  toAgentBody,
  toRunSettingsBody,
  type Agent,
  type AgentInput,
  type RunResult,
  type RunSettingsForm,
} from '~/lib/schema';
import { orgKeys } from '../orgs/query-keys';
import { opportunityKeys } from '../opportunities/query-keys';
import { runKeys } from '../runs/query-keys';
import { agentKeys } from './query-keys';

function useInvalidateAgents(orgId: string) {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: agentKeys.list(orgId) });
    queryClient.invalidateQueries({ queryKey: orgKeys.overview(orgId) });
  };
}

export const useCreateAgent = (orgId: string) => {
  const invalidate = useInvalidateAgents(orgId);
  return useMutation({
    mutationFn: async (input: AgentInput): Promise<Agent> => {
      const { data } = await apiClient.post(
        orgApi(orgId, '/agents'),
        toAgentBody(input)
      );
      return { ...agentDtoSchema.parse(data), orgId };
    },
    onSuccess: invalidate,
  });
};

export const useUpdateAgent = (orgId: string) => {
  const invalidate = useInvalidateAgents(orgId);
  return useMutation({
    mutationFn: async ({
      agentId,
      input,
    }: {
      agentId: string;
      input: Partial<AgentInput>;
    }): Promise<Agent> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/agents/${agentId}`),
        toAgentBody(input)
      );
      return { ...agentDtoSchema.parse(data), orgId };
    },
    onSuccess: invalidate,
  });
};

export const useDeleteAgent = (orgId: string) => {
  const invalidate = useInvalidateAgents(orgId);
  return useMutation({
    mutationFn: async (agentId: string): Promise<void> => {
      await apiClient.delete(orgApi(orgId, `/agents/${agentId}`));
    },
    onSuccess: invalidate,
  });
};

export interface RunRequest {
  agentId: string;
  /** Omitted: the agent's sources/types and the org's depth/folders apply. */
  settings?: RunSettingsForm;
}

export const useRunAgent = (orgId: string) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateAgents(orgId);
  return useMutation({
    mutationFn: async ({
      agentId,
      settings,
    }: RunRequest): Promise<RunResult> => {
      // 202: the run is queued; the run page polls it until it finishes.
      const { data } = await apiClient.post(
        orgApi(orgId, `/agents/${agentId}/run`),
        settings ? toRunSettingsBody(settings) : undefined
      );
      return { run: { ...runDetailDtoSchema.parse(data), orgId } };
    },
    onSuccess: ({ run }) => {
      invalidate();
      queryClient.setQueryData(runKeys.detail(orgId, run.id), run);
      queryClient.invalidateQueries({
        queryKey: [...runKeys.org(orgId), 'list'],
      });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.org(orgId) });
    },
  });
};
