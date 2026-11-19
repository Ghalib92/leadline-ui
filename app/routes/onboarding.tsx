import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import { Briefcase, Building2 } from 'lucide-react';
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
import { cn } from '~/lib/utils';
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

type Kind = 'organization' | 'candidate';

const KINDS: {
  value: Kind;
  title: string;
  body: string;
  icon: typeof Building2;
}[] = [
  {
    value: 'organization',
    title: 'My business or organization',
    body: 'Find clients, tenders and grants, and get the pitch or the bid written.',
    icon: Building2,
  },
  {
    value: 'candidate',
    title: 'I’m looking for a job',
    body: 'Find jobs that fit your CV on company career pages and job boards.',
    icon: Briefcase,
  },
];

export default function OnboardingPage() {
  // New users have no org to fall back to — `/app` would send them right back.
  const { data: myOrgs = [] } = useMyOrgs();
  const [kind, setKind] = useState<Kind | null>(null);

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
            <KindChoice onPick={setKind} />
            <InviteWaiting />
          </>
        ) : kind === 'candidate' ? (
          <CandidateOnboarding onBack={() => setKind(null)} />
        ) : (
          <OrganizationOnboarding onBack={() => setKind(null)} />
        )}
      </div>
    </div>
  );
}

function KindChoice({ onPick }: Readonly<{ onPick: (kind: Kind) => void }>) {
  return (
    <>
      <h1 className="text-2xl font-semibold tracking-tight">
        What brings you to Leadline?
      </h1>
      <p className="mt-1 text-sm text-muted-foreground">
        You can add the other later with a new workspace.
      </p>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {KINDS.map((option) => (
          <button
            key={option.value}
            type="button"
            onClick={() => onPick(option.value)}
            className={cn(
              'rounded-xl border border-border bg-background p-5 text-left transition-colors hover:border-primary hover:bg-primary/5'
            )}
          >
            <option.icon className="h-6 w-6 text-primary" />
            <p className="mt-3 font-semibold">{option.title}</p>
            <p className="mt-1 text-sm text-muted-foreground">{option.body}</p>
          </button>
        ))}
      </div>
    </>
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

function OrganizationOnboarding({ onBack }: Readonly<{ onBack: () => void }>) {
  const navigate = useNavigate();
  const createOrg = useCreateOrg();
  const form = useForm<OnboardingForm>({
    resolver: onboardingFormResolver,
    defaultValues: {
      name: '',
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
