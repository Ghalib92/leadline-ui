import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi, repeatParams } from '~/lib/api/backend';
import {
  drfPage,
  opportunityDtoSchema,
  toListPage,
  toOpportunityQuery,
  type Opportunity,
  type OpportunityList,
} from '~/lib/schema';
import { opportunityKeys, type ApiParams } from './query-keys';

const opportunityPage = drfPage(opportunityDtoSchema);

export const useOpportunities = (orgId: string, params?: ApiParams) =>
  useQuery({
    queryKey: opportunityKeys.list(orgId, params),
    queryFn: async (): Promise<OpportunityList> => {
      const { query, page, limit } = toOpportunityQuery(params);
      const { data } = await apiClient.get(orgApi(orgId, '/opportunities'), {
        params: query,
        ...repeatParams,
      });
      return toListPage(opportunityPage.parse(data), { page, limit });
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
  });

export const useOpportunity = (orgId: string, id: string) =>
  useQuery({
    queryKey: opportunityKeys.detail(orgId, id),
    queryFn: async (): Promise<Opportunity> => {
      const { data } = await apiClient.get(
        orgApi(orgId, `/opportunities/${id}`)
      );
      return opportunityDtoSchema.parse(data);
    },
    enabled: !!orgId && !!id,
    retry: false,
    // The brief is written in the background; check for it for about two minutes.
    refetchInterval: (query) =>
      query.state.data?.briefStatus === 'pending' &&
      query.state.dataUpdateCount < 40
        ? 3000
        : false,
  });
