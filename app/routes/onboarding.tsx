import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router';
import type { Route } from './+types/onboarding';
import { onboardingFormResolver, type OnboardingForm } from '~/lib/schema';
import { useCreateOrg, useMyOrgs } from '~/features/orgs';
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

export default function OnboardingPage() {
  const navigate = useNavigate();
  const createOrg = useCreateOrg();
  // New users have no org to fall back to — `/app` would send them right back.
  const { data: myOrgs = [] } = useMyOrgs();

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
        <h1 className="text-2xl font-semibold tracking-tight">
          Set up your organization
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Tell us who you are and what you’re after. Your agents use this to
          find and rank opportunities.
        </p>
        <InviteWaiting />
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
      </div>
    </div>
  );
}
