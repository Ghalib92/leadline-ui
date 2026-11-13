export const agentKeys = {
  all: ['agents'] as const,
  list: (orgId: string) => [...agentKeys.all, orgId] as const,
  detail: (orgId: string, id: string) =>
    [...agentKeys.list(orgId), id] as const,
};
