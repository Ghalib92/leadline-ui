import { describe, expect, it } from 'vitest';
import { orgKeys } from './orgs/query-keys';
import { memberKeys } from './members/query-keys';
import { agentKeys } from './agents/query-keys';
import { opportunityKeys } from './opportunities/query-keys';
import { runKeys } from './runs/query-keys';

describe('query keys', () => {
  it('scopes org data', () => {
    expect(orgKeys.mine()).toEqual(['orgs', 'mine']);
    expect(orgKeys.bySlug('kijani')).toEqual(['orgs', 'slug', 'kijani']);
    expect(orgKeys.overview('o1')).toEqual(['orgs', 'o1', 'overview']);
    expect(orgKeys.setup('o1')).toEqual(['orgs', 'o1', 'setup']);
    expect(orgKeys.preferences('o1')).toEqual(['orgs', 'o1', 'preferences']);
    expect(orgKeys.links('o1')).toEqual(['orgs', 'o1', 'links']);
    expect(orgKeys.documents('o1', { category: 'cv' })).toEqual([
      'orgs',
      'o1',
      'documents',
      { category: 'cv' },
    ]);
  });

  it('nests opportunity lists and details under the org', () => {
    expect(opportunityKeys.list('o1', { page: 1 })).toEqual([
      'opportunities',
      'o1',
      'list',
      { page: 1 },
    ]);
    expect(opportunityKeys.detail('o1', 'x')).toEqual([
      'opportunities',
      'o1',
      'detail',
      'x',
    ]);
    expect(opportunityKeys.list('o1', {}).slice(0, 2)).toEqual(
      opportunityKeys.org('o1')
    );
  });

  it('keys members and agents per org', () => {
    expect(memberKeys.list('o1')).toEqual(['members', 'o1', 'list']);
    expect(memberKeys.invites('o1')).toEqual(['members', 'o1', 'invites']);
    expect(agentKeys.list('o1')).toEqual(['agents', 'o1']);
    expect(runKeys.list('o1', { status: 'failed' })).toEqual([
      'runs',
      'o1',
      'list',
      { status: 'failed' },
    ]);
    expect(runKeys.detail('o1', 'r1')).toEqual(['runs', 'o1', 'detail', 'r1']);
  });
});
