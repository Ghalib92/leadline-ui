import { describe, expect, it } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import clientLead from '~/lib/schema/__fixtures__/backend/client_lead.json';
import pitch from '~/lib/schema/__fixtures__/backend/lead_pitch.json';
import { opportunityDtoSchema, type Opportunity } from '~/lib/schema';
import { PitchCard } from './pitch-card';

const ORG = 'Kq7vB2mXp9Lt';
const lead = opportunityDtoSchema.parse({
  ...clientLead,
  status: 'pursuing',
  business: { ...clientLead.business, email: 'info@savannah.co.ke' },
});
const PITCH_URL = `*/api/organizations/${ORG}/opportunities/${lead.id}/pitch`;

function renderCard(opp: Opportunity = lead) {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <PitchCard orgId={ORG} opp={opp} />
    </QueryClientProvider>
  );
}

describe('PitchCard', () => {
  it('shows the pitch with links that open WhatsApp, email and the phone', async () => {
    server.use(http.get(PITCH_URL, () => HttpResponse.json(pitch)));
    renderCard();
    expect(
      await screen.findByText(/guests can't book on your site/)
    ).toBeInTheDocument();
    const whatsapp = screen.getByRole('link', { name: /whatsapp/i });
    expect(whatsapp.getAttribute('href')).toMatch(
      /^https:\/\/wa\.me\/254700000001\?text=Hello%20Savannah%20Lodge/
    );
    const email = screen.getByRole('link', { name: /^email$/i });
    expect(email.getAttribute('href')).toMatch(
      /^mailto:info@savannah\.co\.ke\?subject=Online%20booking/
    );
    expect(
      screen.getByRole('link', { name: '+254 700 000001' })
    ).toHaveAttribute('href', 'tel:+254700000001');
    expect(
      screen.getByText('Could we show you a 10-minute demo?')
    ).toBeInTheDocument();
    expect(screen.getByText(/Nothing is sent by Leadline/)).toBeInTheDocument();
  });

  it('asks to fill in the name only when it is missing', async () => {
    server.use(
      http.get(PITCH_URL, () =>
        HttpResponse.json({
          ...pitch,
          whatsapp: pitch.whatsapp.replace('[Your name]', 'Amina'),
          email_body: pitch.email_body.replace('[Your name]', 'Amina'),
        })
      )
    );
    renderCard();
    expect(
      await screen.findByText(/Nothing is sent by Leadline/)
    ).toBeInTheDocument();
    expect(screen.queryByText(/Fill in \[Your name\]/)).toBeNull();
  });

  it('asks for approval first', () => {
    renderCard({ ...lead, status: 'new' });
    expect(screen.getByText(/Approve this lead/)).toBeInTheDocument();
  });

  it('writes a pitch when there is none', async () => {
    let posted = false;
    server.use(
      http.get(PITCH_URL, () =>
        posted
          ? HttpResponse.json(pitch)
          : HttpResponse.json({ detail: 'No pitch' }, { status: 404 })
      ),
      http.post(PITCH_URL, () => {
        posted = true;
        return HttpResponse.json(
          { ...pitch, status: 'writing', whatsapp: '' },
          { status: 202 }
        );
      })
    );
    const user = userEvent.setup();
    renderCard();
    await user.click(
      await screen.findByRole('button', { name: /write pitch/i })
    );
    expect(await screen.findByText('Writing the pitch…')).toBeInTheDocument();
  });

  it('saves edits as the backend expects', async () => {
    let sent: Record<string, unknown> | undefined;
    server.use(
      http.get(PITCH_URL, () => HttpResponse.json(pitch)),
      http.patch(PITCH_URL, async ({ request }) => {
        sent = (await request.json()) as Record<string, unknown>;
        return HttpResponse.json({
          ...pitch,
          whatsapp: sent.whatsapp,
          edited_by: { id: 'u1', name: 'Mohaa' },
          edited_at: '2026-11-17T12:00:00+03:00',
        });
      })
    );
    const user = userEvent.setup();
    renderCard();
    await user.click(await screen.findByRole('button', { name: /edit/i }));
    const box = screen.getByLabelText('WhatsApp message');
    await user.clear(box);
    await user.type(box, 'Hi Savannah, quick question');
    await user.click(screen.getByRole('button', { name: 'Save' }));
    await waitFor(() => expect(sent).toBeDefined());
    expect(sent).toMatchObject({
      whatsapp: 'Hi Savannah, quick question',
      email_subject: 'Online booking for Savannah Lodge',
      call_points: pitch.call_points,
    });
    expect(await screen.findByText(/Edited by Mohaa/)).toBeInTheDocument();
  });

  it('shows why writing failed, with a retry', async () => {
    server.use(
      http.get(PITCH_URL, () =>
        HttpResponse.json({
          ...pitch,
          status: 'failed',
          whatsapp: '',
          error: 'The AI could not write this pitch.',
        })
      )
    );
    renderCard();
    expect(
      await screen.findByText('The AI could not write this pitch.')
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: /try again/i })
    ).toBeInTheDocument();
  });
});
