import { describe, expect, it } from 'vitest';
import { AxiosError, AxiosHeaders } from 'axios';
import { extractError } from './extract-error';

const withBody = (data: unknown) =>
  new AxiosError(
    'Request failed with status code 400',
    'ERR',
    undefined,
    null,
    {
      status: 400,
      statusText: '',
      data,
      headers: {},
      config: { headers: new AxiosHeaders() },
    }
  );

describe('extractError', () => {
  it('prefers the API detail', () => {
    expect(extractError(withBody({ detail: 'Nope' }))).toBe('Nope');
  });
  it('uses the first field message of a DRF validation error', () => {
    expect(
      extractError(withBody({ url: 'This link has already been added.' }))
    ).toBe('This link has already been added.');
    expect(
      extractError(withBody({ max_funding_amount: ['Must be greater.'] }))
    ).toBe('Must be greater.');
  });
  it('falls back to the caller’s message, then axios’s', () => {
    expect(extractError(withBody({}), 'Could not save')).toBe('Could not save');
  });
  it('never reads an HTML error page as a field map', () => {
    expect(
      extractError(withBody('<html>Bad gateway</html>'), 'Try again')
    ).toBe('Try again');
  });
  it('digs into per-item list errors (e.g. invitations on create)', () => {
    expect(
      extractError(
        withBody({
          invitations: [{}, { email: ['Enter a valid email address.'] }],
        })
      )
    ).toBe('Enter a valid email address.');
  });
});
