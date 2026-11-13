import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  opportunityDtoSchema,
  type Opportunity,
  type UpdateOpportunityInput,
} from '~/lib/schema';
import { orgKeys } from '../orgs/query-keys';
import { opportunityKeys } from './query-keys';

export const useUpdateOpportunity = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: UpdateOpportunityInput;
    }): Promise<Opportunity> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/opportunities/${id}`),
        input
      );
      return opportunityDtoSchema.parse(data);
    },
    onSuccess: (opp) => {
      queryClient.setQueryData(opportunityKeys.detail(orgId, opp.id), opp);
      queryClient.invalidateQueries({
        queryKey: [...opportunityKeys.org(orgId), 'list'],
      });
      queryClient.invalidateQueries({ queryKey: orgKeys.overview(orgId) });
    },
  });
};

/** Ask the analyst to write the brief again; the opportunity then shows it. */
export const useRegenerateBrief = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (opportunityId: string) => {
      await apiClient.post(
        orgApi(orgId, `/opportunities/${opportunityId}/brief`)
      );
    },
    onSuccess: (_data, opportunityId) =>
      queryClient.invalidateQueries({
        queryKey: opportunityKeys.detail(orgId, opportunityId),
      }),
  });
};
