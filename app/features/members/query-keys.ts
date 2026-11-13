export const memberKeys = {
  all: ['members'] as const,
  list: (orgId: string) => [...memberKeys.all, orgId, 'list'] as const,
  invites: (orgId: string) => [...memberKeys.all, orgId, 'invites'] as const,
};
