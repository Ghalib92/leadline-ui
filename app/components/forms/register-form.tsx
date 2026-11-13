import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { UserPlus } from 'lucide-react';
import { registerResolver, type RegisterInput } from '~/lib/schema';
import {
  applyFieldErrors,
  useRegister,
  verifyEmailPath,
} from '~/features/auth';
import { safeRedirect } from '~/lib/auth/safe-redirect';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField, FormPasswordField } from '~/components/form-fields';

export function RegisterForm() {
  const register = useRegister();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  // Invites park their URL here so a new account lands back on the invite.
  const redirectParam = searchParams.get('redirectTo');
  const redirectTo = safeRedirect(redirectParam, '/app');

  const form = useForm<RegisterInput>({
    resolver: registerResolver,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: searchParams.get('email') ?? '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    try {
      const { verifyEmail } = await register.mutateAsync(data);
      toastUtils.success('Account created', 'Enter the code we emailed you.');
      await navigate(verifyEmailPath(verifyEmail, redirectTo));
    } catch (error) {
      applyFieldErrors(error, form.setError);
      toastUtils.error(
        'Registration failed',
        extractError(error, 'Could not create your account. Please try again.')
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Create your account
        </h1>
        <p className="text-sm text-muted-foreground">
          Start finding opportunities in minutes.
        </p>
      </div>
      <Form {...form}>
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="firstName"
              autoComplete="given-name"
              label="First name"
              placeholder="Ada"
              required
            />
            <FormTextField
              control={form.control}
              name="lastName"
              autoComplete="family-name"
              label="Last name"
              placeholder="Lovelace"
            />
          </div>
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
            autoComplete="new-password"
            placeholder="At least 8 characters"
            label="Password"
            required
          />
          <FormPasswordField
            control={form.control}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Type it again"
            label="Confirm password"
            required
          />

          <Button
            type="submit"
            className="w-full"
            disabled={register.isPending}
          >
            <UserPlus className="w-4 h-4" />
            {register.isPending ? 'Creating account…' : 'Create account'}
          </Button>
        </form>
      </Form>

      <p className="mt-4 text-sm text-muted-foreground">
        Already registered?{' '}
        <Link
          to={
            redirectParam
              ? `/auth/login?redirectTo=${encodeURIComponent(redirectParam)}`
              : '/auth/login'
          }
          className="text-primary hover:underline"
        >
          Sign in
        </Link>
      </p>
    </div>
  );
}
