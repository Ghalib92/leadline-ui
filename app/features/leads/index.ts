import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '~/lib/api/client';
import { downloadFile, orgApi } from '~/lib/api/backend';
import {
  applicationDtoSchema,
  callListItemDtoSchema,
  drfPage,
  leadActivityDtoSchema,
  pitchDtoSchema,
  toActivityBody,
  toApplicationBody,
  toPitchBody,
  type ApplicationFormInput,
  type CallListItem,
  type CallListView,
  type JobApplication,
  type LeadActivity,
  type LeadPitch,
  type LogActivityFormInput,
  type PitchFormInput,
} from '~/lib/schema';
import { opportunityKeys } from '../opportunities/query-keys';

/** Client leads after approval: the pitch, calls and messages, and the call list.
 * Approved jobs: the application (letter and CV) and the same log and list. */
export const leadKeys = {
  all: ['leads'] as const,
  pitch: (orgId: string, oppId: string) =>
    [...leadKeys.all, orgId, 'pitch', oppId] as const,
  application: (orgId: string, oppId: string) =>
    [...leadKeys.all, orgId, 'application', oppId] as const,
  activity: (orgId: string, oppId: string) =>
    [...leadKeys.all, orgId, 'activity', oppId] as const,
  callList: (orgId: string, view: CallListView) =>
    [...leadKeys.all, orgId, 'call-list', view] as const,
};

const POLL_MS = 2000;
const pitchPath = (oppId: string) => `/opportunities/${oppId}/pitch`;
const activityPath = (oppId: string) => `/opportunities/${oppId}/activity`;
const applicationPath = (oppId: string) =>
  `/opportunities/${oppId}/application`;

export const isPitchBusy = (pitch: LeadPitch | null | undefined) =>
  pitch?.status === 'writing';

// ---------------------------------------------------------------------------
// The pitch
// ---------------------------------------------------------------------------

/** The lead's pitch, or null when there is none yet. Polls while it is written. When
 * writing ends, the lead is reloaded too: an unchecked lead is looked up first, so its
 * website and evidence may have changed. */
export const usePitch = (orgId: string, oppId: string, enabled = true) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: leadKeys.pitch(orgId, oppId),
    queryFn: async (): Promise<LeadPitch | null> => {
      const before = queryClient.getQueryData<LeadPitch | null>(
        leadKeys.pitch(orgId, oppId)
      );
      try {
        const { data } = await apiClient.get(orgApi(orgId, pitchPath(oppId)));
        const pitch = pitchDtoSchema.parse(data);
        if (isPitchBusy(before) && !isPitchBusy(pitch)) {
          queryClient.invalidateQueries({
            queryKey: opportunityKeys.detail(orgId, oppId),
          });
        }
        return pitch;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: enabled && !!orgId && !!oppId,
    refetchInterval: (query) =>
      isPitchBusy(query.state.data) ? POLL_MS : false,
  });
};

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
// A job application: cover letter and tailored CV
// ---------------------------------------------------------------------------

export const isApplicationBusy = (
  application: JobApplication | null | undefined
) => application?.status === 'writing';

/** The job's application, or null when there is none yet. Polls while it is written. */
export const useApplication = (orgId: string, oppId: string, enabled = true) =>
  useQuery({
    queryKey: leadKeys.application(orgId, oppId),
    queryFn: async (): Promise<JobApplication | null> => {
      try {
        const { data } = await apiClient.get(
          orgApi(orgId, applicationPath(oppId))
        );
        return applicationDtoSchema.parse(data);
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: enabled && !!orgId && !!oppId,
    refetchInterval: (query) =>
      isApplicationBusy(query.state.data) ? POLL_MS : false,
  });

function useApplicationMutation<T>(
  orgId: string,
  oppId: string,
  send: (input: T) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T): Promise<JobApplication> =>
      applicationDtoSchema.parse(await send(input)),
    onSuccess: (application) => {
      queryClient.setQueryData(leadKeys.application(orgId, oppId), application);
      queryClient.invalidateQueries({
        queryKey: [...leadKeys.all, orgId, 'call-list'],
      });
    },
  });
}

/** (Re)write the letter and CV with the AI; replaces any edits. */
export const useWriteApplication = (orgId: string, oppId: string) =>
  useApplicationMutation(orgId, oppId, async (instructions: string) => {
    const { data } = await apiClient.post(
      orgApi(orgId, applicationPath(oppId)),
      { instructions }
    );
    return data;
  });

export const useEditApplication = (orgId: string, oppId: string) =>
  useApplicationMutation(orgId, oppId, async (input: ApplicationFormInput) => {
    const { data } = await apiClient.patch(
      orgApi(orgId, applicationPath(oppId)),
      toApplicationBody(input)
    );
    return data;
  });

/** The tailored CV and the cover letter as one file: Word or PDF. */
export const downloadApplication = (
  orgId: string,
  oppId: string,
  format: 'docx' | 'pdf' = 'docx'
) =>
  downloadFile(
    orgApi(orgId, `${applicationPath(oppId)}/export`),
    `application.${format}`,
    { format }
  );

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
      query.state.data?.items.some(
        (item) =>
          item.pitch?.status === 'writing' ||
          item.application?.status === 'writing'
      )
        ? POLL_MS
        : false,
  });
