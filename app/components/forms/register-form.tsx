import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import { UserPlus } from 'lucide-react';
import { registerResolver, type RegisterInput } from '~/lib/schema';
import {
  applyFieldErrors,
  useRegister,
  verifyEmailPath,
} from '~/features/auth';
import {
  kindParam,
  onboardingPath,
  parseKind,
  rememberSignup,
  type AccountKind,
} from '~/lib/account-kind';
import { safeRedirect } from '~/lib/auth/safe-redirect';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextField, FormPasswordField } from '~/components/form-fields';
import { AccountKindChoice } from '~/components/onboarding/account-kind-choice';

const COPY: Record<
  AccountKind | 'invited',
  { title: string; body: string; email: string }
> = {
  organization: {
    title: 'Create your business account',
    body: 'Next you tell us what you sell and what you’re after: clients, tenders or grants.',
    email: 'Work email',
  },
  candidate: {
    title: 'Create your job seeker account',
    body: 'Next you tell us the jobs you want, then upload your CV.',
    email: 'Email',
  },
  invited: {
    title: 'Create your account',
    body: 'Then join the team that invited you.',
    email: 'Email',
  },
};

/**
 * Sign-up starts with "What brings you to Leadline?" (`?as=` holds the
 * answer), then an account form that fits it, then that kind's setup. People
 * joining through an invitation skip the question: they join a team.
 */
export function RegisterForm() {
  const [searchParams, setSearchParams] = useSearchParams();
  // Invites park their URL here so a new account lands back on the invite.
  const redirectParam = searchParams.get('redirectTo');
  const kind = parseKind(searchParams.get('as'));

  if (!kind && !redirectParam) {
    return (
      <div className="space-y-6">
        <AccountKindChoice
          columns={1}
          subtitle="Pick one to create the right account. You can add the other later."
          onPick={(picked) =>
            setSearchParams(
              (current) => {
                const next = new URLSearchParams(current);
                next.set('as', kindParam(picked));
                return next;
              },
              { replace: false }
            )
          }
        />
        <SignInLink redirectParam={redirectParam} />
      </div>
    );
  }
  return <AccountForm kind={kind} redirectParam={redirectParam} />;
}

function AccountForm({
  kind,
  redirectParam,
}: Readonly<{ kind: AccountKind | null; redirectParam: string | null }>) {
  const register = useRegister();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const business = kind === 'organization';
  const copy = COPY[kind ?? 'invited'];

  const form = useForm<RegisterInput>({
    resolver: registerResolver,
    defaultValues: {
      firstName: '',
      lastName: '',
      email: searchParams.get('email') ?? '',
      password: '',
      confirmPassword: '',
      businessName: '',
    },
  });

  const onSubmit = async (data: RegisterInput) => {
    const name = data.businessName?.trim() ?? '';
    if (business && !name) {
      form.setError('businessName', {
        message: 'Enter your business or organization name',
      });
      return;
    }
    // An invitation lands back on the invite; everyone else goes to the
    // setup for what they picked.
    let next = safeRedirect(redirectParam, '/app');
    if (kind) {
      rememberSignup({ kind, ...(name ? { name } : {}) });
      if (!redirectParam) next = onboardingPath(kind, name || undefined);
    }
    try {
      const { verifyEmail } = await register.mutateAsync(data);
      toastUtils.success('Account created', 'Enter the code we emailed you.');
      await navigate(verifyEmailPath(verifyEmail, next));
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
        {kind && !redirectParam && (
          <button
            type="button"
            onClick={() =>
              setSearchParams((current) => {
                const nextParams = new URLSearchParams(current);
                nextParams.delete('as');
                return nextParams;
              })
            }
            className="mb-2 text-sm text-muted-foreground hover:text-foreground"
          >
            ← Back
          </button>
        )}
        <h1 className="text-2xl font-semibold tracking-tight">{copy.title}</h1>
        <p className="text-sm text-muted-foreground">{copy.body}</p>
      </div>
      <Form {...form}>
        <form
          method="post"
          onSubmit={form.handleSubmit(onSubmit)}
          className="space-y-4"
        >
          {business && (
            <FormTextField
              control={form.control}
              name="businessName"
              autoComplete="organization"
              label="Business or organization name"
              placeholder="e.g. Digital Appex"
              required
            />
          )}
          <div className="grid gap-4 sm:grid-cols-2">
            <FormTextField
              control={form.control}
              name="firstName"
              autoComplete="given-name"
              label={business ? 'Your first name' : 'First name'}
              placeholder="Amina"
              required
            />
            <FormTextField
              control={form.control}
              name="lastName"
              autoComplete="family-name"
              label="Last name"
              placeholder="Otieno"
            />
          </div>
          <FormTextField
            control={form.control}
            name="email"
            autoComplete="email"
            label={copy.email}
            type="email"
            placeholder={
              business ? 'you@yourbusiness.co.ke' : 'you@example.com'
            }
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
          <p className="text-center text-xs text-muted-foreground">
            See how we handle your data in our{' '}
            <Link
              to="/privacy"
              target="_blank"
              className="font-medium text-primary hover:underline"
            >
              privacy page
            </Link>
            .
          </p>
        </form>
      </Form>

      <SignInLink redirectParam={redirectParam} />
    </div>
  );
}

function SignInLink({
  redirectParam,
}: Readonly<{ redirectParam: string | null }>) {
  return (
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
  );
}
