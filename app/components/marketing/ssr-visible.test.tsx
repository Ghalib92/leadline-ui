// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createRoutesStub } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Hero } from './hero';
import { HowItWorks } from './how-it-works';
import { AgentCard } from './agent-card';

/**
 * The landing page must be readable from the server HTML alone. If an
 * entrance animation hides content until JavaScript runs, a slow or failed
 * bundle leaves the page blank.
 */
function ssr(element: React.ReactNode) {
  const Stub = createRoutesStub([{ path: '/', Component: () => element }]);
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <Stub initialEntries={['/']} />
    </QueryClientProvider>
  );
}

const hidden = /opacity:\s*0(?![.\d])/;

describe('landing page without JavaScript', () => {
  it.each([
    ['Hero', <Hero key="hero" />],
    ['HowItWorks', <HowItWorks key="how" />],
    ['AgentCard', <AgentCard key="card" />],
  ])('%s renders visible content', (_name, element) => {
    const html = ssr(element);
    expect(html.length).toBeGreaterThan(200);
    expect(html).not.toMatch(hidden);
  });
});
