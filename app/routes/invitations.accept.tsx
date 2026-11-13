import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router';
import { isAxiosError } from 'axios';
import { Loader2, MailOpen, Plus } from 'lucide-react';
import {
  useAcceptInvitation,
  useDeclineInvitation,
  useInvitationPreview,
} from '~/features/invitations';
import { useMyOrgs } from '~/features/orgs';
import { useLogout } from '~/features/auth';
import { useAuth } from '~/lib/auth/use-auth';
import { writeLastOrg } from '~/lib/org/last-org';
import {
  clearStashedInvite,
  readStashedInvite,
  dropTokenFromUrl,
  inviteErrorText,
  readTokenFromHash,
  resolveInviteToken,
  stashInvite,
} from '~/lib/org/pending-invite';
import { formatDate } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';

export function meta() {
  return generateSEOTags({
    title: 'Accept Invitation | Leadline',
    description: 'Join the organization that invited you to Leadline.',
    url: '/invitations/accept',
    noIndex: true,
  });
}

const acceptPath = '/invitations/accept';
const status = (error: unknown) =>
  isAxiosError(error) ? error.response?.status : undefined;

function Message({
  title,
  body,
  children,
}: Readonly<{ title: string; body: string; children?: React.ReactNode }>) {
  return (
    <div className="space-y-4">
      <div className="space-y-1">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
      {children}
    </div>
  );
}

const CreateInstead = () => (
  <Link
    to="/onboarding"
    // Choosing their own workspace means this invite shouldn't pull them back.
    onClick={clearStashedInvite}
    className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"
  >
    <Plus className="h-3.5 w-3.5" />
    Want your own workspace instead? Create an organization
  </Link>
);

/**
 * Where invitation emails land: `/invitations/accept#token=…`. The token is
 * kept for this tab (see `pending-invite.ts`) so sign-up → email code →
 * sign-in brings the person back here, and accepting takes them straight
 * into the organization — no create-organization detour.
 */
export default function AcceptInvitationPage() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuth();
  // `undefined` until the browser has read the link (SSR can't see fragments).
  const [token, setToken] = useState<string | null | undefined>(undefined);

  // Read the link once: the effect strips the fragment, so a second run
  // (Strict Mode re-runs effects in development) would see no token.
  const readOnce = useRef(false);
  useEffect(() => {
    if (readOnce.current) return;
    readOnce.current = true;
    const { hash } = globalThis.location;
    const fromLink = readTokenFromHash(hash);
    if (fromLink) stashInvite(fromLink);
    // Drop any token from the address bar (keeps the router's history state).
    if (hash) dropTokenFromUrl(acceptPath);
    setToken(resolveInviteToken(hash, readStashedInvite()));
  }, []);

  const preview = useInvitationPreview(token ?? null, isAuthenticated);
  const myOrgs = useMyOrgs(isAuthenticated);
  const accept = useAcceptInvitation();
  const decline = useDeclineInvitation();
  const logout = useLogout();

  const openOrg = async (organizationId: string) => {
    clearStashedInvite();
    const { data: orgs = [] } = await myOrgs.refetch();
    const joined = orgs.find((entry) => entry.org.id === organizationId);
    if (joined) {
      writeLastOrg(joined.org.slug);
      navigate(`/o/${joined.org.slug}`, { replace: true });
    } else {
      navigate('/app', { replace: true });
    }
  };

  const onAccept = async () => {
    if (!token || !preview.data) return;
    try {
      const { organizationId } = await accept.mutateAsync(token);
      toastUtils.success(`Welcome to ${preview.data.organizationName}`);
      await openOrg(organizationId);
    } catch (error) {
      // Already a member (e.g. accepted in another tab): just go in.
      if (/already an active member/i.test(extractError(error))) {
        await openOrg(preview.data.organizationId);
        return;
      }
      toastUtils.error('Could not accept', extractError(error));
    }
  };

  const onDecline = async () => {
    if (!token) return;
    try {
      await decline.mutateAsync(token);
      clearStashedInvite();
      toastUtils.info('Invitation declined');
      navigate('/app', { replace: true });
    } catch (error) {
      toastUtils.error('Could not decline', extractError(error));
    }
  };

  /** Forget this invite for the tab, so `/app` stops sending them back here. */
  const leave = () => {
    clearStashedInvite();
    navigate('/app');
  };

  const onSwitchAccount = () =>
    logout.mutate(`/auth/login?redirectTo=${encodeURIComponent(acceptPath)}`);

  if (token === undefined || (isAuthenticated && !user)) {
    return (
      <Loader2
        className="mx-auto h-6 w-6 animate-spin text-primary"
        aria-label="Loading"
      />
    );
  }

  if (!token) {
    return (
      <Message
        title="This invite link is incomplete"
        body="Open the link from your invitation email again. If it still doesn’t work, ask for a new invitation."
      >
        <Link to="/app" className="text-sm text-primary hover:underline">
          Go to Leadline
        </Link>
      </Message>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="space-y-6">
        <MailOpen className="h-10 w-10 text-primary" />
        <Message
          title="You’ve been invited to Leadline"
          body="An organization invited you to join their workspace. Create an account with the email address the invitation was sent to — or sign in if you already have one — and we’ll bring you back here."
        />
        <div className="flex flex-col gap-2">
          <Button asChild>
            <Link
              to={`/auth/register?redirectTo=${encodeURIComponent(acceptPath)}`}
            >
              Create an account
            </Link>
          </Button>
          <Button asChild variant="outline">
            <Link
              to={`/auth/login?redirectTo=${encodeURIComponent(acceptPath)}`}
            >
              I already have an account
            </Link>
          </Button>
        </div>
      </div>
    );
  }

  if (preview.isPending) {
    return (
      <Loader2
        className="mx-auto h-6 w-6 animate-spin text-primary"
        aria-label="Loading invitation"
      />
    );
  }

  if (preview.isError) {
    if (status(preview.error) === 403) {
      return (
        <Message
          title="This invitation is for a different email"
          body={`You’re signed in as ${user?.email}. Sign in with the address that received the invitation to accept it.`}
        >
          <div className="flex flex-col gap-2 sm:flex-row">
            <Button
              variant="outline"
              onClick={onSwitchAccount}
              disabled={logout.isPending}
            >
              Sign out and switch account
            </Button>
            <Button variant="ghost" onClick={leave}>
              Not now — go to my workspace
            </Button>
          </div>
        </Message>
      );
    }
    return (
      <Message
        title="This invitation can’t be used"
        body={inviteErrorText(preview.error)}
      >
        <div className="flex flex-col gap-3">
          <Button variant="outline" onClick={leave}>
            Go to my workspace
          </Button>
          <CreateInstead />
        </div>
      </Message>
    );
  }

  const invite = preview.data;
  return (
    <div className="space-y-6">
      <MailOpen className="h-10 w-10 text-primary" />
      <Message
        title={`Join ${invite.organizationName}`}
        body={`${invite.invitedByName} invited you as ${invite.role === 'admin' ? 'an admin' : 'a member'}. The invitation expires ${formatDate(invite.expiresAt)}.`}
      />
      {invite.message && (
        <blockquote className="border-l-2 border-primary/40 pl-3 text-sm text-muted-foreground">
          {invite.message}
        </blockquote>
      )}
      <div className="flex flex-col gap-2 sm:flex-row">
        <Button onClick={onAccept} disabled={accept.isPending}>
          {accept.isPending ? 'Joining…' : `Join ${invite.organizationName}`}
        </Button>
        <Button
          variant="ghost"
          onClick={onDecline}
          disabled={decline.isPending}
        >
          Decline
        </Button>
      </div>
      <CreateInstead />
    </div>
  );
}
