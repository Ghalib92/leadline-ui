import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { acceptedMembershipSchema } from '~/lib/schema';
import { orgKeys } from '~/features/orgs/query-keys';
import { invitationKeys } from './query-keys';

export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      const { data } = await apiClient.post(
        '/organizations/invitations/accept',
        { token }
      );
      return acceptedMembershipSchema.parse(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.mine() });
      queryClient.invalidateQueries({ queryKey: invitationKeys.received() });
    },
  });
};

export const useDeclineInvitation = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (token: string) => {
      await apiClient.post('/organizations/invitations/decline', { token });
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: invitationKeys.received() });
    },
  });
};

/** Inbox: accept by id → the org I joined. */
export const useAcceptReceived = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      const { data } = await apiClient.post(
        `/organizations/invitations/received/${id}/accept`
      );
      return acceptedMembershipSchema.parse(data);
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: orgKeys.mine() });
      queryClient.invalidateQueries({ queryKey: invitationKeys.received() });
    },
  });
};

export const useDeclineReceived = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id: string) => {
      await apiClient.post(`/organizations/invitations/received/${id}/decline`);
    },
    onSettled: () =>
      queryClient.invalidateQueries({ queryKey: invitationKeys.received() }),
  });
};
