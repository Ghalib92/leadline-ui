import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { forgotPasswordResolver, type ForgotPasswordInput } from '~/lib/schema';
import { useForgotPassword } from '~/features/auth';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField } from '~/components/form-fields';

export function ForgotPasswordForm() {
  const forgot = useForgotPassword();
  const navigate = useNavigate();

  const form = useForm<ForgotPasswordInput>({
    resolver: forgotPasswordResolver,
    defaultValues: { email: '' },
  });

  const onSubmit = async (data: ForgotPasswordInput) => {
    try {
      const message = await forgot.mutateAsync(data);
      // The email carries a code, not a link: go straight to where it's typed.
      toastUtils.success('Check your inbox', message);
      await navigate(
        `/auth/reset-password?${new URLSearchParams({ email: data.email })}`
      );
    } catch (error) {
      toastUtils.error(
        'Something went wrong',
        extractError(error, 'Please try again.')
      );
    }
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">
          Reset your password
        </h1>
        <p className="text-sm text-muted-foreground">
          Enter your email and we&apos;ll send you a code to choose a new
          password.
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
          <Button type="submit" className="w-full" disabled={forgot.isPending}>
            {forgot.isPending ? 'Sending…' : 'Send reset code'}
          </Button>
        </form>
      </Form>
      <Link
        to="/auth/login"
        className="block text-sm text-primary hover:underline"
      >
        Back to sign in
      </Link>
    </div>
  );
}
