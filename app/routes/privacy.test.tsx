import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router';
import PrivacyPage, { CONTACT_EMAIL } from './privacy';

function renderPage() {
  return render(
    <MemoryRouter>
      <PrivacyPage />
    </MemoryRouter>
  );
}

describe('privacy page', () => {
  it('names who is responsible and how to reach them', () => {
    renderPage();
    expect(screen.getAllByText(/Digital Appex Limited/).length).toBeGreaterThan(
      0
    );
    const links = screen.getAllByRole('link', { name: CONTACT_EMAIL });
    expect(links[0]).toHaveAttribute('href', `mailto:${CONTACT_EMAIL}`);
  });

  it('keeps how Leadline is built to itself', () => {
    renderPage();
    for (const name of [/Groq/, /Gemini/, /Vercel/, /Tavily/, /Frankfurt/]) {
      expect(screen.queryByText(name)).toBeNull();
    }
    expect(
      screen.getByText(/never send your documents, CVs or drafts/)
    ).toBeInTheDocument();
  });

  it('lists the rights people have and where to complain', () => {
    renderPage();
    expect(screen.getByText(/delete your data or your account/)).toBeVisible();
    expect(
      screen.getByRole('link', {
        name: 'Office of the Data Protection Commissioner',
      })
    ).toHaveAttribute('href', 'https://www.odpc.go.ke');
  });
});
