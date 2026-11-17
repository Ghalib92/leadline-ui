import { useForm } from 'react-hook-form';
import { CalendarClock, Trash2 } from 'lucide-react';
import {
  useDeleteActivity,
  useLeadActivity,
  useLogActivity,
} from '~/features/leads';
import {
  CLOSED_OUTCOMES,
  leadChannels,
  leadOutcomes,
  logActivityFormResolver,
  type LeadActivity,
  type LeadChannel,
  type LogActivityFormInput,
  type Opportunity,
} from '~/lib/schema';
import { labelOf } from '~/data/taxonomy';
import { useAuth } from '~/lib/auth/use-auth';
import { useOrg } from '~/lib/org/org-context';
import { extractError } from '~/lib/utils/extract-error';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { AppCard } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import {
  FormPickerField,
  FormTextField,
  FormTextareaField,
} from '~/components/form-fields';
import { useConfirm } from '~/components/ui/confirm-dialog';
import { OutcomeBadge } from './lead-actions';
import { WORKED_LEAD_STATUSES } from './pitch-card';

/** Log a call, message or visit and what came of it. */
export function LogActivityForm({
  orgId,
  oppId,
  defaultChannel = 'call',
  onLogged,
}: Readonly<{
  orgId: string;
  oppId: string;
  defaultChannel?: LeadChannel;
  onLogged?: () => void;
}>) {
  const log = useLogActivity(orgId, oppId);
  const form = useForm<LogActivityFormInput>({
    resolver: logActivityFormResolver,
    defaultValues: {
      channel: defaultChannel,
      outcome: undefined,
      note: '',
      followUpOn: '',
    },
  });
  const outcome = form.watch('outcome');
  const closed = !!outcome && CLOSED_OUTCOMES.includes(outcome);

  return (
    <Form {...form}>
      <form
        className="space-y-3"
        onSubmit={form.handleSubmit((input) =>
          log.mutate(input, {
            onSuccess: () => {
              toastUtils.success('Logged');
              form.reset({
                ...input,
                outcome: undefined,
                note: '',
                followUpOn: '',
              });
              onLogged?.();
            },
            onError: (error) =>
              toastUtils.error('Could not log it', extractError(error)),
          })
        )}
      >
        <div className="grid gap-3 sm:grid-cols-2">
          <FormPickerField
            control={form.control}
            name="channel"
            label="How"
            options={leadChannels}
            searchable={false}
            clearable={false}
          />
          <FormPickerField
            control={form.control}
            name="outcome"
            label="What happened"
            options={leadOutcomes}
            searchable={false}
            clearable={false}
            placeholder="Pick one"
          />
        </div>
        <FormTextareaField
          control={form.control}
          name="note"
          label="Note"
          rows={2}
          placeholder="Spoke to the manager, Grace. Wants a quote by Friday."
        />
        {!closed && (
          <FormTextField
            control={form.control}
            name="followUpOn"
            label="Follow up on"
            type="date"
          />
        )}
        <Button type="submit" size="sm" disabled={log.isPending}>
          Log it
        </Button>
      </form>
    </Form>
  );
}

function ActivityItem({
  activity,
  canDelete,
  onDelete,
}: Readonly<{
  activity: LeadActivity;
  canDelete: boolean;
  onDelete: () => void;
}>) {
  return (
    <li className="flex gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <span className="font-medium">
            {labelOf(leadChannels, activity.channel)}
          </span>
          <OutcomeBadge outcome={activity.outcome} />
          {activity.followUpOn && (
            <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
              <CalendarClock className="h-3.5 w-3.5" /> Follow up{' '}
              {formatDate(activity.followUpOn)}
            </span>
          )}
        </div>
        {activity.note && <p className="text-sm">{activity.note}</p>}
        <p className="text-xs text-muted-foreground">
          {activity.actor?.name ?? 'A former member'} ·{' '}
          {timeAgo(activity.createdAt)}
        </p>
      </div>
      {canDelete && (
        <Button
          variant="ghost"
          size="sm"
          aria-label="Delete entry"
          onClick={onDelete}
        >
          <Trash2 className="h-4 w-4" />
        </Button>
      )}
    </li>
  );
}

/** A client lead's calls and messages, newest first, with a form to log one. */
export function LeadActivityCard({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const approved = WORKED_LEAD_STATUSES.includes(opp.status);
  const { role, can } = useOrg();
  const { user } = useAuth();
  const { data: activities = [] } = useLeadActivity(orgId, opp.id, approved);
  const remove = useDeleteActivity(orgId, opp.id);
  const { confirm, confirmDialog } = useConfirm();

  if (!approved) return null;
  const canLog = can('opportunities.triage');

  const deleteEntry = async (id: string) => {
    const ok = await confirm({
      title: 'Delete this entry?',
      description: 'It leaves the lead’s history and the call list.',
      confirmLabel: 'Delete',
      destructive: true,
    });
    if (ok) {
      remove.mutate(id, {
        onError: (error) =>
          toastUtils.error('Could not delete', extractError(error)),
      });
    }
  };

  return (
    <AppCard title="Calls and messages" contentClassName="space-y-5">
      {canLog && <LogActivityForm orgId={orgId} oppId={opp.id} />}
      {activities.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          Nothing logged yet. After you call or message them, log what happened
          here.
        </p>
      ) : (
        <ul className="space-y-3">
          {activities.map((activity) => (
            <ActivityItem
              key={activity.id}
              activity={activity}
              canDelete={role === 'admin' || activity.actor?.id === user?.id}
              onDelete={() => deleteEntry(activity.id)}
            />
          ))}
        </ul>
      )}
      {confirmDialog}
    </AppCard>
  );
}
