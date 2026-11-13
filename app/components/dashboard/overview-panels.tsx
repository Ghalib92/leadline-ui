import { Link } from 'react-router';
import {
  AlertTriangle,
  CalendarClock,
  CheckCircle2,
  ChevronRight,
  ClipboardCheck,
  FileWarning,
  type LucideIcon,
} from 'lucide-react';
import type { Overview } from '~/lib/schema';
import { useAgents } from '~/features/agents';
import { RunStatusBadge } from '~/features/runs';
import { useOrgPath } from '~/lib/org/use-org-path';
import { timeAgo } from '~/lib/utils/format';
import { cn } from '~/lib/utils';
import { AppCard } from '~/components/composed';

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

type AttentionItem = Overview['attention'][number];

/** Copy, icon and destination for each kind of thing that needs someone. */
function describe(item: AttentionItem, path: (to: string) => string) {
  const n = item.count;
  const kinds: Record<
    AttentionItem['kind'],
    { icon: LucideIcon; text: string; action: string; to: string; tone: string }
  > = {
    deadline_without_proposal: {
      icon: CalendarClock,
      text: `${plural(n, 'deadline', 'deadlines')} in the next two weeks with no proposal yet`,
      action: 'View deadlines',
      to: path('/calendar'),
      tone: 'text-destructive',
    },
    to_review: {
      icon: ClipboardCheck,
      text: `${plural(n, 'opportunity', 'opportunities')} waiting for your review`,
      action: 'Review',
      to: path('/opportunities?review=pending'),
      tone: 'text-primary',
    },
    eligibility_gap: {
      icon: FileWarning,
      text: `${plural(n, 'opportunity', 'opportunities')} where the brief found an eligibility gap`,
      action: 'Open feed',
      to: path('/opportunities'),
      tone: 'text-amber-600',
    },
    failed_runs: {
      icon: AlertTriangle,
      text: `${plural(n, 'worker run', 'worker runs')} failed or had warnings this week`,
      action: 'See the latest',
      to: item.target ? path(`/runs/${item.target}`) : path('/runs'),
      tone: 'text-amber-600',
    },
  };
  return kinds[item.kind];
}

/** The day's to-do list: one row per kind, each with the one action that clears it. */
export function AttentionList({
  items,
}: Readonly<{ items: Overview['attention'] }>) {
  const path = useOrgPath();
  return (
    <AppCard title="Needs your attention">
      {items.length === 0 ? (
        <p className="flex items-center gap-2 text-sm text-muted-foreground">
          <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          You're all caught up.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {items.map((item) => {
            const d = describe(item, path);
            return (
              <li key={item.kind}>
                <Link
                  to={d.to}
                  className="group flex items-center gap-3 py-3 first:pt-0 last:pb-0"
                >
                  <d.icon className={cn('h-4 w-4 shrink-0', d.tone)} />
                  <span className="min-w-0 flex-1 text-sm">{d.text}</span>
                  <span className="inline-flex shrink-0 items-center gap-0.5 text-sm font-medium text-primary group-hover:underline">
                    {d.action}
                    <ChevronRight className="h-4 w-4" />
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </AppCard>
  );
}

const stages = [
  { key: 'new', label: 'New' },
  { key: 'reviewing', label: 'Reviewing' },
  { key: 'pursuing', label: 'Pursuing' },
  { key: 'submitted', label: 'Submitted' },
] as const;

/** Open opportunities at each stage; each opens the feed filtered to it. */
export function PipelineStrip({
  pipeline,
}: Readonly<{ pipeline: Overview['pipeline'] }>) {
  const path = useOrgPath();
  return (
    <nav
      aria-label="Pipeline"
      className="grid grid-cols-2 overflow-hidden rounded-xl border border-border sm:grid-cols-4"
    >
      {stages.map((stage, index) => (
        <Link
          key={stage.key}
          to={path(`/opportunities?status=${stage.key}`)}
          className={cn(
            'px-4 py-3 transition-colors hover:bg-muted/40',
            index > 0 && 'border-border sm:border-l',
            index % 2 === 1 && 'border-l',
            index > 1 && 'border-t sm:border-t-0'
          )}
        >
          <p className="text-xs text-muted-foreground">{stage.label}</p>
          <p className="mt-0.5 text-2xl font-semibold tabular-nums">
            {pipeline[stage.key]}
          </p>
        </Link>
      ))}
    </nav>
  );
}

/** Your automations with their last run; Open goes to each one's page. */
export function AutomationsPanel({ orgId }: Readonly<{ orgId: string }>) {
  const path = useOrgPath();
  const { data: agents = [] } = useAgents(orgId);
  const shown = agents.slice(0, 5);
  return (
    <AppCard
      title="Workers"
      actions={
        <Link
          to={path('/agents')}
          className="text-sm text-primary hover:underline"
        >
          View all
        </Link>
      }
    >
      {shown.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No workers yet.{' '}
          <Link
            to={path('/agents?new=1')}
            className="font-medium text-primary hover:underline"
          >
            Create one
          </Link>{' '}
          to search on a schedule.
        </p>
      ) : (
        <ul className="divide-y divide-border">
          {shown.map((agent) => (
            <li key={agent.id}>
              <Link
                to={path(`/agents/${agent.id}`)}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <span
                  className={cn(
                    'h-2 w-2 shrink-0 rounded-full',
                    agent.enabled ? 'bg-emerald-500' : 'bg-muted-foreground/40'
                  )}
                  aria-label={agent.enabled ? 'On' : 'Off'}
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium hover:underline">
                    {agent.name}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {agent.lastRunAt
                      ? `Last run ${timeAgo(agent.lastRunAt)}, ${agent.lastRunFound ?? 0} found`
                      : 'Never run'}
                  </span>
                </span>
                {agent.lastRunStatus && (
                  <RunStatusBadge status={agent.lastRunStatus} />
                )}
              </Link>
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}
