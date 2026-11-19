import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import opportunityFixture from '~/lib/schema/__fixtures__/backend/opportunity.json';
import { opportunityDtoSchema, type Opportunity } from '~/lib/schema';
import { ApplicationCard, CvPreview } from './application-card';

const ORG = 'Kq7vB2mXp9Lt';
const job = opportunityDtoSchema.parse({
  ...opportunityFixture,
  opportunity_type: 'job',
  status: 'pursuing',
  job: {
    company: 'Savannah Informatics',
    apply_url: 'https://jobs.example.com/apply',
  },
});
const URL = `*/api/organizations/${ORG}/opportunities/${job.id}/application`;
const APPLICATION = {
  id: 'a1b2c3d4e5f6',
  status: 'ready',
  cover_letter:
    'Dear Hiring Team at Savannah Informatics,\n\nKind regards,\nBrian',
  cv: '# Brian Otieno\nBackend developer\n\n## Experience\n### Software Engineer, Pesapal\n- Cut checkout errors by **30%**',
  gaps: ['The posting asks for GraphQL; your CV doesn’t mention it.'],
  unverified: ['Led a team of five engineers'],
  cv_document_title: 'Brian Otieno CV.pdf',
  apply_url: 'https://jobs.example.com/apply',
  instructions: '',
  error: '',
  edited_by: null,
  edited_at: null,
  updated_at: new Date().toISOString(),
};

function renderCard(opp: Opportunity = job) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={['/o/brian/opportunities/x']}>
        <Routes>
          <Route
            path="/o/:slug/opportunities/:id"
            element={<ApplicationCard orgId={ORG} opp={opp} />}
          />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('ApplicationCard', () => {
  it('shows the letter, the tailored CV, the gaps and where to apply', async () => {
    server.use(http.get(URL, () => HttpResponse.json(APPLICATION)));
    renderCard();
    expect(
      await screen.findByText(/Dear Hiring Team at Savannah Informatics/)
    ).toBeInTheDocument();
    expect(screen.getByText('Brian Otieno')).toBeInTheDocument();
    expect(screen.getByText('30%').tagName).toBe('STRONG');
    expect(screen.getByText(/asks for GraphQL/)).toBeInTheDocument();
    expect(screen.getByText(/your CV doesn’t say this/)).toBeInTheDocument();
    expect(
      screen.getByText('Led a team of five engineers')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('link', { name: /apply on their site/i })
    ).toHaveAttribute('href', 'https://jobs.example.com/apply');
    expect(screen.getByText(/from “Brian Otieno CV.pdf”/)).toBeInTheDocument();
    expect(
      screen.getByText(/Leadline never applies for you/)
    ).toBeInTheDocument();
  });

  it('asks for approval first', () => {
    renderCard({ ...job, status: 'new' });
    expect(screen.getByText(/Approve this job/)).toBeInTheDocument();
  });

  it('links to the upload when there is no CV', async () => {
    server.use(
      http.get(URL, () =>
        HttpResponse.json({
          ...APPLICATION,
          status: 'failed',
          cover_letter: '',
          cv: '',
          gaps: [],
          error:
            'Upload your CV first (Settings, Documents), then write the application again.',
        })
      )
    );
    renderCard();
    expect(
      await screen.findByRole('link', { name: 'Upload your CV' })
    ).toHaveAttribute(
      'href',
      '/o/brian/settings/general?tab=documents&edit=upload'
    );
  });

  it('writes one when there is none', async () => {
    let posted = false;
    server.use(
      http.get(URL, () =>
        posted
          ? HttpResponse.json({ ...APPLICATION, status: 'writing' })
          : HttpResponse.json({ detail: 'Not found.' }, { status: 404 })
      ),
      http.post(URL, () => {
        posted = true;
        return HttpResponse.json(
          { ...APPLICATION, status: 'writing' },
          { status: 202 }
        );
      })
    );
    renderCard();
    await userEvent.click(
      await screen.findByRole('button', { name: /write cover letter and cv/i })
    );
    await waitFor(() =>
      expect(screen.getByText(/Writing your cover letter/)).toBeInTheDocument()
    );
  });
});

describe('CvPreview', () => {
  it('renders headings, bullets and paragraphs, never HTML', () => {
    render(
      <CvPreview
        markdown={'# Amina\n## Skills\n- Python\n- <b>SQL</b>\nPlain line'}
      />
    );
    expect(screen.getByText('Amina')).toBeInTheDocument();
    expect(screen.getByText('Skills')).toBeInTheDocument();
    expect(screen.getAllByRole('listitem')).toHaveLength(2);
    expect(screen.getByText('<b>SQL</b>')).toBeInTheDocument(); // shown as text
    expect(screen.getByText('Plain line')).toBeInTheDocument();
  });
});
