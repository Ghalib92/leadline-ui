import { useEffect } from 'react';
import { useNavigate } from 'react-router';
import { useMyOrgs } from '~/features/orgs';
import { usePendingInvitations } from '~/features/invitations';
import { readLastOrg, resolveLandingPath } from '~/lib/org/last-org';
import { readStashedInvite } from '~/lib/org/pending-invite';
import { generateSEOTags } from '~/lib/utils/seo';
import { Button } from '~/components/ui/button';
import { PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Leadline',
    description: 'Opening your Leadline workspace.',
    url: '/app',
    noIndex: true,
  });
}

/**
 * Post-login landing: a pending invite → last org → first org → the invite
 * inbox → onboarding.
 */
export default function AppLanding() {
  const navigate = useNavigate();
  const { data, isFetching, isError, refetch } = useMyOrgs();
  const invites = usePendingInvitations();
  const inboxCount = invites.data?.length ?? 0;
  // A failed inbox load shouldn't block landing.
  const invitesSettled = !invites.isPending;

  // Wait for a fresh fetch: cached memberships may include an org you were
  // just removed from, which would bounce between here and the org route.
  useEffect(() => {
    if (data && !isFetching && invitesSettled) {
      navigate(
        resolveLandingPath(data, readLastOrg(), {
          pendingInvite: !!readStashedInvite(),
          inboxCount,
        }),
        { replace: true }
      );
    }
  }, [data, isFetching, invitesSettled, inboxCount, navigate]);

  if (isError) {
    return (
      <div className="flex min-h-[60vh] flex-col items-center justify-center gap-3">
        <p className="text-muted-foreground">
          We couldn’t load your organizations.
        </p>
        <Button variant="outline" onClick={() => refetch()}>
          Try again
        </Button>
      </div>
    );
  }

  return <PageLoader className="min-h-[60vh]" />;
}
