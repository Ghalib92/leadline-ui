import { beforeEach, describe, expect, it } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import opportunities from '~/lib/schema/__fixtures__/backend/opportunities.json';
import { useOpportunities } from './queries';

const ORG = 'Kq7vB2mXp9Lt';
let client: QueryClient;
const wrapper = ({ children }: { children: React.ReactNode }) => (
  <QueryClientProvider client={client}>{children}</QueryClientProvider>
);

beforeEach(() => {
  client = new QueryClient({ defaultOptions: { queries: { retry: false } } });
});

describe('useOpportunities', () => {
  it('filters opportunities by run parameter', async () => {
    let capturedRun: string | null = null;
    server.use(
      http.get(`*/api/organizations/${ORG}/opportunities`, ({ request }) => {
        const url = new URL(request.url);
        capturedRun = url.searchParams.get('run');
        return HttpResponse.json(opportunities);
      })
    );

    const { result } = renderHook(
      () => useOpportunities(ORG, { run: 'UdYXctqPZyHk' }),
      { wrapper }
    );

    await waitFor(() => expect(result.current.isSuccess).toBe(true));
    expect(capturedRun).toBe('UdYXctqPZyHk');
    expect(result.current.data?.total).toBe(3);
    expect(result.current.data?.data[0]).toMatchObject({
      id: 'AvDuQK9VnhRH',
      title: '[Sample] Request for proposals: Education services',
      matchScore: 67,
    });
  });
});
