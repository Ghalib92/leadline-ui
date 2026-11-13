import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { ArrowRight, MailOpen } from 'lucide-react';
import { usePendingInvitations } from '~/features/invitations';
import { inviteHint, readStashedInvite } from '~/lib/org/pending-invite';

/**
 * Onboarding is for people starting a workspace. If an invitation is waiting,
 * say so — joining is usually what they came for — without blocking creation.
 */
export function InviteWaiting() {
  const { data: invites = [] } = usePendingInvitations();
  // sessionStorage is browser-only: read it after hydration.
  const [hasLink, setHasLink] = useState(false);
  useEffect(() => setHasLink(!!readStashedInvite()), []);

  const inbox = invites.length;
  const hint = inviteHint({ hasLink, inbox });
  if (!hint) return null;

  return (
    <Link
      to={hint === 'link' ? '/invitations/accept' : '/invitations'}
      className="mt-4 flex items-center gap-3 rounded-xl border border-primary/30 bg-primary/5 px-4 py-3 text-sm hover:bg-primary/10"
    >
      <MailOpen className="h-4 w-4 shrink-0 text-primary" />
      <span className="flex-1">
        {hint === 'link' || inbox === 1
          ? 'You have an invitation waiting. Join that organization instead?'
          : `You have ${inbox} invitations waiting. Join one instead?`}
      </span>
      <ArrowRight className="h-4 w-4 text-primary" />
    </Link>
  );
}
