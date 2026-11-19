import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FirstRunTour, startTour } from './first-run-tour';

const org = { isCandidate: false };
vi.mock('~/lib/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true }),
}));
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({ org, can: () => true }),
}));

function renderTour() {
  return render(
    <MemoryRouter initialEntries={['/o/acme']}>
      {/* The sidebar items the steps point at. */}
      <a href="/o/acme/agents" data-tour="searches">
        Searches
      </a>
      <a href="/o/acme/calls" data-tour="follow-up">
        Call list
      </a>
      <a href="/o/acme/calendar" data-tour="follow-up">
        Deadlines
      </a>
      <Routes>
        <Route path="/o/:slug" element={<FirstRunTour />} />
      </Routes>
    </MemoryRouter>
  );
}

beforeEach(() => {
  localStorage.clear();
  org.isCandidate = false;
});

describe('FirstRunTour', () => {
  it('walks through the app in order, lighting up each part', async () => {
    const user = userEvent.setup();
    renderTour();
    expect(
      screen.getByRole('heading', { name: 'Welcome to Leadline' })
    ).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /Show me/ }));
    expect(
      screen.getByRole('heading', { name: '1. Set up a search' })
    ).toBeInTheDocument();
    expect(screen.getByText('Searches')).toHaveAttribute('data-tour-active');

    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(
      screen.getByRole('heading', { name: '3. Follow up' })
    ).toBeInTheDocument();
    expect(screen.getByText('Searches')).not.toHaveAttribute(
      'data-tour-active'
    );
    expect(screen.getByText('Call list')).toHaveAttribute('data-tour-active');
    expect(screen.getByText('Deadlines')).toHaveAttribute('data-tour-active');

    await user.click(screen.getByRole('button', { name: /Next/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(
      screen.getByRole('link', { name: 'Set up a search' })
    ).toHaveAttribute('href', '/o/acme/agents?new=1');
  });

  it('shows once, and again on request', async () => {
    const user = userEvent.setup();
    const { unmount } = renderTour();
    await user.click(screen.getByRole('button', { name: 'Skip the tour' }));
    expect(screen.queryByRole('dialog')).toBeNull();
    unmount();

    renderTour();
    expect(screen.queryByRole('dialog')).toBeNull();
    act(() => startTour());
    expect(
      screen.getByRole('heading', { name: 'Welcome to Leadline' })
    ).toBeInTheDocument();
  });

  it('closes with Escape and remembers it', async () => {
    const user = userEvent.setup();
    renderTour();
    await user.keyboard('{Escape}');
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(localStorage.getItem('leadline:tour-done:u1')).toBe('1');
  });

  it('speaks to job seekers about jobs and their CV', async () => {
    org.isCandidate = true;
    const user = userEvent.setup();
    renderTour();
    expect(screen.getByText(/jobs that fit your CV/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show me/ }));
    await user.click(screen.getByRole('button', { name: /Next/ }));
    expect(
      screen.getByRole('heading', { name: '2. See the jobs it found' })
    ).toBeInTheDocument();
  });
});
