import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import {
  collectPages,
  findBySlug,
  missingRequired,
  orgGoneId,
  OrgNotFoundError,
  serverFieldErrors,
} from './map';

describe('collectPages', () => {
  it('follows `next` until the last page', async () => {
    const pages: Record<number, { results: number[]; next: string | null }> = {
      1: { results: [1, 2], next: '/api/organizations/?page=2&page_size=2' },
      2: { results: [3], next: null },
    };
    const seen: number[] = [];
    const all = await collectPages(async (page) => {
      seen.push(page);
      return pages[page];
    });
    expect(all).toEqual([1, 2, 3]);
    expect(seen).toEqual([1, 2]);
  });

  it('stops on a runaway paginator', async () => {
    const all = await collectPages(
      async () => ({ results: [1], next: 'more' }),
      3
    );
    expect(all).toEqual([1, 1, 1]);
  });
});

describe('findBySlug', () => {
  it('finds my org or reports 404', () => {
    const views = [{ slug: 'a' }, { slug: 'b' }];
    expect(findBySlug(views, 'b')).toEqual({ slug: 'b' });
    expect(() => findBySlug(views, 'zzz')).toThrow(OrgNotFoundError);
    try {
      findBySlug(views, 'zzz');
    } catch (error) {
      expect((error as OrgNotFoundError).status).toBe(404);
    }
  });
});

describe('serverFieldErrors', () => {
  const drf = (data: unknown) =>
    new AxiosError('x', 'ERR', undefined, null, {
      status: 400,
      statusText: '',
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
  it('maps DRF field lists onto camelCase form fields', () => {
    expect(
      serverFieldErrors(
        drf({ max_funding_amount: ['Must be greater.'], url: ['Dup.'] })
      )
    ).toEqual({ maxFundingAmount: 'Must be greater.', url: 'Dup.' });
  });
  it('accepts a bare string too (the backend sends both shapes)', () => {
    expect(
      serverFieldErrors(drf({ url: 'This link has already been added.' }))
    ).toEqual({
      url: 'This link has already been added.',
    });
  });
  it('ignores detail-only and non-HTTP errors', () => {
    expect(serverFieldErrors(drf({ detail: 'Nope', code: 'x' }))).toEqual({});
    expect(serverFieldErrors(new Error('boom'))).toEqual({});
  });
});

describe('orgGoneId', () => {
  const notFound = (url: string, status = 404) =>
    new AxiosError('x', 'ERR', { url, headers: new AxiosHeaders() }, null, {
      status,
      statusText: '',
      data: { detail: 'Organization not found.' },
      headers: {},
      config: { headers: new AxiosHeaders() },
    });
  it('spots an org that disappeared under me (archived, removed)', () => {
    expect(orgGoneId(notFound('/organizations/LSLX8YNC2hW8/links'))).toBe(
      'LSLX8YNC2hW8'
    );
    expect(orgGoneId(notFound('/organizations/LSLX8YNC2hW8'))).toBe(
      'LSLX8YNC2hW8'
    );
  });
  it('ignores other errors and routes', () => {
    expect(
      orgGoneId(notFound('/organizations/LSLX8YNC2hW8/links', 400))
    ).toBeNull();
    expect(
      orgGoneId(notFound('/organizations/invitations/preview'))
    ).toBeNull();
    expect(orgGoneId(notFound('/orgs/abc/agents'))).toBeNull();
    expect(orgGoneId(new Error('x'))).toBeNull();
  });
});

describe('missingRequired', () => {
  it('flags blank required fields the sheet marks with *', () => {
    expect(
      missingRequired(
        { organizationType: '', country: 'KE', description: '  ', sectors: [] },
        ['organizationType', 'country', 'description', 'sectors']
      )
    ).toEqual(['organizationType', 'description', 'sectors']);
    expect(missingRequired({ yearFounded: 0 }, ['yearFounded'])).toEqual([]);
  });
});
