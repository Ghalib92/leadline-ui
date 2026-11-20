import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { CandidateProfileTab } from './candidate-profile-tab';

vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    view: {
      id: 'Kq7vB2mXp9Lt',
      myRole: 'admin',
      isArchived: false,
      isCandidate: true,
      profile: {
        name: 'Mohammed Ghalib',
        description: 'Software and AI engineer.',
        country: 'KE',
        city: 'Nairobi',
        contactEmail: '',
        phone: '',
        website: '',
      },
    },
  }),
}));
// The job preferences card has its own tests.
vi.mock('./brief-tabs', () => ({
  JobBriefTab: () => <section>Job preferences</section>,
}));

describe("a job seeker's profile", () => {
  it('is about the person, with no company fields', () => {
    render(
      <QueryClientProvider client={new QueryClient()}>
        <MemoryRouter>
          <CandidateProfileTab editing={null} setEditing={() => {}} />
        </MemoryRouter>
      </QueryClientProvider>
    );
    expect(screen.getByText('Full name')).toBeInTheDocument();
    expect(screen.getByText('Mohammed Ghalib')).toBeInTheDocument();
    expect(screen.getByText('Software and AI engineer.')).toBeInTheDocument();
    expect(screen.getByText('Job preferences')).toBeInTheDocument();
    for (const company of [
      /legal name/i,
      /registration/i,
      /founded/i,
      /annual budget/i,
      /industry/i,
      /past funders/i,
      /mission/i,
      /SDGs/,
      /track record/i,
    ]) {
      expect(screen.queryByText(company)).toBeNull();
    }
  });
});
