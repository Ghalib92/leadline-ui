export type ApiParams = Record<string, string | string[] | number>;

export const opportunityKeys = {
  all: ['opportunities'] as const,
  org: (orgId: string) => [...opportunityKeys.all, orgId] as const,
  list: (orgId: string, params?: ApiParams) =>
    [...opportunityKeys.org(orgId), 'list', params] as const,
  detail: (orgId: string, id: string) =>
    [...opportunityKeys.org(orgId), 'detail', id] as const,
};
