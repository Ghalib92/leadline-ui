import { useNavigate } from 'react-router';
import { useArchiveOrg, useLeaveOrg, useRestoreOrg } from '~/features/orgs';
import { useOrg } from '~/lib/org/org-context';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { AppCard, useConfirm } from '~/components/composed';

/** Archive / restore (admins) and leave (everyone). The backend has no delete. */
export function DangerZone() {
  const { view } = useOrg();
  const navigate = useNavigate();
  const archive = useArchiveOrg(view.id);
  const restore = useRestoreOrg(view.id);
  const leave = useLeaveOrg(view.id);
  const { confirm, confirmDialog } = useConfirm();
  const isAdmin = view.myRole === 'admin';

  const onArchive = async () => {
    const ok = await confirm({
      title: `Archive ${view.name}?`,
      description:
        'Members lose access and pending invitations are revoked. Admins can still see it and restore it at any time.',
      confirmLabel: 'Archive',
      destructive: true,
    });
    if (!ok) return;
    try {
      await archive.mutateAsync();
      toastUtils.success('Organization archived');
    } catch (error) {
      toastUtils.error('Could not archive', extractError(error));
    }
  };

  const onRestore = async () => {
    try {
      await restore.mutateAsync();
      toastUtils.success('Organization restored');
    } catch (error) {
      toastUtils.error('Could not restore', extractError(error));
    }
  };

  const onLeave = async () => {
    const ok = await confirm({
      title: `Leave ${view.name}?`,
      description: 'You’ll lose access until someone invites you again.',
      confirmLabel: 'Leave',
      destructive: true,
    });
    if (!ok) return;
    try {
      await leave.mutateAsync();
      navigate('/app', { replace: true });
    } catch (error) {
      // The last admin can't leave: the backend says so ("Promote another member first").
      toastUtils.error('Could not leave', extractError(error));
    }
  };

  return (
    <AppCard
      title="Danger zone"
      description="These change who can use the organization."
      className="border-destructive/40"
    >
      <div className="space-y-4">
        {isAdmin && (
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm font-medium">
                {view.isArchived
                  ? 'Restore organization'
                  : 'Archive organization'}
              </p>
              <p className="text-xs text-muted-foreground">
                {view.isArchived
                  ? 'Members get access back; nothing was deleted.'
                  : 'Read-only and hidden from members until restored.'}
              </p>
            </div>
            {view.isArchived ? (
              <Button
                variant="outline"
                onClick={onRestore}
                disabled={restore.isPending}
              >
                Restore
              </Button>
            ) : (
              <Button
                variant="destructive"
                onClick={onArchive}
                disabled={archive.isPending}
              >
                Archive
              </Button>
            )}
          </div>
        )}
        <div className="flex flex-col gap-3 border-t border-border pt-4 first:border-0 first:pt-0 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-sm font-medium">Leave organization</p>
            <p className="text-xs text-muted-foreground">
              An organization must keep at least one admin — promote someone
              first if that’s you.
            </p>
          </div>
          <Button
            variant="outline"
            onClick={onLeave}
            disabled={leave.isPending}
          >
            Leave
          </Button>
        </div>
      </div>
      {confirmDialog}
    </AppCard>
  );
}
