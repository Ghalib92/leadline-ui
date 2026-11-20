// @vitest-environment node
import { describe, expect, it } from 'vitest';
import { renderToString } from 'react-dom/server';
import { createRoutesStub } from 'react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import {
  ForgotPasswordForm,
  LoginForm,
  RegisterForm,
  ResetPasswordCodeForm,
  VerifyEmailForm,
} from '~/components/forms';

/**
 * Submitted before hydration, a form falls back to the browser's native
 * submit. Without `method="post"` that's a GET — email and password end up in
 * the URL, history and server logs.
 */
function ssr(element: React.ReactNode, entry = '/') {
  const Stub = createRoutesStub([{ path: '/', Component: () => element }]);
  return renderToString(
    <QueryClientProvider client={new QueryClient()}>
      <Stub initialEntries={[entry]} />
    </QueryClientProvider>
  );
}

describe('auth forms before JavaScript loads', () => {
  it.each([
    ['LoginForm', <LoginForm key="a" />, '/'],
    ['RegisterForm (business)', <RegisterForm key="b" />, '/?as=business'],
    ['RegisterForm (job seeker)', <RegisterForm key="g" />, '/?as=job-seeker'],
    ['ForgotPasswordForm', <ForgotPasswordForm key="c" />, '/'],
    ['ResetPasswordCodeForm', <ResetPasswordCodeForm key="e" />, '/'],
    ['VerifyEmailForm', <VerifyEmailForm key="f" />, '/'],
  ])('%s never submits credentials in the URL', (_name, element, entry) => {
    const forms = ssr(element, entry).match(/<form\b[^>]*>/g) ?? [];
    expect(forms.length).toBeGreaterThan(0);
    for (const form of forms) expect(form).toMatch(/method="post"/);
  });
});
