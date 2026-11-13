import { keepPreviousData, useQuery } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  drfPage,
  isRunActive,
  runDetailDtoSchema,
  runListItemDtoSchema,
  runSettingsDtoSchema,
  toListPage,
  toRunQuery,
  type AgentRun,
  type AgentRunList,
  type RunSettings,
} from '~/lib/schema';
import type { ApiParams } from '../opportunities/query-keys';
import { runKeys } from './query-keys';

const runPage = drfPage(runListItemDtoSchema);

/** How often a run in progress is re-read. */
export const liveRunPollMs = 1500;

export const useRuns = (orgId: string, params?: ApiParams) =>
  useQuery({
    queryKey: runKeys.list(orgId, params),
    queryFn: async (): Promise<AgentRunList> => {
      const { query, page, limit } = toRunQuery(params);
      const { data } = await apiClient.get(orgApi(orgId, '/runs'), {
        params: query,
      });
      return toListPage(runPage.parse(data), { page, limit });
    },
    enabled: !!orgId,
    placeholderData: keepPreviousData,
    // Keep "running" rows fresh while a run is in progress.
    refetchInterval: (query) =>
      query.state.data?.data.some((run) => isRunActive(run.status))
        ? 4000
        : false,
  });

export const useRun = (orgId: string, id: string) =>
  useQuery({
    queryKey: runKeys.detail(orgId, id),
    queryFn: async (): Promise<AgentRun> => {
      const { data } = await apiClient.get(orgApi(orgId, `/runs/${id}`));
      return { ...runDetailDtoSchema.parse(data), orgId };
    },
    enabled: !!orgId && !!id,
    retry: false,
    // Runs execute in a backend worker: poll until they finish.
    refetchInterval: (query) =>
      query.state.data && isRunActive(query.state.data.status)
        ? liveRunPollMs
        : false,
  });

/** The org's defaults for "Run with my settings". */
export const useRunSettings = (orgId: string) =>
  useQuery({
    queryKey: runKeys.settings(orgId),
    queryFn: async (): Promise<RunSettings> => {
      const { data } = await apiClient.get(orgApi(orgId, '/run-settings'));
      return runSettingsDtoSchema.parse(data);
    },
    enabled: !!orgId,
  });
