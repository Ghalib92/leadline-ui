import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import { agentDtoSchema, type Agent } from '~/lib/schema';
import { agentKeys } from './query-keys';

export async function fetchAgents(orgId: string): Promise<Agent[]> {
  const { data } = await apiClient.get(orgApi(orgId, '/agents'));
  return agentDtoSchema
    .array()
    .parse(data)
    .map((agent) => ({ ...agent, orgId }));
}

export const useAgents = (orgId: string) =>
  useQuery({
    queryKey: agentKeys.list(orgId),
    queryFn: () => fetchAgents(orgId),
    enabled: !!orgId,
  });

export const useAgent = (orgId: string, id: string) =>
  useQuery({
    queryKey: agentKeys.detail(orgId, id),
    queryFn: async (): Promise<Agent> => {
      const { data } = await apiClient.get(orgApi(orgId, `/agents/${id}`));
      return { ...agentDtoSchema.parse(data), orgId };
    },
    enabled: !!orgId && !!id,
    retry: false,
  });
