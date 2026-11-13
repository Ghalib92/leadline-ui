import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import {
  invitationPreviewSchema,
  paginated,
  receivedInvitationSchema,
  type InvitationPreview,
  type ReceivedInvitation,
} from '~/lib/schema';
import { invitationKeys } from './query-keys';

/** Signed-in only: the API refuses previews without a matching account. */
export const useInvitationPreview = (token: string | null, enabled = true) =>
  useQuery({
    queryKey: invitationKeys.preview(token ?? ''),
    queryFn: async (): Promise<InvitationPreview> => {
      const { data } = await apiClient.post(
        '/organizations/invitations/preview',
        { token }
      );
      return invitationPreviewSchema.parse(data);
    },
    enabled: enabled && !!token,
    retry: false,
  });

const receivedPage = paginated(receivedInvitationSchema);

/**
 * Every invitation sent to my email — pending and past (accepted, declined,
 * revoked, expired). One list feeds the inbox, the sidebar badge and landing.
 */
export const useReceivedInvitations = (enabled = true) =>
  useQuery({
    queryKey: invitationKeys.received(),
    queryFn: async (): Promise<ReceivedInvitation[]> => {
      const { data } = await apiClient.get(
        '/organizations/invitations/received',
        {
          params: { page_size: 100 },
        }
      );
      // ponytail: first 100 only; page through if an inbox ever grows past that.
      return receivedPage.parse(data).results;
    },
    enabled,
  });

/** Pending ones only (badge, landing, banner). */
export const usePendingInvitations = (enabled = true) => {
  const query = useReceivedInvitations(enabled);
  return {
    ...query,
    data: query.data?.filter((invite) => invite.status === 'pending'),
  };
};
