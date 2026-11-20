import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate, useSearchParams } from 'react-router';
import type { Route } from './+types/onboarding';
import {
  candidateOnboardingResolver,
  candidateOnboardingSchema,
  onboardingFormResolver,
  type CandidateOnboardingInput,
  type OnboardingForm,
} from '~/lib/schema';
import {
  useCreateCandidateWorkspace,
  useCreateOrg,
  useMyOrgs,
} from '~/features/orgs';
import { useAuth } from '~/lib/auth/use-auth';
import {
  forgetSignup,
  parseKind,
  recallSignup,
  type AccountKind,
} from '~/lib/account-kind';
import { requireSession } from '~/lib/auth/middleware.server';
import { writeLastOrg } from '~/lib/org/last-org';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Form } from '~/components/ui/form';
import {
  MultiStepForm,
  type StepConfig,
} from '~/components/ui/multi-step-form';
import { Logo } from '~/components/brand/logo';
import { InviteWaiting } from '~/components/onboarding/invite-waiting';
import { AccountKindChoice } from '~/components/onboarding/account-kind-choice';
import {
  StepFocus,
  StepOrganization,
  StepPreferences,
  StepTeam,
} from '~/components/onboarding/steps';
import {
  StepAboutYou,
  StepJobsYouWant,
} from '~/components/onboarding/candidate-steps';

export function meta() {
  return generateSEOTags({
    title: 'Set Up Your Organization | Leadline',
    description:
      'Create your organization so Leadline agents know what to look for.',
    url: '/onboarding',
    noIndex: true,
  });
}

export const middleware: Route.MiddlewareFunction[] = [requireSession];

/** Empty on purpose: gives client navigations a server hop so middleware runs. */
export async function loader() {
  return null;
}

const STEPS: StepConfig[] = [
  { key: 'organization', label: 'Organization' },
  { key: 'focus', label: 'What you do' },
  { key: 'preferences', label: 'What you’re after' },
  { key: 'team', label: 'Your team' },
];

const CANDIDATE_STEPS: StepConfig[] = [
  { key: 'about', label: 'About you' },
  { key: 'jobs', label: 'Jobs you want' },
];

export default function OnboardingPage() {
  // New users have no org to fall back to — `/app` would send them right back.
  const { data: myOrgs = [] } = useMyOrgs();
  const [searchParams] = useSearchParams();
  // Picked before sign-up (`?as=`, or remembered when they verified later).
  const [kind, setKind] = useState<AccountKind | null>(() =>
    parseKind(searchParams.get('as'))
  );
  const [businessName, setBusinessName] = useState(
    searchParams.get('name') ?? ''
  );
  useEffect(() => {
    if (kind) return;
    const saved = recallSignup();
    if (saved) {
      setKind(saved.kind);
      if (saved.name) setBusinessName((current) => current || saved.name!);
    }
    // Only on arrival: "Back" clears the choice on purpose.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="min-h-svh bg-muted/30 px-4 py-8 text-foreground">
      <div className="mx-auto flex max-w-2xl items-center justify-between">
        <Logo />
        {myOrgs.length > 0 && (
          <Link
            to="/app"
            className="text-sm text-muted-foreground hover:text-foreground"
          >
            Skip for now
          </Link>
        )}
      </div>
      <div className="mx-auto mt-10 max-w-2xl">
        {kind === null ? (
          <>
            <AccountKindChoice onPick={setKind} />
            <InviteWaiting />
          </>
        ) : kind === 'candidate' ? (
          <CandidateOnboarding onBack={() => setKind(null)} />
        ) : (
          <OrganizationOnboarding
            name={businessName}
            onBack={() => setKind(null)}
          />
        )}
      </div>
    </div>
  );
}

function BackLink({ onBack }: Readonly<{ onBack: () => void }>) {
  return (
    <button
      type="button"
      onClick={onBack}
      className="mb-3 text-sm text-muted-foreground hover:text-foreground"
    >
      ← Back
    </button>
  );
}

function OrganizationOnboarding({
  name,
  onBack,
}: Readonly<{ name: string; onBack: () => void }>) {
  const navigate = useNavigate();
  const createOrg = useCreateOrg();
  const form = useForm<OnboardingForm>({
    resolver: onboardingFormResolver,
    defaultValues: {
      name,
      organizationType: '',
      country: '',
      goals: [],
      description: '',
      mission: '',
      offerings: '',
      sectors: [],
      opportunityTypes: [],
      geographicScopes: [],
      targetRegions: [],
      services: [],
      customerTypes: [],
      targetCities: [],
      tenderCategories: [],
      inviteEmails: [],
      inviteRole: 'member',
    },
  });

  const submit = () =>
    form.handleSubmit(async (data) => {
      try {
        const { view, failed } = await createOrg.mutateAsync(data);
        forgetSignup();
        writeLastOrg(view.slug);
        if (failed.length > 0) {
          toastUtils.warning(
            `${view.name} is ready`,
            `Some details didn’t save (${failed.join(', ')}). Finish them from the setup checklist.`
          );
        } else {
          toastUtils.success(
            'You’re all set',
            `${view.name} is ready. Next: the setup checklist on your overview.`
          );
        }
        navigate(`/o/${view.slug}`, { replace: true });
      } catch (error) {
        toastUtils.error(
          'Could not create organization',
          extractError(error, 'Please try again.')
        );
      }
    })();

  return (
    <>
      <BackLink onBack={onBack} />
      <h1 className="text-2xl font-semibold tracking-tight">
        Set up your organization
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us who you are and what you’re after. Leadline uses this to find
        and rank opportunities for you.
      </p>
      <Form {...form}>
        <MultiStepForm
          steps={STEPS}
          onSubmit={submit}
          isSubmitting={createOrg.isPending}
          submitLabel="Create organization"
          className="mt-6"
        >
          {(step) => {
            switch (step.key) {
              case 'organization':
                return <StepOrganization />;
              case 'focus':
                return <StepFocus />;
              case 'preferences':
                return <StepPreferences />;
              default:
                return <StepTeam />;
            }
          }}
        </MultiStepForm>
      </Form>
    </>
  );
}

function CandidateOnboarding({ onBack }: Readonly<{ onBack: () => void }>) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const create = useCreateCandidateWorkspace();
  const form = useForm<CandidateOnboardingInput>({
    resolver: candidateOnboardingResolver,
    defaultValues: {
      name: user?.name ?? '',
      country: 'KE',
      city: '',
      description: '',
      headline: '',
      targetRoles: [],
      seniority: [],
      workplaces: [],
      skills: [],
      yearsExperience: null,
    },
  });

  const submit = () =>
    form.handleSubmit(async (data) => {
      try {
        const { view, failed } = await create.mutateAsync(
          candidateOnboardingSchema.parse(data)
        );
        forgetSignup();
        writeLastOrg(view.slug);
        if (failed.length > 0) {
          toastUtils.warning(
            'Your workspace is ready',
            'Your job preferences didn’t save; add them on the Searches page.'
          );
        } else {
          toastUtils.success(
            'You’re all set',
            'Next: upload your CV, so Leadline can score jobs against it.'
          );
        }
        navigate(`/o/${view.slug}`, { replace: true });
      } catch (error) {
        toastUtils.error(
          'Could not create your workspace',
          extractError(error, 'Please try again.')
        );
      }
    })();

  return (
    <>
      <BackLink onBack={onBack} />
      <h1 className="text-2xl font-semibold tracking-tight">
        Set up your job search
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        Tell us who you are and what you want. Leadline uses this to find and
        rank jobs.
      </p>
      <Form {...form}>
        <MultiStepForm
          steps={CANDIDATE_STEPS}
          onSubmit={submit}
          isSubmitting={create.isPending}
          submitLabel="Start my job search"
          className="mt-6"
        >
          {(step) =>
            step.key === 'about' ? <StepAboutYou /> : <StepJobsYouWant />
          }
        </MultiStepForm>
      </Form>
    </>
  );
}
