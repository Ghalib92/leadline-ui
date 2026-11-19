import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import opportunity from '~/lib/schema/__fixtures__/backend/opportunity.json';
import { opportunityDtoSchema, type Opportunity } from '~/lib/schema';
import { BriefCard } from './brief-card';

const opp = opportunityDtoSchema.parse(opportunity);

function renderBrief(value: Opportunity) {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <BriefCard orgId="org" opp={value} />
    </QueryClientProvider>
  );
}

describe('BriefCard', () => {
  it('leads with the next step and shows eligibility, documents and effort', () => {
    renderBrief(opp);
    expect(screen.getByText('Next step')).toBeInTheDocument();
    expect(screen.getByText(/^Confirm the audit gap/)).toBeInTheDocument();
    expect(screen.getByLabelText('Not met')).toBeInTheDocument();
    expect(screen.getByText('Audited accounts')).toBeInTheDocument();
    expect(screen.getByText('Medium')).toBeInTheDocument();
    expect(screen.getByText(/about a week of staff time/)).toBeInTheDocument();
  });

  it('says it is preparing, or offers a retry when it failed', () => {
    const { unmount } = renderBrief({
      ...opp,
      brief: undefined,
      briefStatus: 'pending',
    });
    expect(screen.getByText(/preparing a summary/)).toBeInTheDocument();
    unmount();
    renderBrief({ ...opp, brief: undefined, briefStatus: 'failed' });
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
  });

  it('says which documents the brief read', () => {
    const { unmount } = renderBrief({
      ...opp,
      briefSources: {
        mode: 'folders',
        folders: ['Past proposals'],
        documents: ['2024 water proposal'],
      },
    });
    expect(
      screen.getByText(
        'Based on 2024 water proposal, from your Past proposals folder.'
      )
    ).toBeInTheDocument();
    unmount();
    renderBrief({
      ...opp,
      briefSources: { mode: 'none', folders: [], documents: [] },
    });
    expect(
      screen.getByText('No company documents were used for this summary.')
    ).toBeInTheDocument();
  });
});
