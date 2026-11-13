import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  runDetailDtoSchema,
  runSettingsDtoSchema,
  toRunSettingsBody,
  type RunResult,
  type RunSettingsForm,
} from '~/lib/schema';
import { orgKeys } from '../orgs/query-keys';
import { opportunityKeys } from '../opportunities/query-keys';
import { agentKeys } from '../agents/query-keys';
import { runKeys } from './query-keys';

/** Save the org's search settings (admins). */
export const useUpdateRunSettings = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (form: RunSettingsForm) => {
      const { data } = await apiClient.put(
        orgApi(orgId, '/run-settings'),
        toRunSettingsBody(form)
      );
      return runSettingsDtoSchema.parse(data);
    },
    onSuccess: (settings) => {
      queryClient.setQueryData(runKeys.settings(orgId), settings);
      // Every agent adds to these settings.
      queryClient.invalidateQueries({ queryKey: agentKeys.all });
    },
  });
};

/**
 * "Search for opportunities": a run from the org's search settings, with no
 * saved search. `settings` (optional) apply to this run only. Any member.
 */
export const useStartSearch = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (settings?: RunSettingsForm): Promise<RunResult> => {
      // 202: the run is queued; the run page polls it until it finishes.
      const { data } = await apiClient.post(
        orgApi(orgId, '/runs'),
        settings ? toRunSettingsBody(settings) : undefined
      );
      return { run: { ...runDetailDtoSchema.parse(data), orgId } };
    },
    onSuccess: ({ run }) => {
      queryClient.setQueryData(runKeys.detail(orgId, run.id), run);
      queryClient.invalidateQueries({
        queryKey: [...runKeys.org(orgId), 'list'],
      });
      queryClient.invalidateQueries({ queryKey: orgKeys.overview(orgId) });
      queryClient.invalidateQueries({ queryKey: opportunityKeys.org(orgId) });
    },
  });
};
