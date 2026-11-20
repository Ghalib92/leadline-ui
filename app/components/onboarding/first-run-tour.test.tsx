import { beforeEach, describe, expect, it, vi } from 'vitest';
import { act, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { FirstRunTour, startTour } from './first-run-tour';

const org = { isCandidate: false };
const setup = { steps: [{ key: 'cv', done: false }] };
vi.mock('~/lib/auth/use-auth', () => ({
  useAuth: () => ({ user: { id: 'u1' }, isAuthenticated: true }),
}));
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({ org, view: { id: 'o1' }, can: () => true }),
}));
vi.mock('~/features/orgs', () => ({
  useSetupStatus: () => ({ data: setup }),
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
      <a href="/o/acme/settings/general" data-tour="profile">
        Profile & CV
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
  setup.steps[0].done = false;
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

  it('takes a job seeker to their CV first, and ends there', async () => {
    org.isCandidate = true;
    const user = userEvent.setup();
    renderTour();
    expect(screen.getByText(/jobs that fit your CV/)).toBeInTheDocument();
    await user.click(screen.getByRole('button', { name: /Show me/ }));
    expect(
      screen.getByRole('heading', { name: '1. Upload your CV' })
    ).toBeInTheDocument();
    expect(screen.getByText('Profile & CV')).toHaveAttribute(
      'data-tour-active'
    );
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /Next/ }));
    }
    expect(screen.getByRole('link', { name: 'Upload my CV' })).toHaveAttribute(
      'href',
      '/o/acme/settings/general?tab=cv'
    );
  });

  it('sends a job seeker with a CV to set up a search', async () => {
    org.isCandidate = true;
    setup.steps[0].done = true;
    const user = userEvent.setup();
    renderTour();
    await user.click(screen.getByRole('button', { name: /Show me/ }));
    for (let i = 0; i < 4; i++) {
      await user.click(screen.getByRole('button', { name: /Next/ }));
    }
    expect(
      screen.getByRole('link', { name: 'Set up a search' })
    ).toBeInTheDocument();
  });
});
