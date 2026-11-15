import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import clientLead from '~/lib/schema/__fixtures__/backend/client_lead.json';
import { opportunityDtoSchema, type OpportunityBusiness } from '~/lib/schema';
import { BusinessCard } from './business-card';

const lead = opportunityDtoSchema.parse(clientLead);
const business = lead.business!;

function renderCard(overrides: Partial<OpportunityBusiness> = {}) {
  render(
    <BusinessCard
      business={{ ...business, ...overrides }}
      summary={lead.summary}
    />
  );
}

describe('BusinessCard', () => {
  it('shows how to reach the business: call and WhatsApp', () => {
    renderCard();
    expect(
      screen.getByRole('link', { name: '+254 700 000001' })
    ).toHaveAttribute('href', 'tel:+254 700 000001');
    expect(screen.getByRole('link', { name: /whatsapp/i })).toHaveAttribute(
      'href',
      'https://wa.me/254700000001'
    );
    expect(screen.getByRole('link', { name: 'Instagram' })).toBeInTheDocument();
  });

  it('shows the pitch and the signs it needs you', () => {
    renderCard();
    expect(screen.getByText(/a booking site would turn/)).toBeInTheDocument();
    expect(
      screen.getByText('Busy: many reviews or followers')
    ).toBeInTheDocument();
    expect(screen.getByText('4.6 from 230 reviews')).toBeInTheDocument();
  });

  it('says "No website" only when the directory lists websites reliably', () => {
    renderCard();
    // In the website row and as a sign they need you.
    expect(screen.getAllByText('No website')).toHaveLength(2);
  });

  it('never claims an OpenStreetMap business has no website', () => {
    renderCard({
      completeListing: false,
      source: 'osm_places',
      sourceLabel: 'OpenStreetMap',
      signals: [],
    });
    expect(screen.queryByText('No website')).toBeNull();
    expect(
      screen.getByText('Not listed on OpenStreetMap; it may still have one')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/© OpenStreetMap contributors/)
    ).toBeInTheDocument();
  });

  it('links to its own website when it has one', () => {
    renderCard({ website: 'https://www.savannah.co.ke' });
    expect(
      screen.getByRole('link', { name: 'savannah.co.ke' })
    ).toHaveAttribute('href', 'https://www.savannah.co.ke');
  });
});
