import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import opportunityFixture from '~/lib/schema/__fixtures__/backend/opportunity.json';
import { opportunityDtoSchema } from '~/lib/schema';
import { JobCard } from './job-card';

const job = opportunityDtoSchema.parse({
  ...opportunityFixture,
  opportunity_type: 'job',
  job: {
    company: 'Moniepoint',
    location: 'Nairobi, Kenya',
    workplace: 'hybrid',
    employment_type: 'Full-time',
    department: 'Engineering',
    salary: '',
    posted: '2026-11-10',
    url: 'https://job-boards.greenhouse.io/moniepoint/jobs/1',
    apply_url: '',
    system: 'greenhouse',
  },
});

describe('JobCard', () => {
  it('shows the posting and links to apply on the company’s site', () => {
    expect(job.type).toBe('job');
    render(<JobCard job={job.job!} />);
    expect(screen.getByText('Moniepoint')).toBeInTheDocument();
    expect(screen.getByText('Hybrid')).toBeInTheDocument();
    expect(screen.queryByText('Salary')).toBeNull(); // not stated
    expect(
      screen.getByRole('link', { name: /apply on their site/i })
    ).toHaveAttribute(
      'href',
      'https://job-boards.greenhouse.io/moniepoint/jobs/1'
    );
    expect(screen.getByText(/doesn.t apply for you/)).toBeInTheDocument();
  });

  it('drops links that are not web addresses', () => {
    const parsed = opportunityDtoSchema.parse({
      ...opportunityFixture,
      opportunity_type: 'job',
      job: { company: 'X', url: 'javascript:alert(1)', apply_url: '' },
    });
    expect(parsed.job?.applyUrl).toBe('');
    render(<JobCard job={parsed.job!} />);
    expect(screen.queryByRole('link')).toBeNull();
  });
});
