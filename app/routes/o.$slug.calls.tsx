import { useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  CalendarClock,
  ClipboardList,
  ExternalLink,
  Loader2,
  NotebookPen,
  PhoneCall,
} from 'lucide-react';
import { useCallList } from '~/features/leads';
import {
  applicationViews,
  callListViews,
  leadChannels,
  type CallListItem,
  type CallListView,
} from '~/lib/schema';
import { labelOf } from '~/data/taxonomy';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { cn } from '~/lib/utils';
import { AppDialog } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';
import { Button } from '~/components/ui/button';
import { MatchScore } from '~/features/opportunities';
import {
  CallButton,
  EmailButton,
  OutcomeBadge,
  WhatsAppButton,
} from '~/components/opportunity/lead-actions';
import { LogActivityForm } from '~/components/opportunity/lead-activity';

export function meta() {
  return generateSEOTags({
    title: 'Call list | Leadline',
    description: 'Approved client leads to call, message or email, in order.',
    url: '/app',
    noIndex: true,
  });
}

const EMPTY: Record<CallListView, string> = {
  to_contact:
    'Approve client leads in Opportunities and they appear here, best first, with what to say.',
  follow_up: 'Leads you reached out to, and haven’t closed, wait here.',
  closed: 'Leads that weren’t interested or had the wrong contact end up here.',
  all: 'Approve client leads in Opportunities to start your call list.',
};

const EMPTY_APPLICATIONS: Record<CallListView, string> = {
  to_contact:
    'Approve jobs in Jobs and they appear here, best first, with a cover letter and CV for each.',
  follow_up:
    'Jobs you applied for, and haven’t heard a final answer on, wait here.',
  closed: 'Jobs you weren’t selected for, or withdrew from, end up here.',
  all: 'Approve jobs in Jobs to start tracking your applications.',
};

/** yyyy-mm-dd of today, in the browser's time zone. */
const todayIso = () => {
  const now = new Date();
  const offset = now.getTimezoneOffset() * 60_000;
  return new Date(now.getTime() - offset).toISOString().slice(0, 10);
};

function FollowUp({ date }: Readonly<{ date: string }>) {
  const today = todayIso();
  const due = date <= today;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 text-xs',
        due
          ? 'font-medium text-rose-600 dark:text-rose-400'
          : 'text-muted-foreground'
      )}
    >
      <CalendarClock className="h-3.5 w-3.5" />
      {date === today
        ? 'Follow up today'
        : due
          ? `Follow-up overdue (${formatDate(date)})`
          : `Follow up ${formatDate(date)}`}
    </span>
  );
}

function LeadRow({
  item,
  canLog,
  onLog,
}: Readonly<{ item: CallListItem; canLog: boolean; onLog: () => void }>) {
  const path = useOrgPath();
  const pitch = item.pitch?.status === 'ready' ? item.pitch : null;
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={path(`/opportunities/${item.id}`)}
            className="font-medium hover:underline"
          >
            {item.title}
          </Link>
          <p className="text-xs text-muted-foreground capitalize">
            {[item.category.replaceAll('_', ' '), item.location]
              .filter(Boolean)
              .join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.followUpOn && <FollowUp date={item.followUpOn} />}
          {item.lastOutcome ? (
            <OutcomeBadge outcome={item.lastOutcome} />
          ) : (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Not contacted
            </span>
          )}
          <MatchScore score={item.matchScore} />
        </div>
      </div>

      {item.evidence.length > 0 && (
        <ul className="mt-3 space-y-1 text-sm">
          {item.evidence.map((detail) => (
            <li key={detail} className="flex gap-2">
              <span
                className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-rose-500"
                aria-hidden
              />
              {detail}
            </li>
          ))}
        </ul>
      )}

      {item.lastContactedAt && (
        <p className="mt-3 text-xs text-muted-foreground">
          Last: {item.lastChannel && labelOf(leadChannels, item.lastChannel)}{' '}
          {timeAgo(item.lastContactedAt)}
          {item.lastNote && ` · “${item.lastNote}”`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <CallButton phone={item.phone} />
        <WhatsAppButton
          number={item.whatsappNumber}
          message={pitch?.whatsapp}
        />
        <EmailButton
          email={item.email}
          subject={pitch?.emailSubject}
          body={pitch?.emailBody}
        />
        {canLog && (
          <Button size="sm" variant="outline" onClick={onLog}>
            <NotebookPen className="h-4 w-4" /> Log
          </Button>
        )}
        {item.pitch?.status === 'writing' && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing the pitch…
          </span>
        )}
        {!item.phone && !item.whatsappNumber && !item.email && (
          <span className="text-xs text-muted-foreground">
            No phone or email found;{' '}
            {item.website ? (
              <a
                href={item.website}
                target="_blank"
                rel="noopener noreferrer"
                className="text-primary hover:underline"
              >
                try their website
              </a>
            ) : (
              'try a visit'
            )}
            .
          </span>
        )}
      </div>
    </li>
  );
}

function JobRow({
  item,
  canLog,
  onLog,
}: Readonly<{ item: CallListItem; canLog: boolean; onLog: () => void }>) {
  const path = useOrgPath();
  return (
    <li className="rounded-xl border border-border p-4">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="min-w-0">
          <Link
            to={path(`/opportunities/${item.id}`)}
            className="font-medium hover:underline"
          >
            {item.title}
          </Link>
          <p className="text-xs text-muted-foreground">
            {[item.funder, item.location].filter(Boolean).join(' · ')}
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {item.followUpOn && <FollowUp date={item.followUpOn} />}
          {item.lastOutcome ? (
            <OutcomeBadge outcome={item.lastOutcome} />
          ) : (
            <span className="rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
              Not applied
            </span>
          )}
          <MatchScore score={item.matchScore} />
        </div>
      </div>

      {(item.deadline || item.lastContactedAt) && (
        <p className="mt-3 text-xs text-muted-foreground">
          {item.deadline && `Apply by ${formatDate(item.deadline)}`}
          {item.deadline && item.lastContactedAt && ' · '}
          {item.lastContactedAt &&
            `Last: ${labelOf(leadChannels, item.lastChannel ?? 'other')} ${timeAgo(item.lastContactedAt)}`}
          {item.lastNote && ` · “${item.lastNote}”`}
        </p>
      )}

      <div className="mt-3 flex flex-wrap items-center gap-2">
        <Button asChild size="sm" variant="outline">
          <Link to={path(`/opportunities/${item.id}`)}>
            Cover letter and CV
          </Link>
        </Button>
        {item.applyUrl && (
          <Button asChild size="sm" variant="outline">
            <a href={item.applyUrl} target="_blank" rel="noopener noreferrer">
              Apply <ExternalLink className="h-4 w-4" />
            </a>
          </Button>
        )}
        {canLog && (
          <Button size="sm" variant="outline" onClick={onLog}>
            <NotebookPen className="h-4 w-4" /> Log a step
          </Button>
        )}
        {item.application?.status === 'writing' && (
          <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
            <Loader2 className="h-3.5 w-3.5 animate-spin" /> Writing your letter
            and CV…
          </span>
        )}
      </div>
    </li>
  );
}

export default function CallListPage() {
  const { org, can, view: orgView } = useOrg();
  const isCandidate = orgView.isCandidate;
  const views = isCandidate ? applicationViews : callListViews;
  const [searchParams, setSearchParams] = useSearchParams();
  const view =
    views.find((v) => v.value === searchParams.get('view'))?.value ??
    'to_contact';
  const { data, isPending } = useCallList(org.id, view);
  const items = data?.items ?? [];
  const [logging, setLogging] = useState<CallListItem | null>(null);
  const canLog = can('opportunities.triage');

  const setView = (next: CallListView) => {
    const params = new URLSearchParams(searchParams);
    if (next === 'to_contact') params.delete('view');
    else params.set('view', next);
    setSearchParams(params, { replace: true });
  };

  return (
    <Page>
      <PageHeader
        title={isCandidate ? 'Applications' : 'Call list'}
        description={
          isCandidate
            ? 'Jobs you approved, in the order to act on them. You apply on their site; log each step here, with a date to follow up.'
            : 'Approved client leads, in the order to reach them. Calls and messages go from your own phone; log what happened after each.'
        }
      />

      <div
        role="tablist"
        className="mb-4 flex gap-1 overflow-x-auto rounded-full bg-muted p-0.5 sm:w-fit"
      >
        {views.map((option) => (
          <button
            key={option.value}
            type="button"
            role="tab"
            aria-selected={option.value === view}
            onClick={() => setView(option.value)}
            className={cn(
              'flex-1 whitespace-nowrap rounded-full px-4 py-1.5 text-sm transition-colors sm:flex-none',
              option.value === view
                ? 'bg-background font-medium shadow-xs'
                : 'text-muted-foreground hover:text-foreground'
            )}
          >
            {option.label}
          </button>
        ))}
      </div>

      {isPending ? (
        <PageLoader className="min-h-[20vh]" />
      ) : items.length === 0 ? (
        <EmptyState
          icon={isCandidate ? ClipboardList : PhoneCall}
          title="Nothing here yet"
          description={(isCandidate ? EMPTY_APPLICATIONS : EMPTY)[view]}
        />
      ) : (
        <>
          <p className="mb-3 text-sm text-muted-foreground">
            {(() => {
              const noun = isCandidate ? 'job' : 'lead';
              const total = data?.total ?? 0;
              return total === 1 ? `1 ${noun}` : `${total} ${noun}s`;
            })()}
          </p>
          <ul className="space-y-3">
            {items.map((item) => {
              const Row = isCandidate ? JobRow : LeadRow;
              return (
                <Row
                  key={item.id}
                  item={item}
                  canLog={canLog}
                  onLog={() => setLogging(item)}
                />
              );
            })}
          </ul>
        </>
      )}

      <AppDialog
        open={!!logging}
        onOpenChange={(open) => !open && setLogging(null)}
        title={logging ? `Log: ${logging.title}` : 'Log'}
        description={
          isCandidate
            ? 'Where your application stands.'
            : 'How you reached them and what happened.'
        }
      >
        {logging && (
          <LogActivityForm
            orgId={org.id}
            oppId={logging.id}
            isJob={isCandidate}
            onLogged={() => setLogging(null)}
          />
        )}
      </AppDialog>
    </Page>
  );
}
