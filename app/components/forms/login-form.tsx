import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { LogIn } from 'lucide-react';
import { loginResolver, type LoginInput } from '~/lib/schema';
import {
  AuthApiError,
  useLogin,
  useStartSession,
  verifyEmailPath,
} from '~/features/auth';
import { safeRedirect } from '~/lib/auth/safe-redirect';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField, FormPasswordField } from '~/components/form-fields';

export function LoginForm() {
  const [searchParams] = useSearchParams();
  const login = useLogin();
  const startSession = useStartSession();
  const navigate = useNavigate();

  // The protected layout parks the attempted URL here so sign-in returns to it.
  const redirectTo = safeRedirect(searchParams.get('redirectTo'));

  const form = useForm<LoginInput>({
    resolver: loginResolver,
    defaultValues: { email: '', password: '' },
  });

  const onSubmit = async (data: LoginInput) => {
    try {
      const session = await login.mutateAsync(data);
      toastUtils.success('Welcome back', `Signed in as ${session.user.name}.`);
      // The server already set the httpOnly session cookie.
      await startSession(redirectTo);
    } catch (error) {
      if (
        error instanceof AuthApiError &&
        error.body.code === 'email_not_verified'
      ) {
        toastUtils.info('Verify your email', 'Enter the code we emailed you.');
        await navigate(
          verifyEmailPath(error.body.email ?? data.email, redirectTo)
        );
        return;
      }
      toastUtils.error(
        'Sign in failed',
        extractError(error, 'Could not sign you in. Please try again.')
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">Welcome back</h1>
        <p className="text-sm text-muted-foreground">
          Sign in to see what your agents found.
        </p>
      </div>
      <Form {...form}>
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <FormTextField
            control={form.control}
            name="email"
            autoComplete="email"
            label="Email"
            type="email"
            placeholder="you@example.com"
            required
          />
          <FormPasswordField
            control={form.control}
            name="password"
            autoComplete="current-password"
            placeholder="Your password"
            label="Password"
            required
          />
          <div className="-mt-2 text-right">
            <Link
              to="/auth/forgot-password"
              className="text-sm text-primary hover:underline"
            >
              Forgot password?
            </Link>
          </div>

          <Button type="submit" className="w-full" disabled={login.isPending}>
            <LogIn className="w-4 h-4" />
            {login.isPending ? 'Signing in…' : 'Sign in'}
          </Button>
        </form>
      </Form>

      <p className="mt-4 text-sm text-muted-foreground">
        No account?{' '}
        <Link
          to={
            redirectTo === '/app'
              ? '/auth/register'
              : `/auth/register?redirectTo=${encodeURIComponent(redirectTo)}`
          }
          className="text-primary hover:underline"
        >
          Create one
        </Link>
      </p>
    </div>
  );
}
