import type { ApiParams } from '../opportunities/query-keys';

export const runKeys = {
  all: ['runs'] as const,
  org: (orgId: string) => [...runKeys.all, orgId] as const,
  list: (orgId: string, params?: ApiParams) =>
    [...runKeys.org(orgId), 'list', params] as const,
  settings: (orgId: string) => [...runKeys.org(orgId), 'settings'] as const,
  detail: (orgId: string, id: string) =>
    [...runKeys.org(orgId), 'detail', id] as const,
};
