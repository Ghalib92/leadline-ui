import { useQuery } from '@tanstack/react-query';
import { apiClient } from '~/lib/api/client';
import { orgApi } from '~/lib/api/backend';
import {
  memberDtoSchema,
  orgInvitationDtoSchema,
  paginated,
  type Invite,
  type Member,
} from '~/lib/schema';
import { memberKeys } from './query-keys';

/** Active and inactive members (removed ones stay out of the roster). */
export const useMembers = (orgId: string) =>
  useQuery({
    queryKey: memberKeys.list(orgId),
    queryFn: async (): Promise<Member[]> => {
      // ponytail: first 100 only; add paging when an org outgrows it.
      const { data } = await apiClient.get(orgApi(orgId, '/members'), {
        params: { page_size: 100 },
      });
      return paginated(memberDtoSchema)
        .parse(data)
        .results.filter((member) => member.status !== 'removed');
    },
    enabled: !!orgId,
  });

/** Pending invitations (admins only — the API refuses members). */
export const useInvites = (orgId: string) =>
  useQuery({
    queryKey: memberKeys.invites(orgId),
    queryFn: async (): Promise<Invite[]> => {
      const { data } = await apiClient.get(orgApi(orgId, '/invitations'), {
        params: { status: 'pending', page_size: 100 },
      });
      return paginated(orgInvitationDtoSchema).parse(data).results;
    },
    enabled: !!orgId,
  });
