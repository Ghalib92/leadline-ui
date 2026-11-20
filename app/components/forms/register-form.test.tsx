import { beforeEach, describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useLocation } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import { recallSignup } from '~/lib/account-kind';
import { RegisterForm } from './register-form';

function Where() {
  const { pathname, search } = useLocation();
  return <output>{`${pathname}${search}`}</output>;
}

function renderSignUp(entry = '/auth/register') {
  return render(
    <QueryClientProvider client={new QueryClient()}>
      <MemoryRouter initialEntries={[entry]}>
        <Routes>
          <Route path="/auth/register" element={<RegisterForm />} />
          <Route path="/auth/verify-email" element={<Where />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>
  );
}

async function fillAccount(user: ReturnType<typeof userEvent.setup>) {
  await user.type(await screen.findByLabelText(/first name/i), 'Amina');
  await user.type(screen.getByLabelText(/email/i), 'amina@example.com');
  await user.type(
    screen.getByPlaceholderText('At least 8 characters'),
    'Correct-horse-1'
  );
  await user.type(
    screen.getByPlaceholderText('Type it again'),
    'Correct-horse-1'
  );
}

beforeEach(() => {
  localStorage.clear();
  server.use(
    http.post('*/api/auth/register', () =>
      HttpResponse.json({ email: 'amina@example.com' })
    )
  );
});

describe('signing up', () => {
  it('asks what brings you before anything else', () => {
    renderSignUp();
    expect(
      screen.getByRole('heading', { name: 'What brings you to Leadline?' })
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/password/i)).toBeNull();
  });

  it('a job seeker gets a job seeker account, then their job setup', async () => {
    const user = userEvent.setup();
    renderSignUp();
    await user.click(
      screen.getByRole('button', { name: /looking for a job/i })
    );
    expect(
      await screen.findByRole('heading', {
        name: 'Create your job seeker account',
      })
    ).toBeInTheDocument();
    expect(
      screen.queryByLabelText(/business or organization name/i)
    ).toBeNull();

    await fillAccount(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));

    const where = await screen.findByRole('status');
    const next = new URLSearchParams(where.textContent!.split('?')[1]);
    expect(next.get('redirectTo')).toBe('/onboarding?as=job-seeker');
    expect(recallSignup()).toEqual({ kind: 'candidate' });
  });

  it('a business names itself, and setup starts with that name', async () => {
    const user = userEvent.setup();
    renderSignUp('/auth/register?as=business');
    await fillAccount(user);
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    expect(
      await screen.findByText('Enter your business or organization name')
    ).toBeInTheDocument();

    await user.type(
      screen.getByLabelText(/business or organization name/i),
      'Digital Appex'
    );
    await user.click(screen.getByRole('button', { name: 'Create account' }));
    const where = await screen.findByRole('status');
    const next = new URLSearchParams(where.textContent!.split('?')[1]);
    expect(next.get('redirectTo')).toBe(
      '/onboarding?as=business&name=Digital+Appex'
    );
  });

  it('someone invited to a team skips the question', () => {
    renderSignUp('/auth/register?redirectTo=%2Finvite%2Fabc');
    expect(
      screen.getByRole('heading', { name: 'Create your account' })
    ).toBeInTheDocument();
  });
});
