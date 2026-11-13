import { useForm } from 'react-hook-form';
import { Link, useSearchParams } from 'react-router';
import {
  resetPasswordWithCodeResolver,
  type ResetPasswordWithCodeInput,
} from '~/lib/schema';
import {
  applyFieldErrors,
  useResetPasswordWithCode,
  useStartSession,
} from '~/features/auth';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormPasswordField, FormTextField } from '~/components/form-fields';

/** Backend auth: reset with the emailed 6-digit code; signs the user in. */
export function ResetPasswordCodeForm() {
  const [searchParams] = useSearchParams();
  const reset = useResetPasswordWithCode();
  const startSession = useStartSession();

  const form = useForm<ResetPasswordWithCodeInput>({
    resolver: resetPasswordWithCodeResolver,
    defaultValues: {
      email: searchParams.get('email') ?? '',
      code: '',
      password: '',
      confirmPassword: '',
    },
  });

  const onSubmit = async (data: ResetPasswordWithCodeInput) => {
    try {
      const { user } = await reset.mutateAsync(data);
      toastUtils.success('Password updated', `Signed in as ${user.name}.`);
      await startSession('/app');
    } catch (error) {
      applyFieldErrors(error, form.setError);
      toastUtils.error('Reset failed', extractError(error, 'Try again.'));
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Choose a new password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code from the email and a new password (at least 8
          characters). Other devices will be signed out.
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
            placeholder="you@example.org"
            label="Email"
            type="email"
            required
          />
          <FormTextField
            control={form.control}
            name="code"
            autoComplete="one-time-code"
            label="Reset code"
            placeholder="123456"
            required
          />
          <FormPasswordField
            control={form.control}
            name="password"
            autoComplete="new-password"
            placeholder="At least 8 characters"
            label="New password"
            required
          />
          <FormPasswordField
            control={form.control}
            name="confirmPassword"
            autoComplete="new-password"
            placeholder="Type it again"
            label="Confirm new password"
            required
          />
          <Button type="submit" className="w-full" disabled={reset.isPending}>
            {reset.isPending ? 'Saving…' : 'Update password'}
          </Button>
        </form>
      </Form>
      <Link
        to="/auth/forgot-password"
        className="block text-sm text-primary hover:underline"
      >
        Send a new code
      </Link>
    </div>
  );
}
