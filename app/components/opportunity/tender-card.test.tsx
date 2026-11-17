import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import tenderFixture from '~/lib/schema/__fixtures__/backend/tender.json';
import opportunityFixture from '~/lib/schema/__fixtures__/backend/opportunity.json';
import { opportunityDtoSchema } from '~/lib/schema';
import { TenderCard } from './tender-card';

const opp = opportunityDtoSchema.parse(tenderFixture);
const tender = opp.tender!;
const NOW = new Date('2026-11-17T09:00:00+03:00');

describe('TenderCard', () => {
  it('shows when it closes, what it costs and the documents', () => {
    render(<TenderCard tender={tender} now={NOW} />);
    expect(screen.getByText('KCG/ICT/014/2026-2027')).toBeInTheDocument();
    expect(screen.getByText(/Closes .* · in 9 days/)).toBeInTheDocument();
    expect(screen.getByText('Free')).toBeInTheDocument();
    expect(screen.getByText('50,000 KES')).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /tender document/i })
    ).toHaveAttribute(
      'href',
      'https://tenders.go.ke/storage/Documents/kcg-014.pdf'
    );
    expect(screen.getByText(/1 addendum issued/)).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: 'procurement@kwale.go.ke' })
    ).toHaveAttribute('href', 'mailto:procurement@kwale.go.ke');
  });

  it('warns about an AGPO reservation and a close deadline', () => {
    render(
      <TenderCard tender={tender} now={new Date('2026-11-25T09:00:00+03:00')} />
    );
    expect(screen.getByText(/Reserved under AGPO for/)).toBeInTheDocument();
    expect(screen.getByText('youth')).toBeInTheDocument();
    expect(screen.getByText(/· tomorrow/)).toHaveClass('text-rose-600');
  });

  it('is absent for opportunities that are not portal tenders', () => {
    expect(
      opportunityDtoSchema.parse(opportunityFixture).tender
    ).toBeUndefined();
    expect(
      opportunityDtoSchema.parse({ ...opportunityFixture, tender: {} }).tender
    ).toBeUndefined();
  });

  it('drops document links that are not web addresses', () => {
    const parsed = opportunityDtoSchema.parse({
      ...tenderFixture,
      tender: {
        ...tenderFixture.tender,
        documents: [{ name: 'Bad', url: 'javascript:alert(1)' }],
      },
    });
    expect(parsed.tender?.documents).toEqual([]);
  });
});
