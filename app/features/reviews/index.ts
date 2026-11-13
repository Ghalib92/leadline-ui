import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  choiceSchema,
  insightsDtoSchema,
  reviewDtoSchema,
  reviewResultDtoSchema,
  type Choice,
  type Insights,
  type Opportunity,
  type Review,
} from '~/lib/schema';
import { opportunityKeys } from '../opportunities/query-keys';
import { orgKeys } from '../orgs/query-keys';
import { proposalKeys } from '../proposals';

/** Approve / reject with a reason (backend task 8), and the dashboard insights. */
export const reviewKeys = {
  all: ['reviews'] as const,
  history: (orgId: string, oppId: string) =>
    [...reviewKeys.all, orgId, 'history', oppId] as const,
  reasons: (orgId: string) => [...reviewKeys.all, orgId, 'reasons'] as const,
  insights: (orgId: string, days: number) =>
    [...reviewKeys.all, orgId, 'insights', days] as const,
};

export const useReviewHistory = (orgId: string, oppId: string) =>
  useQuery({
    queryKey: reviewKeys.history(orgId, oppId),
    queryFn: async (): Promise<Review[]> => {
      const { data } = await apiClient.get(
        orgApi(orgId, `/opportunities/${oppId}/reviews`)
      );
      return reviewDtoSchema.array().parse(data);
    },
    enabled: !!orgId && !!oppId,
  });

export const useRejectionReasons = (orgId: string) =>
  useQuery({
    queryKey: reviewKeys.reasons(orgId),
    queryFn: async (): Promise<Choice[]> => {
      const { data } = await apiClient.get(orgApi(orgId, '/rejection-reasons'));
      return choiceSchema.array().parse(data);
    },
    enabled: !!orgId,
    staleTime: Infinity,
  });

export type ReviewInput =
  | { decision: 'approve'; comment?: string }
  | { decision: 'reject'; reason: string; comment: string };

export const useReviewOpportunity = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: ReviewInput;
    }): Promise<Opportunity> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/opportunities/${id}/reviews`),
        input
      );
      return reviewResultDtoSchema.parse(data).opportunity;
    },
    onSuccess: (opp) => {
      queryClient.setQueryData(opportunityKeys.detail(orgId, opp.id), opp);
      queryClient.invalidateQueries({
        queryKey: [...opportunityKeys.org(orgId), 'list'],
      });
      queryClient.invalidateQueries({ queryKey: orgKeys.overview(orgId) });
      queryClient.invalidateQueries({ queryKey: reviewKeys.all });
      // Approving starts the Proposal Writer in the background.
      queryClient.invalidateQueries({
        queryKey: proposalKeys.forOpportunity(orgId, opp.id),
      });
    },
  });
};

export const insightDays = [7, 30, 90, 180, 365] as const;

export const useInsights = (orgId: string, days: number) =>
  useQuery({
    queryKey: reviewKeys.insights(orgId, days),
    queryFn: async (): Promise<Insights> => {
      const { data } = await apiClient.get(orgApi(orgId, '/insights'), {
        params: { days },
      });
      return insightsDtoSchema.parse(data);
    },
    enabled: !!orgId,
  });
