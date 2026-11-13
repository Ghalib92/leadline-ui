import {
  useMutation,
  useQueryClient,
  type QueryClient,
} from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  memberDtoSchema,
  orgInvitationDtoSchema,
  type Invite,
  type InviteMembersInput,
  type InviteResult,
  type Member,
  type Role,
} from '~/lib/schema';
import { orgKeys } from '../orgs/query-keys';
import { memberKeys } from './query-keys';

/** The backend takes one email per request; report who couldn't be invited. */
export const useInviteMembers = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      emails,
      role,
    }: InviteMembersInput): Promise<InviteResult> => {
      const created: Invite[] = [];
      const skipped: string[] = [];
      for (const email of emails) {
        try {
          const { data } = await apiClient.post(
            `/organizations/${orgId}/invitations`,
            {
              email,
              role,
            }
          );
          created.push(orgInvitationDtoSchema.parse(data));
        } catch (error) {
          // Already a member / already invited: the backend says so with a 400.
          if (isAxiosError(error) && error.response?.status === 400)
            skipped.push(email);
          else throw error;
        }
      }
      return { created, skipped };
    },
    onSuccess: () => refreshInvites(queryClient, orgId),
  });
};

export const useUpdateMemberRole = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({
      memberId,
      role,
    }: {
      memberId: string;
      role: Role;
    }): Promise<Member> => {
      const { data } = await apiClient.patch(
        orgApi(orgId, `/members/${memberId}`),
        { role }
      );
      return memberDtoSchema.parse(data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.all });
    },
  });
};

/** Admins remove others; leaving yourself is `useLeaveOrg`. */
export const useRemoveMember = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (memberId: string): Promise<void> => {
      await apiClient.delete(orgApi(orgId, `/members/${memberId}`));
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: memberKeys.list(orgId) });
      queryClient.invalidateQueries({ queryKey: orgKeys.mine() });
    },
  });
};

export const useResendInvite = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string): Promise<Invite> => {
      const { data } = await apiClient.post(
        `/organizations/${orgId}/invitations/${inviteId}/resend`
      );
      return orgInvitationDtoSchema.parse(data);
    },
    onSuccess: () => refreshInvites(queryClient, orgId),
  });
};

export const useRevokeInvite = (orgId: string) => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (inviteId: string): Promise<void> => {
      await apiClient.post(
        `/organizations/${orgId}/invitations/${inviteId}/revoke`
      );
    },
    onSuccess: () => refreshInvites(queryClient, orgId),
  });
};

/** Invites feed the Team list and the setup checklist's "Invite your team". */
function refreshInvites(queryClient: QueryClient, orgId: string) {
  queryClient.invalidateQueries({ queryKey: memberKeys.invites(orgId) });
  queryClient.invalidateQueries({ queryKey: orgKeys.setup(orgId) });
  queryClient.invalidateQueries({ queryKey: orgKeys.overview(orgId) });
}
