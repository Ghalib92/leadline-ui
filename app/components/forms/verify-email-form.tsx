import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { MailCheck } from 'lucide-react';
import { verifyEmailResolver, type VerifyEmailInput } from '~/lib/schema';
import {
  applyFieldErrors,
  useResendVerification,
  useStartSession,
  useVerifyEmail,
} from '~/features/auth';
import { safeRedirect } from '~/lib/auth/safe-redirect';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField } from '~/components/form-fields';

/** Backend auth: the 6-digit code from the sign-up email signs the user in. */
export function VerifyEmailForm() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const verify = useVerifyEmail();
  const resend = useResendVerification();
  const startSession = useStartSession();
  const redirectTo = safeRedirect(searchParams.get('redirectTo'), '/app');

  const form = useForm<VerifyEmailInput>({
    resolver: verifyEmailResolver,
    defaultValues: { email: searchParams.get('email') ?? '', code: '' },
  });

  const onSubmit = async (data: VerifyEmailInput) => {
    try {
      const { user, detail } = await verify.mutateAsync(data);
      if (!user) {
        toastUtils.info('Already verified', detail ?? 'Sign in to continue.');
        await navigate(
          `/auth/login?redirectTo=${encodeURIComponent(redirectTo)}`
        );
        return;
      }
      toastUtils.success('Email verified', `Signed in as ${user.name}.`);
      await startSession(redirectTo);
    } catch (error) {
      applyFieldErrors(error, form.setError);
      toastUtils.error(
        'Verification failed',
        extractError(error, 'Try again.')
      );
    }
  };

  const onResend = async () => {
    const valid = await form.trigger('email');
    if (!valid) return;
    try {
      const { detail } = await resend.mutateAsync(form.getValues('email'));
      toastUtils.success('Code sent', detail);
    } catch (error) {
      toastUtils.error(
        'Could not send a code',
        extractError(error, 'Try again.')
      );
    }
  };

  return (
    <div className="space-y-6">
      <MailCheck className="h-10 w-10 text-primary" />
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Verify your email
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter the 6-digit code we sent you. It expires after 15 minutes.
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
            label="Verification code"
            placeholder="123456"
            required
          />
          <Button type="submit" className="w-full" disabled={verify.isPending}>
            {verify.isPending ? 'Verifying…' : 'Verify and continue'}
          </Button>
        </form>
      </Form>
      <p className="text-sm text-muted-foreground">
        No code?{' '}
        <button
          type="button"
          onClick={onResend}
          disabled={resend.isPending}
          className="text-primary hover:underline disabled:opacity-50"
        >
          {resend.isPending ? 'Sending…' : 'Send a new one'}
        </button>
      </p>
      <Link
        to="/auth/login"
        className="block text-sm text-primary hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
