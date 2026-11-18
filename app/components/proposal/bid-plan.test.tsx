import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import bid from '~/lib/schema/__fixtures__/backend/bid.json';
import { proposalDtoSchema, type BidPlan } from '~/lib/schema';
import { BidPlanCard } from './bid-plan';
import { jobSteps } from './job-steps';

const plan = proposalDtoSchema.parse(bid).bidPlan as BidPlan;

describe('BidPlanCard', () => {
  it('lists the steps back from closing', () => {
    render(<BidPlanCard plan={plan} />);
    expect(
      screen.getByText(/Closes Thu 26 Nov.* · 8 days left/)
    ).toBeInTheDocument();
    expect(screen.getByText('Clarification deadline')).toBeInTheDocument();
    expect(screen.getAllByLabelText('Passed')).toHaveLength(1);
    expect(screen.getByLabelText('Done')).toBeInTheDocument(); // bid security in hand
    expect(
      screen.getByText(/7 missing: Valid Tax Compliance/)
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Thu 26 Nov, 10:00 · set by the tender/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Time is short/)).not.toBeInTheDocument();
  });

  it('warns when time is short and on the last day', () => {
    render(
      <BidPlanCard
        plan={{
          ...plan,
          daysLeft: 1,
          tight: true,
          steps: [{ ...plan.steps[3], state: 'today' }],
        }}
      />
    );
    expect(screen.getByText(/Time is short/)).toBeInTheDocument();
    expect(screen.getByText(/Closes tomorrow/)).toHaveClass('text-rose-600');
    expect(screen.getByText('Today')).toBeInTheDocument();
  });

  it('says when the tender has closed', () => {
    render(<BidPlanCard plan={{ ...plan, closed: true, daysLeft: -2 }} />);
    expect(screen.getByText(/^Closed Thu 26 Nov/)).toBeInTheDocument();
  });
});

describe('jobSteps', () => {
  const job = (kind: string) => ({
    kind,
    section: '',
    instructions: '',
    queued_at: null,
    started_at: null,
  });

  it('adds the checklist step for bids only', () => {
    expect(
      jobSteps({ job: job('draft'), isTender: true }).map((s) => s.key)
    ).toEqual([
      'requirements',
      'checklist',
      'outline',
      'evidence',
      'draft',
      'review',
    ]);
    expect(
      jobSteps({ job: job('draft'), isTender: false }).map((s) => s.key)
    ).not.toContain('checklist');
    expect(jobSteps({ job: job('checklist'), isTender: true })).toHaveLength(1);
    expect(
      jobSteps({ job: job('section'), isTender: true }).map((s) => s.key)
    ).toEqual(['evidence', 'draft']);
  });
});
