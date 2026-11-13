import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '~/lib/api/client';
import { downloadFile, orgApi } from '~/lib/api/backend';
import {
  choiceSchema,
  contactDtoSchema,
  contactSearchDtoSchema,
  deadlineDtoSchema,
  drfPage,
  outreachEmailDtoSchema,
  reminderPreferenceSchema,
  type Choice,
  type Contact,
  type ContactFormInput,
  type ContactSearch,
  type Deadline,
  type EmailStatus,
  type OutreachEmail,
  type ReminderPreference,
} from '~/lib/schema';

/** Contacts, outreach emails and deadlines (backend task 13). */
export const outreachKeys = {
  all: ['outreach'] as const,
  contacts: (orgId: string, oppId: string) =>
    [...outreachKeys.all, orgId, 'contacts', oppId] as const,
  search: (orgId: string, oppId: string) =>
    [...outreachKeys.all, orgId, 'search', oppId] as const,
  emails: (orgId: string, filters: Record<string, string>) =>
    [...outreachKeys.all, orgId, 'emails', filters] as const,
  email: (orgId: string, id: string) =>
    [...outreachKeys.all, orgId, 'email', id] as const,
  purposes: (orgId: string) =>
    [...outreachKeys.all, orgId, 'purposes'] as const,
  deadlines: (orgId: string, from: string, to: string) =>
    [...outreachKeys.all, orgId, 'deadlines', from, to] as const,
  reminders: (orgId: string) =>
    [...outreachKeys.all, orgId, 'reminders'] as const,
};

const POLL_MS = 2000;

// ---------------------------------------------------------------------------
// Contacts
// ---------------------------------------------------------------------------

export const useContacts = (orgId: string, oppId: string) =>
  useQuery({
    queryKey: outreachKeys.contacts(orgId, oppId),
    queryFn: async (): Promise<Contact[]> => {
      const { data } = await apiClient.get(
        orgApi(orgId, `/opportunities/${oppId}/contacts`)
      );
      return contactDtoSchema.array().parse(data);
    },
    enabled: !!orgId && !!oppId,
  });

const searchActive = (search: ContactSearch | null | undefined) =>
  !!search && (search.status === 'queued' || search.status === 'running');

export const useContactSearch = (orgId: string, oppId: string) => {
  const queryClient = useQueryClient();
  return useQuery({
    queryKey: outreachKeys.search(orgId, oppId),
    queryFn: async (): Promise<ContactSearch | null> => {
      try {
        const { data } = await apiClient.get(
          orgApi(orgId, `/opportunities/${oppId}/contact-search`)
        );
        const search = contactSearchDtoSchema.parse(data);
        if (!searchActive(search)) {
          queryClient.invalidateQueries({
            queryKey: outreachKeys.contacts(orgId, oppId),
          });
        }
        return search;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 404) return null;
        throw error;
      }
    },
    enabled: !!orgId && !!oppId,
    refetchInterval: (query) =>
      searchActive(query.state.data) ? POLL_MS : false,
  });
};

export const useFindContacts = (orgId: string, oppId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (): Promise<ContactSearch> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/opportunities/${oppId}/contact-search`)
      );
      return contactSearchDtoSchema.parse(data);
    },
    onSuccess: (search) => {
      queryClient.setQueryData(outreachKeys.search(orgId, oppId), search);
      queryClient.invalidateQueries({
        queryKey: outreachKeys.contacts(orgId, oppId),
      });
    },
  });
};

function useInvalidateContacts(orgId: string, oppId: string) {
  const queryClient = useQueryClient();
  return () =>
    queryClient.invalidateQueries({
      queryKey: outreachKeys.contacts(orgId, oppId),
    });
}

export const useAddContact = (orgId: string, oppId: string) => {
  const invalidate = useInvalidateContacts(orgId, oppId);
  return useMutation({
    mutationFn: async (input: ContactFormInput): Promise<Contact> => {
      const { data } = await apiClient.post(
        orgApi(orgId, `/opportunities/${oppId}/contacts`),
        input
      );
      return contactDtoSchema.parse(data);
    },
    onSuccess: invalidate,
  });
};

export const useUpdateContact = (orgId: string, oppId: string) => {
  const invalidate = useInvalidateContacts(orgId, oppId);
  return useMutation({
    mutationFn: async ({
      id,
      input,
    }: {
      id: string;
      input: Partial<ContactFormInput> & { do_not_contact?: boolean };
    }): Promise<Contact> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/contacts/${id}`),
        input
      );
      return contactDtoSchema.parse(data);
    },
    onSuccess: invalidate,
  });
};

export const useDeleteContact = (orgId: string, oppId: string) => {
  const queryClient = useQueryClient();
  const invalidate = useInvalidateContacts(orgId, oppId);
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.delete(orgApi(orgId, `/contacts/${id}`));
    },
    onSuccess: () => {
      invalidate();
      queryClient.invalidateQueries({
        queryKey: [...outreachKeys.all, orgId, 'emails'],
      });
    },
  });
};

// ---------------------------------------------------------------------------
// Outreach emails
// ---------------------------------------------------------------------------

const emailPage = drfPage(outreachEmailDtoSchema);
const emailBusy = (email: OutreachEmail) =>
  email.status === 'drafting' || email.status === 'sending';

export const useOutreachEmails = (
  orgId: string,
  filters: { status?: EmailStatus[]; opportunity?: string } = {}
) => {
  const params: Record<string, string> = { page_size: '100' };
  if (filters.status?.length) params.status = filters.status.join(',');
  if (filters.opportunity) params.opportunity = filters.opportunity;
  return useQuery({
    queryKey: outreachKeys.emails(orgId, params),
    queryFn: async (): Promise<OutreachEmail[]> => {
      const { data } = await apiClient.get(orgApi(orgId, '/outreach'), {
        params,
      });
      return emailPage.parse(data).results;
    },
    enabled: !!orgId,
    refetchInterval: (query) =>
      query.state.data?.some(emailBusy) ? POLL_MS : false,
  });
};

export const useOutreachPurposes = (orgId: string) =>
  useQuery({
    queryKey: outreachKeys.purposes(orgId),
    queryFn: async (): Promise<Choice[]> => {
      const { data } = await apiClient.get(orgApi(orgId, '/outreach-purposes'));
      return choiceSchema.array().parse(data);
    },
    enabled: !!orgId,
    staleTime: Infinity,
  });

function useEmailMutation<T>(
  orgId: string,
  request: (input: T) => Promise<unknown>
) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: T): Promise<OutreachEmail> =>
      outreachEmailDtoSchema.parse(await request(input)),
    onSuccess: () =>
      queryClient.invalidateQueries({
        queryKey: [...outreachKeys.all, orgId, 'emails'],
      }),
  });
}

export const useDraftEmail = (orgId: string, oppId: string) =>
  useEmailMutation(
    orgId,
    async (input: {
      contact: string;
      purpose: string;
      instructions?: string;
      subject?: string;
      body?: string;
    }) =>
      (
        await apiClient.post(
          orgApi(orgId, `/opportunities/${oppId}/outreach`),
          input
        )
      ).data
  );

export const useEditEmail = (orgId: string) =>
  useEmailMutation(
    orgId,
    async ({ id, ...input }: { id: string; subject: string; body: string }) =>
      (await apiClient.patch(orgApi(orgId, `/outreach/${id}`), input)).data
  );

export const useRedraftEmail = (orgId: string) =>
  useEmailMutation(
    orgId,
    async ({ id, instructions }: { id: string; instructions: string }) =>
      (
        await apiClient.post(orgApi(orgId, `/outreach/${id}/redraft`), {
          instructions,
        })
      ).data
  );

export const useDiscardEmail = (orgId: string) =>
  useEmailMutation(
    orgId,
    async (id: string) =>
      (await apiClient.post(orgApi(orgId, `/outreach/${id}/discard`))).data
  );

export const useApproveEmail = (orgId: string) =>
  useEmailMutation(
    orgId,
    async ({ id, confirmRepeat }: { id: string; confirmRepeat?: boolean }) =>
      (
        await apiClient.post(orgApi(orgId, `/outreach/${id}/approve`), {
          confirm_repeat: !!confirmRepeat,
        })
      ).data
  );

// ---------------------------------------------------------------------------
// Deadlines
// ---------------------------------------------------------------------------

export const useDeadlines = (orgId: string, from: string, to: string) =>
  useQuery({
    queryKey: outreachKeys.deadlines(orgId, from, to),
    queryFn: async (): Promise<Deadline[]> => {
      const { data } = await apiClient.get(orgApi(orgId, '/deadlines'), {
        params: { from, to },
      });
      return deadlineDtoSchema.array().parse(data);
    },
    enabled: !!orgId,
  });

export const downloadDeadlines = (
  orgId: string,
  params?: { from: string; to: string }
) =>
  downloadFile(
    orgApi(
      orgId,
      `/deadlines/calendar${params ? `?from=${params.from}&to=${params.to}` : ''}`
    ),
    'deadlines.ics'
  );

export const downloadOpportunityDeadline = (orgId: string, oppId: string) =>
  downloadFile(
    orgApi(orgId, `/opportunities/${oppId}/calendar`),
    'deadline.ics'
  );

export const useReminderPreference = (orgId: string) =>
  useQuery({
    queryKey: outreachKeys.reminders(orgId),
    queryFn: async (): Promise<ReminderPreference> => {
      const { data } = await apiClient.get(orgApi(orgId, '/reminders'));
      return reminderPreferenceSchema.parse(data);
    },
    enabled: !!orgId,
  });

export const useUpdateReminderPreference = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: {
      enabled?: boolean;
      days_before?: number[];
    }): Promise<ReminderPreference> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, '/reminders'),
        input
      );
      return reminderPreferenceSchema.parse(data);
    },
    onSuccess: (preference) =>
      queryClient.setQueryData(outreachKeys.reminders(orgId), preference),
  });
};
