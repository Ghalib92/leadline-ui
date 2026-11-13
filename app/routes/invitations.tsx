import { useNavigate, useSearchParams } from 'react-router';
import { MailOpen } from 'lucide-react';
import {
  useAcceptReceived,
  useDeclineReceived,
  useReceivedInvitations,
} from '~/features/invitations';
import { useMyOrgs } from '~/features/orgs';
import type { ReceivedInvitation } from '~/lib/schema';
import { writeLastOrg } from '~/lib/org/last-org';
import { daysUntil, formatDate, initials, timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { AppCard, AppTabs } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Invitations | Leadline',
    description: 'Organizations that invited you to join them on Leadline.',
    url: '/invitations',
    noIndex: true,
  });
}

const roleLabel = (role: ReceivedInvitation['role']) =>
  role === 'admin' ? 'an admin' : 'a member';

/** What happened to a past invitation, for the History tab. */
const outcome: Record<
  Exclude<ReceivedInvitation['status'], 'pending'>,
  { label: string; className: string }
> = {
  accepted: {
    label: 'Accepted',
    className:
      'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300',
  },
  declined: { label: 'Declined', className: 'bg-muted text-muted-foreground' },
  revoked: {
    label: 'Withdrawn',
    className:
      'bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300',
  },
  expired: { label: 'Expired', className: 'bg-muted text-muted-foreground' },
};

function OrgBadge({ name }: Readonly<{ name: string }>) {
  return (
    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary text-sm font-semibold text-primary-foreground">
      {initials(name)}
    </span>
  );
}

function Empty({ title, body }: Readonly<{ title: string; body: string }>) {
  return <EmptyState icon={MailOpen} title={title} description={body} />;
}

/**
 * My invitations: pending ones to answer, and the history of everything
 * else (accepted, declined, withdrawn by the org, expired).
 */
export default function InvitationsPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const tab = searchParams.get('tab') ?? 'pending';
  const { data: invitations = [], isPending } = useReceivedInvitations();
  const myOrgs = useMyOrgs();
  const accept = useAcceptReceived();
  const decline = useDeclineReceived();

  const pending = invitations.filter((i) => i.status === 'pending');
  const past = invitations.filter((i) => i.status !== 'pending');

  const onAccept = async (invite: ReceivedInvitation) => {
    try {
      const { organizationId } = await accept.mutateAsync(invite.id);
      toastUtils.success(`Welcome to ${invite.organizationName}`);
      const { data: orgs = [] } = await myOrgs.refetch();
      const joined = orgs.find((entry) => entry.org.id === organizationId);
      if (joined) {
        writeLastOrg(joined.org.slug);
        navigate(`/o/${joined.org.slug}`);
      } else {
        navigate('/app');
      }
    } catch (error) {
      toastUtils.error('Could not accept', extractError(error));
    }
  };

  const onDecline = (invite: ReceivedInvitation) =>
    decline.mutate(invite.id, {
      onSuccess: () =>
        toastUtils.info('Invitation declined', invite.organizationName),
      onError: (error) =>
        toastUtils.error('Could not decline', extractError(error)),
    });

  const busy = (id: string) =>
    (accept.isPending && accept.variables === id) ||
    (decline.isPending && decline.variables === id);

  const pendingList =
    pending.length === 0 ? (
      <Empty
        title="No pending invitations"
        body="When someone invites you to their organization, it shows up here."
      />
    ) : (
      <AppCard className="py-0" contentClassName="p-0">
        <ul className="divide-y divide-border">
          {pending.map((invite) => (
            <li
              key={invite.id}
              className="flex flex-col gap-3 px-5 py-4 sm:flex-row sm:items-center"
            >
              <OrgBadge name={invite.organizationName} />
              <div className="min-w-0 flex-1">
                <p className="font-medium">{invite.organizationName}</p>
                <p className="text-sm text-muted-foreground">
                  {invite.invitedByName} invited you as {roleLabel(invite.role)}{' '}
                  · {timeAgo(invite.createdAt)} · expires in{' '}
                  {Math.max(daysUntil(invite.expiresAt), 0)}d
                </p>
                {invite.message && (
                  <p className="mt-1 text-sm italic text-muted-foreground">
                    “{invite.message}”
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy(invite.id)}
                  onClick={() => onDecline(invite)}
                  className="flex-1 sm:flex-none"
                >
                  Decline
                </Button>
                <Button
                  size="sm"
                  disabled={busy(invite.id)}
                  onClick={() => onAccept(invite)}
                  className="flex-1 sm:flex-none"
                >
                  Accept
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </AppCard>
    );

  const historyList =
    past.length === 0 ? (
      <Empty
        title="No past invitations"
        body="Invitations you accept or decline — and ones that expire or are withdrawn — are kept here."
      />
    ) : (
      <AppCard className="py-0" contentClassName="p-0">
        <ul className="divide-y divide-border">
          {past.map((invite) => {
            const status = outcome[invite.status as keyof typeof outcome];
            const when =
              invite.status === 'expired'
                ? `expired ${formatDate(invite.expiresAt)}`
                : invite.respondedAt
                  ? `${status.label.toLowerCase()} ${formatDate(invite.respondedAt)}`
                  : `sent ${formatDate(invite.createdAt)}`;
            return (
              <li key={invite.id} className="flex items-center gap-3 px-5 py-4">
                <OrgBadge name={invite.organizationName} />
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{invite.organizationName}</p>
                  <p className="text-sm text-muted-foreground">
                    From {invite.invitedByName}, as {roleLabel(invite.role)} ·{' '}
                    {when}
                  </p>
                </div>
                <span
                  className={cn(
                    'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium',
                    status.className
                  )}
                >
                  {status.label}
                </span>
              </li>
            );
          })}
        </ul>
      </AppCard>
    );

  return (
    <Page width="narrow">
      <PageHeader
        title="Invitations"
        description="Organizations that invited you. Accepting adds them to your organization switcher."
      />
      {isPending ? (
        <PageLoader className="min-h-[30vh]" />
      ) : (
        <AppTabs
          variant="underline"
          value={tab}
          onValueChange={(value) =>
            setSearchParams(value === 'pending' ? {} : { tab: value }, {
              replace: true,
            })
          }
          tabs={[
            {
              value: 'pending',
              label: 'Pending',
              count: pending.length,
              content: pendingList,
            },
            {
              value: 'history',
              label: 'History',
              count: past.length,
              content: historyList,
            },
          ]}
        />
      )}
    </Page>
  );
}
