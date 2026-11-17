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

const oldSite: NonNullable<OpportunityBusiness['site']> = {
  url: 'https://kilima.co.ke/',
  reachable: true,
  problem: '',
  blocked: false,
  https: false,
  certificateError: false,
  mobileReady: false,
  copyrightYear: 2017,
  booking: true,
  chat: undefined,
  payments: undefined,
  mobileSpeed: 31,
  checkedAt: '2026-11-17',
  readBy: 'Jina Reader',
};

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

  it('shows the pitch and why they need you, in checked facts', () => {
    renderCard();
    expect(screen.getByText(/a booking site would turn/)).toBeInTheDocument();
    expect(screen.getByText('Why they need you')).toBeInTheDocument();
    expect(
      screen.getByText('Google Maps lists no website for it.')
    ).toBeInTheDocument();
    expect(
      screen.getByText('230 reviews: a busy business.')
    ).toBeInTheDocument();
    expect(screen.getByText('4.6 from 230 reviews')).toBeInTheDocument();
  });

  it('shows signs without evidence as labels (leads from before the lookup)', () => {
    renderCard({ evidence: [] });
    expect(
      screen.getByText('Busy: many reviews or followers')
    ).toBeInTheDocument();
    // In the website row and as a sign they need you.
    expect(screen.getAllByText('No website')).toHaveLength(2);
  });

  it('says "No website" only when the directory lists websites reliably', () => {
    renderCard();
    expect(screen.getAllByText('No website')).toHaveLength(1);
  });

  it('never claims an OpenStreetMap business has no website', () => {
    renderCard({
      completeListing: false,
      websiteStatus: 'unknown',
      source: 'osm_places',
      sourceLabel: 'OpenStreetMap',
      signals: [],
      evidence: [],
    });
    expect(screen.queryByText('No website')).toBeNull();
    expect(
      screen.getByText('Not listed on OpenStreetMap; it may still have one')
    ).toBeInTheDocument();
    expect(
      screen.getByText(/© OpenStreetMap contributors/)
    ).toBeInTheDocument();
  });

  it('says when a web search found no website either', () => {
    renderCard({
      completeListing: false,
      websiteStatus: 'not_found',
      sourceLabel: 'OpenStreetMap',
    });
    expect(
      screen.getByText('None found on OpenStreetMap or in a web search')
    ).toBeInTheDocument();
  });

  it('links to its own website when it has one', () => {
    renderCard({
      website: 'https://www.savannah.co.ke',
      websiteStatus: 'listed',
    });
    expect(
      screen.getByRole('link', { name: 'savannah.co.ke' })
    ).toHaveAttribute('href', 'https://www.savannah.co.ke');
  });

  it('marks what the lookup found, and where', () => {
    renderCard({
      website: 'https://kilima.co.ke/',
      websiteStatus: 'found',
      email: 'info@kilima.co.ke',
      foundOn: { website: 'web search', email: 'website', phone: 'Hunter' },
    });
    expect(
      screen.getByRole('link', { name: 'kilima.co.ke' })
    ).toBeInTheDocument();
    expect(screen.getByText('found in a web search')).toBeInTheDocument();
    expect(screen.getByText('from their website')).toBeInTheDocument();
    expect(screen.getByText('from Hunter.io')).toBeInTheDocument();
  });

  it('says why a website is down', () => {
    renderCard({
      website: 'https://gone.co.ke',
      websiteStatus: 'down',
      site: {
        ...oldSite,
        reachable: false,
        problem: 'its domain no longer resolves',
      },
    });
    expect(
      screen.getByText('Down: its domain no longer resolves')
    ).toBeInTheDocument();
    expect(screen.queryByText('Website check')).toBeNull();
  });

  it('lists the website checks that ran, passed or not', () => {
    renderCard({
      website: 'https://kilima.co.ke/',
      websiteStatus: 'listed',
      site: oldSite,
    });
    expect(screen.getByText('Website check')).toBeInTheDocument();
    expect(screen.getByText('© 2017')).toBeInTheDocument();
    expect(screen.getByText('Speed on phones 31/100')).toBeInTheDocument();
    expect(screen.getByText('Online booking')).toBeInTheDocument();
    expect(screen.queryByText('Chat')).toBeNull(); // not checked: not shown
    expect(screen.getAllByLabelText('no')).toHaveLength(4);
    expect(screen.getAllByLabelText('yes')).toHaveLength(1);
    expect(
      screen.getByText('Checked 2026-11-17 · read through Jina Reader')
    ).toBeInTheDocument();
  });

  it('says when a site refuses automated checks', () => {
    renderCard({
      website: 'https://kilima.co.ke/',
      websiteStatus: 'listed',
      site: { ...oldSite, blocked: true },
    });
    expect(
      screen.getByText("The site doesn't allow automated checks")
    ).toBeInTheDocument();
  });
});
