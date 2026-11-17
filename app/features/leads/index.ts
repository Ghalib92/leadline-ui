import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  callListItemDtoSchema,
  drfPage,
  leadActivityDtoSchema,
  pitchDtoSchema,
  toActivityBody,
  toPitchBody,
  type CallListItem,
  type CallListView,
  type LeadActivity,
  type LeadPitch,
  type LogActivityFormInput,
  type PitchFormInput,
} from '~/lib/schema';

/** Client leads after approval: the pitch, calls and messages, and the call list. */
export const leadKeys = {
  all: ['leads'] as const,
  pitch: (orgId: string, oppId: string) =>
    [...leadKeys.all, orgId, 'pitch', oppId] as const,
  activity: (orgId: string, oppId: string) =>
    [...leadKeys.all, orgId, 'activity', oppId] as const,
  callList: (orgId: string, view: CallListView) =>
    [...leadKeys.all, orgId, 'call-list', view] as const,
};

const POLL_MS = 2000;
const pitchPath = (oppId: string) => `/opportunities/${oppId}/pitch`;
const activityPath = (oppId: string) => `/opportunities/${oppId}/activity`;

export const isPitchBusy = (pitch: LeadPitch | null | undefined) =>
  pitch?.status === 'writing';

// ---------------------------------------------------------------------------
// The pitch
// ---------------------------------------------------------------------------

/** The lead's pitch, or null when there is none yet. Polls while it is written. */
export const usePitch = (orgId: string, oppId: string, enabled = true) =>
  useQuery({
    queryKey: leadKeys.pitch(orgId, oppId),
    queryFn: async (): Promise<LeadPitch | null> => {
      try {
        const { data } = await apiClient.get(orgApi(orgId, pitchPath(oppId)));
        return pitchDtoSchema.parse(data);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: enabled && !!orgId && !!oppId,
    refetchInterval: (query) =>
      isPitchBusy(query.state.data) ? POLL_MS : false,
  });

function usePitchMutation<T>(
  orgId: string,
  oppId: string,
  send: (input: T) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T): Promise<LeadPitch> =>
      pitchDtoSchema.parse(await send(input)),
    onSuccess: (pitch) => {
      queryClient.setQueryData(leadKeys.pitch(orgId, oppId), pitch);
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.all, orgId, 'call-list'],
      });
    },
  });
}

/** (Re)write the pitch with the AI; replaces any edits. */
export const useWritePitch = (orgId: string, oppId: string) =>
  usePitchMutation(orgId, oppId, async (instructions: string) => {
    const { data } = await apiClient.post(orgApi(orgId, pitchPath(oppId)), {
      instructions,
    });
    return data;
  });

export const useEditPitch = (orgId: string, oppId: string) =>
  usePitchMutation(orgId, oppId, async (input: PitchFormInput) => {
    const { data } = await apiClient.patch(
      orgApi(orgId, pitchPath(oppId)),
      toPitchBody(input)
    );
    return data;
  });

// ---------------------------------------------------------------------------
// Calls and messages
// ---------------------------------------------------------------------------

export const useLeadActivity = (orgId: string, oppId: string, enabled = true) =>
  useQuery({
    queryKey: leadKeys.activity(orgId, oppId),
    queryFn: async (): Promise<LeadActivity[]> => {
      const { data } = await apiClient.get(orgApi(orgId, activityPath(oppId)));
      return leadActivityDtoSchema.array().parse(data);
    },
    enabled: enabled && !!orgId && !!oppId,
  });

function useInvalidateLead(orgId: string, oppId: string) {
  const queryClient = useQueryClient();
  return () =>
    Promise.all([
      queryClient.invalidateQueries({
        queryKey: leadKeys.activity(orgId, oppId),
      }),
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.all, orgId, 'call-list'],
      }),
    ]);
}

export const useLogActivity = (orgId: string, oppId: string) => {
  const invalidate = useInvalidateLead(orgId, oppId);
  return useMutation({
    mutationFn: async (input: LogActivityFormInput): Promise<LeadActivity> => {
      const { data } = await apiClient.post(
        orgApi(orgId, activityPath(oppId)),
        toActivityBody(input)
      );
      return leadActivityDtoSchema.parse(data);
    },
    onSuccess: invalidate,
  });
};

export const useDeleteActivity = (orgId: string, oppId: string) => {
  const invalidate = useInvalidateLead(orgId, oppId);
  return useMutation({
    mutationFn: async (activityId: string) => {
      await apiClient.delete(orgApi(orgId, `/lead-activity/${activityId}`));
    },
    onSuccess: invalidate,
  });
};

// ---------------------------------------------------------------------------
// The call list
// ---------------------------------------------------------------------------

const callListPage = drfPage(callListItemDtoSchema);

export const useCallList = (orgId: string, view: CallListView) =>
  useQuery({
    queryKey: leadKeys.callList(orgId, view),
    queryFn: async (): Promise<{ items: CallListItem[]; total: number }> => {
      const { data } = await apiClient.get(orgApi(orgId, '/call-list'), {
        params: { view, page_size: '100' },
      });
      const page = callListPage.parse(data);
      return { items: page.results, total: page.count };
    },
    enabled: !!orgId,
    refetchInterval: (query) =>
      query.state.data?.items.some((item) => item.pitch?.status === 'writing')
        ? POLL_MS
        : false,
  });
