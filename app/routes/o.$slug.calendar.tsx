import { useMemo, useState } from 'react';
import { Link } from 'react-router';
import { Bell, CalendarDays, CalendarPlus } from 'lucide-react';
import {
  downloadDeadlines,
  useDeadlines,
  useReminderPreference,
  useUpdateReminderPreference,
} from '~/features/outreach';
import type { Deadline } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { extractError } from '~/lib/utils/extract-error';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import { AppCard } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Deadlines | Leadline',
    description: 'Upcoming deadlines for the opportunities you are pursuing.',
    url: '/app',
    noIndex: true,
  });
}

const RANGES = [
  { days: 30, label: '30 days' },
  { days: 90, label: '3 months' },
  { days: 180, label: '6 months' },
];
const REMINDER_DAYS = [30, 14, 7, 3, 1];

const isoDay = (date: Date) => date.toISOString().slice(0, 10);

const STATUS_LABEL: Record<string, string> = {
  pursuing: 'Pursuing',
  submitted: 'Submitted',
  new: 'Saved',
  reviewing: 'Saved',
};

/** Job seekers apply; they don't pursue or submit bids. */
const JOB_STATUS_LABEL: Record<string, string> = {
  pursuing: 'Applying',
  submitted: 'Applied',
  new: 'Saved',
  reviewing: 'Saved',
};

export default function CalendarPage() {
  const { org, view } = useOrg();
  const candidate = view.isCandidate;
  const [days, setDays] = useState(90);
  const { from, to } = useMemo(() => {
    const start = new Date();
    const end = new Date(start.getTime() + days * 86_400_000);
    return { from: isoDay(start), to: isoDay(end) };
  }, [days]);
  const { data: deadlines = [], isPending } = useDeadlines(org.id, from, to);

  const months = useMemo(() => {
    const groups = new Map<string, Deadline[]>();
    for (const item of deadlines) {
      const month = new Date(item.deadline).toLocaleDateString(undefined, {
        month: 'long',
        year: 'numeric',
      });
      groups.set(month, [...(groups.get(month) ?? []), item]);
    }
    return [...groups.entries()];
  }, [deadlines]);

  return (
    <Page>
      <PageHeader
        title="Deadlines"
        description={
          candidate
            ? 'Closing dates of the jobs you saved or are applying for, soonest first.'
            : 'Opportunities you are pursuing, submitted or saved, soonest first.'
        }
        actions={
          <Button
            variant="outline"
            onClick={() =>
              downloadDeadlines(org.id, { from, to }).catch((error) =>
                toastUtils.error('Download failed', extractError(error))
              )
            }
          >
            <CalendarPlus className="h-4 w-4" /> Add all to calendar
          </Button>
        }
      />

      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <div>
          <div className="mb-4 flex gap-1 rounded-full bg-muted p-0.5 sm:w-fit">
            {RANGES.map((range) => (
              <button
                key={range.days}
                type="button"
                aria-pressed={days === range.days}
                onClick={() => setDays(range.days)}
                className={cn(
                  'flex-1 rounded-full px-4 py-1.5 text-sm sm:flex-none',
                  days === range.days
                    ? 'bg-background font-medium shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {range.label}
              </button>
            ))}
          </div>

          {isPending ? (
            <PageLoader className="min-h-[20vh]" />
          ) : months.length === 0 ? (
            <EmptyState
              icon={CalendarDays}
              title="No deadlines in this period"
              description={
                candidate
                  ? 'Approve or save jobs to see when they close here.'
                  : 'Approve or save opportunities to track their deadlines here.'
              }
            />
          ) : (
            <div className="space-y-6">
              {months.map(([month, items]) => (
                <section key={month}>
                  <h2 className="mb-2 text-sm font-semibold text-muted-foreground">
                    {month}
                  </h2>
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {items.map((item) => (
                      <DeadlineRow
                        key={item.id}
                        item={item}
                        labels={candidate ? JOB_STATUS_LABEL : STATUS_LABEL}
                      />
                    ))}
                  </ul>
                </section>
              ))}
            </div>
          )}
        </div>

        <ReminderCard orgId={org.id} candidate={candidate} />
      </div>
    </Page>
  );
}

function DeadlineRow({
  item,
  labels,
}: Readonly<{ item: Deadline; labels: Record<string, string> }>) {
  const path = useOrgPath();
  const date = new Date(item.deadline);
  const urgent = item.daysLeft <= 7;
  return (
    <li className="flex items-center gap-4 px-4 py-3">
      <div className="w-12 shrink-0 text-center">
        <p className="text-xs text-muted-foreground">
          {date.toLocaleDateString(undefined, { weekday: 'short' })}
        </p>
        <p className="text-xl font-semibold tabular-nums">{date.getDate()}</p>
      </div>
      <div className="min-w-0 flex-1">
        <Link
          to={path(`/opportunities/${item.id}`)}
          className="block truncate text-sm font-medium hover:underline"
        >
          {item.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">
          {item.funder} · {labels[item.status] ?? item.status}
        </p>
      </div>
      <span
        className={cn(
          'shrink-0 rounded-full px-2.5 py-0.5 text-xs font-medium tabular-nums',
          urgent
            ? 'bg-destructive/10 text-destructive'
            : 'bg-muted text-muted-foreground'
        )}
      >
        {item.daysLeft <= 0
          ? 'Today'
          : item.daysLeft === 1
            ? 'Tomorrow'
            : `${item.daysLeft} days`}
      </span>
    </li>
  );
}

function ReminderCard({
  orgId,
  candidate,
}: Readonly<{ orgId: string; candidate: boolean }>) {
  const { data: preference } = useReminderPreference(orgId);
  const update = useUpdateReminderPreference(orgId);
  if (!preference) return null;
  const save = (input: {
    enabled?: boolean;
    days_before?: number[];
    weekly_digest?: boolean;
  }) =>
    update.mutate(input, {
      onError: (error) => toastUtils.error('Not saved', extractError(error)),
    });
  const toggleDay = (day: number) => {
    const chosen = preference.daysBefore.includes(day)
      ? preference.daysBefore.filter((d) => d !== day)
      : [...preference.daysBefore, day];
    if (chosen.length > 0) save({ days_before: chosen });
  };
  return (
    <AppCard
      className="h-fit"
      title={
        <span className="inline-flex items-center gap-1.5">
          <Bell className="h-4 w-4" /> Email reminders
        </span>
      }
      description={
        candidate
          ? 'An email before each job closes, with a calendar file.'
          : 'Sent to admins and whoever approved the opportunity, with a calendar file.'
      }
    >
      <div className="flex items-center justify-between gap-3 text-sm">
        <label htmlFor="reminders-enabled">Remind me</label>
        <Switch
          id="reminders-enabled"
          checked={preference.enabled}
          onCheckedChange={(enabled) => save({ enabled })}
        />
      </div>
      <p className="mt-4 text-xs text-muted-foreground">Days before</p>
      <div className="mt-1.5 flex flex-wrap gap-1.5">
        {REMINDER_DAYS.map((day) => {
          const on = preference.daysBefore.includes(day);
          return (
            <button
              key={day}
              type="button"
              disabled={!preference.enabled}
              aria-pressed={on}
              onClick={() => toggleDay(day)}
              className={cn(
                'rounded-full border px-3 py-1 text-xs transition-colors disabled:opacity-50',
                on
                  ? 'border-primary bg-primary text-primary-foreground'
                  : 'border-border hover:bg-muted'
              )}
            >
              {day === 1 ? '1 day' : `${day} days`}
            </button>
          );
        })}
      </div>
      <div className="mt-5 flex items-start justify-between gap-3 border-t border-border pt-4 text-sm">
        <label htmlFor="weekly-digest">
          Monday summary
          <span className="block text-xs text-muted-foreground">
            {candidate
              ? 'The week’s best jobs for you and what closes soon.'
              : 'The week’s best finds, what closes soon and who to call back.'}
          </span>
        </label>
        <Switch
          id="weekly-digest"
          checked={preference.weeklyDigest}
          onCheckedChange={(weekly_digest) => save({ weekly_digest })}
        />
      </div>
    </AppCard>
  );
}
