import { useMemo, useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import {
  LogOut,
  Mail,
  RotateCw,
  Search,
  Shield,
  ShieldCheck,
  Trash2,
  UserPlus,
  Users,
} from 'lucide-react';
import { useLeaveOrg } from '~/features/orgs';
import {
  useInvites,
  useMembers,
  useRemoveMember,
  useResendInvite,
  useRevokeInvite,
  useUpdateMemberRole,
} from '~/features/members';
import { ROLE_LABELS, type Invite, type Member, type Role } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useAuth } from '~/lib/auth/use-auth';
import { daysUntil, formatDate, initials, timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { Picker } from '~/components/ui/picker';
import {
  AppCard,
  AppDropdown,
  AppTabs,
  useConfirm,
} from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { FilterPill } from '~/components/dashboard/filter-pill';
import { InviteSheet } from '~/components/org/invite-sheet';
import { RolePill } from '~/components/org/role-pill';
import { Page } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Team | Leadline',
    description:
      'Manage who is in your organization, their roles, and pending invitations.',
    url: '/app',
    noIndex: true,
  });
}

const roleItems = (['admin', 'member'] as const).map((role) => ({
  value: role,
  label: ROLE_LABELS[role],
}));

function SearchBox({
  value,
  onChange,
  placeholder,
}: Readonly<{
  value: string;
  onChange: (v: string) => void;
  placeholder: string;
}>) {
  return (
    <div className="relative w-full sm:w-64">
      <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
      <Input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        aria-label={placeholder}
        className="h-8 pl-8 text-sm"
      />
    </div>
  );
}

export default function TeamPage() {
  const { org, can } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const tab = searchParams.get('tab') ?? 'directory';
  const [inviteOpen, setInviteOpen] = useState(false);

  // Filters & Search
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string | null>(null);

  const { data: members = [] } = useMembers(org.id);
  const { data: invites = [] } = useInvites(org.id);
  const updateRole = useUpdateMemberRole(org.id);
  const removeMember = useRemoveMember(org.id);
  const leave = useLeaveOrg(org.id);
  const resend = useResendInvite(org.id);
  const revoke = useRevokeInvite(org.id);
  const { confirm, confirmDialog } = useConfirm();

  const canManage = can('members.manage');
  const nameOf = (userId: string) =>
    members.find((m) => m.userId === userId)?.name ?? 'A teammate';

  // Filter members
  const needle = query.trim().toLowerCase();
  const visibleMembers = useMemo(
    () =>
      members.filter(
        (m) =>
          (!roleFilter || m.role === roleFilter) &&
          (!needle ||
            m.name.toLowerCase().includes(needle) ||
            m.email.toLowerCase().includes(needle))
      ),
    [members, roleFilter, needle]
  );

  const visibleInvites = useMemo(() => {
    return invites.filter((i) => {
      if (roleFilter && i.role !== roleFilter) return false;
      if (!needle) return true;
      return i.email.toLowerCase().includes(needle);
    });
  }, [invites, roleFilter, needle]);

  const adminCount = members.filter((m) => m.role === 'admin').length;

  const onRole = (member: Member, role: Role) => {
    updateRole.mutate(
      { memberId: member.id, role },
      {
        onSuccess: () =>
          toastUtils.success(
            'Role updated',
            `${member.name} is now ${ROLE_LABELS[role].toLowerCase()}.`
          ),
        onError: (error) =>
          toastUtils.error('Could not change role', extractError(error)),
      }
    );
  };

  const onRemove = async (member: Member) => {
    const isSelf = member.userId === user?.id;
    const ok = await confirm({
      title: isSelf ? `Leave ${org.name}?` : `Remove ${member.name}?`,
      description: isSelf
        ? 'You’ll lose access until someone invites you again.'
        : 'They’ll lose access to the organization immediately.',
      confirmLabel: isSelf ? 'Leave' : 'Remove',
      destructive: true,
    });
    if (!ok) return;
    try {
      if (isSelf) {
        await leave.mutateAsync();
        navigate('/app', { replace: true });
      } else {
        await removeMember.mutateAsync(member.id);
        toastUtils.success('Member removed');
      }
    } catch (error) {
      toastUtils.error('Could not remove', extractError(error));
    }
  };

  const onResend = (invite: Invite) =>
    resend.mutate(invite.id, {
      onSuccess: () =>
        toastUtils.success(
          'New invitation sent',
          'The old link no longer works.'
        ),
      onError: (error) =>
        toastUtils.error('Could not resend', extractError(error)),
    });

  const onRevoke = async (invite: Invite) => {
    const ok = await confirm({
      title: `Revoke invite to ${invite.email}?`,
      description: 'The link will stop working immediately.',
      confirmLabel: 'Revoke',
      destructive: true,
    });
    if (!ok) return;
    revoke.mutate(invite.id, {
      onSuccess: () => toastUtils.success('Invite revoked'),
      onError: (error) =>
        toastUtils.error('Could not revoke', extractError(error)),
    });
  };

  // Top metric overview strip
  const metricStrip = (
    <div className="grid grid-cols-3 gap-3 mb-6">
      <AppCard className="py-0" contentClassName="p-3.5 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10 text-primary">
            <Users className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight truncate tabular-nums">
              {members.length}
            </p>
            <p className="text-xs text-muted-foreground truncate">Members</p>
          </div>
        </div>
      </AppCard>
      <AppCard className="py-0" contentClassName="p-3.5 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
            <ShieldCheck className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight truncate tabular-nums">
              {adminCount}
            </p>
            <p className="text-xs text-muted-foreground truncate">Admins</p>
          </div>
        </div>
      </AppCard>
      <AppCard className="py-0" contentClassName="p-3.5 sm:p-4">
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <div className="flex h-9 w-9 sm:h-10 sm:w-10 shrink-0 items-center justify-center rounded-lg bg-amber-500/10 text-amber-600 dark:text-amber-400">
            <Mail className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xl sm:text-2xl font-bold tracking-tight truncate tabular-nums">
              {invites.length}
            </p>
            <p className="text-xs text-muted-foreground truncate">
              Pending invites
            </p>
          </div>
        </div>
      </AppCard>
    </div>
  );

  const directoryPanel = (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search by name or email…"
        />
        <FilterPill
          label="Role"
          icon={Shield}
          options={roleItems}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </div>

      <AppCard contentClassName="p-0" className="py-0">
        {visibleMembers.length === 0 ? (
          <div className="flex flex-col items-center gap-2 p-10 text-center">
            <Users className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              No members match your search.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visibleMembers.map((member) => {
              const isSelf = member.userId === user?.id;
              const editable = canManage && !isSelf;
              return (
                <li
                  key={member.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                      {initials(member.name)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {member.name}{' '}
                        {isSelf && (
                          <span className="font-normal text-xs text-muted-foreground">
                            (you)
                          </span>
                        )}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {member.email}
                        {member.joinedAt &&
                          ` · Joined ${formatDate(member.joinedAt)}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    {member.status === 'inactive' && (
                      <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
                        Inactive
                      </span>
                    )}
                    {editable ? (
                      <Picker
                        items={roleItems}
                        value={member.role}
                        onChange={(value) =>
                          value &&
                          value !== member.role &&
                          onRole(member, value as Role)
                        }
                        size="sm"
                        searchable={false}
                        clearable={false}
                        className="w-28"
                        aria-label={`Role for ${member.name}`}
                      />
                    ) : (
                      <RolePill role={member.role} />
                    )}
                    {(isSelf || editable) && (
                      <AppDropdown
                        label={`Actions for ${member.name}`}
                        items={[
                          isSelf
                            ? {
                                label: 'Leave organization',
                                icon: LogOut,
                                destructive: true,
                                onSelect: () => onRemove(member),
                              }
                            : {
                                label: 'Remove member',
                                icon: Trash2,
                                destructive: true,
                                onSelect: () => onRemove(member),
                              },
                        ]}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppCard>
    </>
  );

  // Invitations Panel
  const invitesPanel = (
    <>
      <div className="mb-4 flex flex-col gap-2 sm:flex-row sm:items-center">
        <SearchBox
          value={query}
          onChange={setQuery}
          placeholder="Search invitations…"
        />
        <FilterPill
          label="Role"
          icon={Shield}
          options={roleItems}
          value={roleFilter}
          onChange={setRoleFilter}
        />
      </div>

      <AppCard contentClassName="p-0" className="py-0">
        {visibleInvites.length === 0 ? (
          <div className="flex flex-col items-center gap-3 p-10 text-center">
            <Mail className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">
              {invites.length === 0
                ? 'No pending invitations.'
                : 'No invites match your search.'}
            </p>
            {canManage && invites.length === 0 && (
              <Button size="sm" onClick={() => setInviteOpen(true)}>
                <UserPlus className="h-4 w-4 mr-1.5" /> Invite teammates
              </Button>
            )}
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {visibleInvites.map((invite) => {
              const daysLeft = daysUntil(invite.expiresAt);
              const expired = daysLeft < 0;
              return (
                <li
                  key={invite.id}
                  className="flex flex-col gap-3 px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                >
                  <div className="flex items-center gap-3 min-w-0 flex-1">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-dashed border-border text-muted-foreground">
                      <Mail className="h-4 w-4 shrink-0" />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium">
                        {invite.email}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        Invited {timeAgo(invite.createdAt)} by{' '}
                        {nameOf(invite.invitedBy)}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                    <span
                      className={cn(
                        'rounded-full px-2 py-0.5 text-xs whitespace-nowrap',
                        expired
                          ? 'bg-destructive/10 text-destructive'
                          : 'bg-amber-500/10 text-amber-700 dark:text-amber-400'
                      )}
                    >
                      {expired
                        ? 'Expired'
                        : `Pending · ${daysLeft === 0 ? 'expires today' : `${daysLeft}d left`}`}
                    </span>
                    <RolePill role={invite.role} />
                    {canManage && (
                      <AppDropdown
                        label={`Actions for invite to ${invite.email}`}
                        items={[
                          {
                            label: expired
                              ? 'Send new invitation'
                              : 'Resend invitation',
                            icon: RotateCw,
                            onSelect: () => onResend(invite),
                          },
                          'separator',
                          {
                            label: 'Revoke invite',
                            icon: Trash2,
                            destructive: true,
                            onSelect: () => onRevoke(invite),
                          },
                        ]}
                      />
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </AppCard>
    </>
  );

  return (
    <Page>
      <PageHeader
        title="Team"
        description={`Who has access to ${org.name}, and their roles.`}
        actions={
          canManage && (
            <Button onClick={() => setInviteOpen(true)}>
              <UserPlus className="h-4 w-4 mr-1.5" /> Invite Teammate
            </Button>
          )
        }
      />

      {metricStrip}

      <AppTabs
        variant="underline"
        value={tab}
        onValueChange={(value) => {
          setQuery('');
          setRoleFilter(null);
          setSearchParams(value === 'directory' ? {} : { tab: value }, {
            replace: true,
          });
        }}
        tabs={[
          {
            value: 'directory',
            label: 'Members',
            count: members.length,
            content: directoryPanel,
          },
          {
            value: 'invites',
            label: 'Invitations',
            count: invites.length,
            content: invitesPanel,
          },
        ]}
      />

      <InviteSheet open={inviteOpen} onOpenChange={setInviteOpen} />

      {confirmDialog}
    </Page>
  );
}
