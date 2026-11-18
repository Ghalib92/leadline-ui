import { useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  Circle,
  ExternalLink,
  Loader2,
  Minus,
  Play,
  X,
} from 'lucide-react';
import {
  DecisionBadge,
  RunNextStep,
  RunSettingsUsed,
  RunStatusBadge,
  formatDuration,
  useRun,
} from '~/features/runs';
import { MatchScore, TypeBadge } from '~/features/opportunities';
import { useAgents, useRunAgent } from '~/features/agents';
import {
  isRunActive,
  toFeedType,
  type RunCandidate,
  type RunStep,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { cn } from '~/lib/utils';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { RunDialog } from '~/components/org/run-dialog';
import { Page, PageLoader } from '~/components/dashboard/page';
import { PageHeader } from '~/components/dashboard/page-header';

export function meta() {
  return generateSEOTags({
    title: 'Search | Leadline',
    description:
      'What the AI agents did in a search, what went wrong and what they found.',
    url: '/app',
    noIndex: true,
  });
}

function StepIcon({ state }: Readonly<{ state: RunStep['status'] }>) {
  const base =
    'relative z-10 flex h-7 w-7 shrink-0 items-center justify-center rounded-full border bg-background';
  switch (state) {
    case 'running':
      return (
        <span className={cn(base, 'border-primary text-primary')}>
          <Loader2 className="h-4 w-4 animate-spin" />
        </span>
      );
    case 'done':
      return (
        <span
          className={cn(base, 'border-emerald-500 bg-emerald-500 text-white')}
        >
          <Check className="h-4 w-4" />
        </span>
      );
    case 'warning':
      return (
        <span className={cn(base, 'border-amber-500 bg-amber-500 text-white')}>
          <AlertTriangle className="h-3.5 w-3.5" />
        </span>
      );
    case 'failed':
      return (
        <span
          className={cn(base, 'border-destructive bg-destructive text-white')}
        >
          <X className="h-4 w-4" />
        </span>
      );
    case 'skipped':
      return (
        <span className={cn(base, 'text-muted-foreground')}>
          <Minus className="h-4 w-4" />
        </span>
      );
    default:
      return (
        <span className={cn(base, 'text-muted-foreground/50')}>
          <Circle className="h-3 w-3" />
        </span>
      );
  }
}

function Stat({
  label,
  value,
}: Readonly<{ label: string; value: string | number }>) {
  return (
    <div className="rounded-lg border border-border px-4 py-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="mt-0.5 text-lg font-semibold tabular-nums">{value}</p>
    </div>
  );
}

type MatchFilter = 'all' | 'added' | 'skipped';

function CandidateRow({ candidate }: Readonly<{ candidate: RunCandidate }>) {
  const path = useOrgPath();
  return (
    <li className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <TypeBadge type={candidate.type} />
          {candidate.opportunityId ? (
            <Link
              to={path(`/opportunities/${candidate.opportunityId}`)}
              className="truncate text-sm font-medium hover:underline text-primary"
            >
              {candidate.title}
            </Link>
          ) : (
            <span className="truncate text-sm font-medium">
              {candidate.title}
            </span>
          )}
          {candidate.sourceUrl && (
            <a
              href={candidate.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="shrink-0 text-muted-foreground hover:text-foreground"
              aria-label="Open source link"
              title="Open source link"
            >
              <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {candidate.funder} · {candidate.sourceName}
        </p>
        {candidate.matchReasons.length > 0 && (
          <ul className="mt-1.5 flex flex-wrap gap-1">
            {candidate.matchReasons.map((reason) => (
              <li
                key={reason}
                className="rounded-full bg-muted px-2 py-0.5 text-[11px]"
              >
                {reason}
              </li>
            ))}
          </ul>
        )}
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <MatchScore score={candidate.matchScore} />
        <DecisionBadge decision={candidate.decision} />
      </div>
    </li>
  );
}

export default function RunDetailPage() {
  const { id = '' } = useParams();
  const navigate = useNavigate();
  const { org, can } = useOrg();
  const path = useOrgPath();
  const { data: run, isPending } = useRun(org.id, id);
  const { data: agents = [] } = useAgents(org.id);
  const rerun = useRunAgent(org.id);
  // Which slice of candidates to list — view state only.
  const [matchFilter, setMatchFilter] = useState<MatchFilter>('all');
  const [searchDialog, setSearchDialog] = useState(false);

  const candidates = useMemo(() => {
    const rows = [...(run?.candidates ?? [])].sort(
      (a, b) => b.matchScore - a.matchScore
    );
    if (matchFilter === 'added')
      return rows.filter((c) => c.decision === 'added');
    if (matchFilter === 'skipped')
      return rows.filter((c) => c.decision !== 'added');
    return rows;
  }, [run, matchFilter]);

  if (isPending) {
    return <PageLoader className="min-h-[60vh]" />;
  }

  if (!run) {
    return (
      <div className="p-6">
        <p className="text-lg font-medium">Run not found</p>
        <Button asChild variant="outline" className="mt-4">
          <Link to={path('/runs')}>Back to search history</Link>
        </Button>
      </div>
    );
  }

  // Runs of a saved search can be repeated as they were; "Search for
  // opportunities" runs (no saved search) reopen the search dialog.
  const agent = agents.find((a) => a.id === run.agentId);
  const isOrgSearch = !run.agentId;
  const running = isRunActive(run.status);
  const settled = (step: RunStep) =>
    step.status !== 'pending' && step.status !== 'running';
  const completedSteps = run.steps.filter(settled).length;
  const activeStep = run.steps.find((step) => step.status === 'running');
  const canRerun = agent
    ? (agent.canManage ?? can('agents.manage', { ownerId: agent.ownerId }))
    : false;
  const matchReached = run.steps.some(
    (step) => step.key === 'match' && settled(step)
  );
  const warnings = run.steps.reduce(
    (sum, s) => sum + s.events.filter((e) => e.level !== 'info').length,
    0
  );
  const progress = Math.round(
    (completedSteps / Math.max(run.steps.length, 1)) * 100
  );

  const onRerun = () =>
    rerun.mutate(
      { agentId: run.agentId },
      {
        onSuccess: ({ run: next }) => navigate(path(`/runs/${next.id}`)),
        onError: (error) => toastUtils.error('Run failed', extractError(error)),
      }
    );

  return (
    <Page>
      <PageHeader
        back={{ to: path('/runs'), label: 'Search history' }}
        title={run.agentName}
        meta={
          <>
            <RunStatusBadge status={running ? 'running' : run.status} />
            <span>
              {isOrgSearch ? 'Search' : 'Worker'},{' '}
              {run.trigger === 'manual' ? 'run by hand' : 'on its schedule'}
            </span>
            <span aria-hidden>·</span>
            <span title={formatDate(run.startedAt)}>
              Started {timeAgo(run.startedAt)}
            </span>
            <span aria-hidden>·</span>
            <span>
              {running ? 'Running for' : 'Took'}{' '}
              {formatDuration(run.durationMs)}
            </span>
          </>
        }
        actions={
          <>
            {agent && (
              <Button asChild variant="outline">
                <Link to={path(`/agents/${agent.id}`)}>Open worker</Link>
              </Button>
            )}
            {isOrgSearch && (
              <Button onClick={() => setSearchDialog(true)} disabled={running}>
                <Play className="h-4 w-4" />
                Search again
              </Button>
            )}
            {agent && canRerun && (
              <Button
                onClick={onRerun}
                disabled={running || rerun.isPending || !agent.enabled}
              >
                {rerun.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run again
              </Button>
            )}
          </>
        }
      />

      {running && (
        <div className="mb-6" aria-live="polite">
          <div className="mb-1.5 flex justify-between text-xs text-muted-foreground">
            <span>
              Step {Math.min(completedSteps + 1, run.steps.length)} of{' '}
              {run.steps.length}
              {activeStep && ` · ${activeStep.label}`}
            </span>
            <span>{progress}%</span>
          </div>
          <div className="h-1.5 overflow-hidden rounded-full bg-muted">
            <div
              className="h-full rounded-full bg-primary transition-[width] duration-300"
              style={{ width: `${Math.max(progress, 4)}%` }}
            />
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="Sources scanned" value={run.sourcesScanned} />
        <Stat label="Pages read" value={run.pagesRead} />
        <Stat label="Warnings" value={warnings} />
        {run.found > 0 ? (
          <div className="rounded-lg border border-border px-4 py-3">
            <p className="text-xs text-muted-foreground">New opportunities</p>
            <div className="mt-0.5 flex items-baseline justify-between">
              <span className="text-lg font-semibold tabular-nums text-foreground">
                {run.found}
              </span>
              <Link
                to={path(`/opportunities?run=${run.id}`)}
                className="inline-flex items-center gap-0.5 text-xs font-medium text-primary hover:underline"
              >
                View in feed <ArrowRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        ) : (
          <Stat label="New opportunities" value={run.found} />
        )}
      </div>

      <div className="mt-6">
        <RunSettingsUsed run={run} />
      </div>

      {!running && run.status !== 'failed' && (
        <RunNextStep
          run={run}
          onSearchAgain={
            isOrgSearch
              ? () => setSearchDialog(true)
              : agent && canRerun && agent.enabled
                ? onRerun
                : undefined
          }
          searching={rerun.isPending}
        />
      )}

      {!running && run.status === 'failed' && run.error && (
        <Alert variant="destructive" className="mt-6">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>{run.error}</AlertDescription>
        </Alert>
      )}
      {!running && run.status === 'partial' && run.error && (
        <Alert className="mt-6 border-amber-500/40 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>
            Stopped early: {run.error} Everything found before that was saved.
          </AlertDescription>
        </Alert>
      )}

      <div className="mt-6 grid gap-6 lg:grid-cols-5">
        <section
          aria-labelledby="workflow-heading"
          className="rounded-xl border border-border p-5 lg:col-span-2"
        >
          <h2 id="workflow-heading" className="font-semibold">
            Workflow
          </h2>
          <ol className="mt-4">
            {run.steps.map((step, index) => (
              <li key={step.key} className="relative flex gap-3 pb-6 last:pb-0">
                {index < run.steps.length - 1 && (
                  <span
                    aria-hidden="true"
                    className="absolute left-3.5 top-7 h-full w-px bg-border"
                  />
                )}
                <StepIcon state={step.status} />
                <div className="min-w-0 flex-1 pt-0.5">
                  <div className="flex items-baseline justify-between gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium',
                        step.status === 'pending' && 'text-muted-foreground',
                        step.status === 'skipped' &&
                          'text-muted-foreground line-through'
                      )}
                    >
                      {step.label}
                    </p>
                    {settled(step) && (
                      <span className="shrink-0 text-xs tabular-nums text-muted-foreground">
                        {step.status === 'skipped'
                          ? 'skipped'
                          : formatDuration(step.durationMs)}
                      </span>
                    )}
                  </div>
                  {step.events.length > 0 && (
                    <ul className="mt-2 space-y-1.5">
                      {step.events.map((event, i) => (
                        <li
                          key={`${event.at}-${i}`}
                          className={cn(
                            'rounded-md px-2 py-1 text-xs',
                            event.level === 'info' &&
                              'bg-muted/60 text-muted-foreground',
                            event.level === 'warning' &&
                              'bg-amber-500/10 text-amber-800 dark:text-amber-300',
                            event.level === 'error' &&
                              'bg-destructive/10 text-destructive'
                          )}
                        >
                          {event.source && (
                            <span className="mr-1.5 rounded bg-background px-1.5 py-px text-[10px] font-medium text-foreground/80">
                              {event.source}
                            </span>
                          )}
                          {event.message}
                          {event.url && (
                            <a
                              href={event.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="ml-1 inline-flex items-center align-middle text-primary hover:underline"
                              aria-label="Open the page"
                            >
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          )}
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </li>
            ))}
          </ol>
        </section>

        <section
          aria-labelledby="matching-heading"
          className="rounded-xl border border-border p-5 lg:col-span-3"
        >
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 id="matching-heading" className="font-semibold">
              Matching
            </h2>
            <div className="flex flex-wrap items-center gap-2">
              {run.found > 0 && (
                <Button
                  asChild
                  variant="outline"
                  size="sm"
                  className="h-7 gap-1 text-xs"
                >
                  <Link to={path(`/opportunities?run=${run.id}`)}>
                    View added in feed ({run.found})
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </Button>
              )}
              {matchReached && run.candidates.length > 0 && (
                <div
                  role="tablist"
                  className="flex gap-1 rounded-full bg-muted p-0.5"
                >
                  {(['all', 'added', 'skipped'] as const).map((value) => {
                    const count =
                      value === 'all'
                        ? run.candidates.length
                        : value === 'added'
                          ? run.found
                          : run.candidates.length - run.found;
                    return (
                      <button
                        key={value}
                        type="button"
                        role="tab"
                        aria-selected={matchFilter === value}
                        onClick={() => setMatchFilter(value)}
                        className={cn(
                          'rounded-full px-3 py-1 text-xs capitalize transition-colors',
                          matchFilter === value
                            ? 'bg-background font-medium shadow-xs'
                            : 'text-muted-foreground hover:text-foreground'
                        )}
                      >
                        {value} · {count}
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">
            Every page the agent read, scored against your profile. Only matches
            at or above {run.outcome?.matchThreshold ?? 55}% are added.
          </p>

          {!matchReached ? (
            <div className="mt-6 space-y-3" aria-hidden="true">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className="h-14 animate-pulse rounded-lg bg-muted/60"
                />
              ))}
              <p className="text-center text-xs text-muted-foreground">
                {run.status === 'failed' && !running
                  ? 'Nothing to score — no source responded.'
                  : run.status === 'queued'
                    ? 'Waiting for a worker to pick up the search…'
                    : 'Waiting for pages to be scored…'}
              </p>
            </div>
          ) : candidates.length === 0 ? (
            run.opportunities && run.opportunities.length > 0 ? (
              <ul className="mt-2 divide-y divide-border">
                {run.opportunities.map((opp) => (
                  <li
                    key={opp.id}
                    className="flex flex-col gap-2 py-3 sm:flex-row sm:items-start"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <TypeBadge type={toFeedType(opp.opportunityType)} />
                        <Link
                          to={path(`/opportunities/${opp.id}`)}
                          className="truncate text-sm font-medium text-primary hover:underline"
                        >
                          {opp.title}
                        </Link>
                        {opp.sourceUrl && (
                          <a
                            href={opp.sourceUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 text-muted-foreground hover:text-foreground"
                            aria-label="Open source link"
                            title="Open source link"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                      </div>
                      {opp.funder && (
                        <p className="mt-0.5 truncate text-xs text-muted-foreground">
                          {opp.funder}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2">
                      <MatchScore score={opp.matchScore} />
                      <DecisionBadge decision="added" />
                    </div>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="mt-6 rounded-lg border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                {run.candidates.length === 0
                  ? 'Nothing to score — no source responded.'
                  : 'Nothing in this view.'}
              </p>
            )
          ) : (
            <ul className="mt-2 divide-y divide-border">
              {candidates.map((candidate) => (
                <CandidateRow key={candidate.title} candidate={candidate} />
              ))}
            </ul>
          )}
        </section>
      </div>

      {!running && run.usage && Object.keys(run.usage).length > 0 && (
        <section
          aria-labelledby="about-run-heading"
          className="mt-6 rounded-xl border border-border p-5"
        >
          <h2 id="about-run-heading" className="font-semibold">
            About this run
          </h2>
          <dl className="mt-3 grid gap-4 text-sm sm:grid-cols-3">
            <div>
              <dt className="text-xs text-muted-foreground">Used</dt>
              <dd className="mt-0.5 tabular-nums">
                {run.usage.searches ?? 0} searches · {run.usage.pages ?? 0}{' '}
                pages · {(run.usage.tokens ?? 0).toLocaleString()} tokens
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Models</dt>
              <dd className="mt-0.5">
                {[...new Set(Object.values(run.modelsUsed ?? {}))].join(', ') ||
                  '—'}
              </dd>
            </div>
            <div>
              <dt className="text-xs text-muted-foreground">Prompts</dt>
              <dd className="mt-0.5 break-words">
                {Object.values(run.promptVersions ?? {}).join(', ') || '—'}
              </dd>
            </div>
          </dl>
        </section>
      )}
      <RunDialog open={searchDialog} onClose={() => setSearchDialog(false)} />
    </Page>
  );
}
