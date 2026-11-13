import { useState, type ReactNode } from 'react';
import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { AGENT_SOURCES, OPPORTUNITY_TYPES, labelOf } from '~/data';
import type { Agent } from '~/lib/schema';
import { RunStatusBadge, RunTable, useRuns } from '~/features/runs';
import { MatchScore, useOpportunities } from '~/features/opportunities';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { AppCard } from '~/components/composed';
import { EmptyState, PageLoader } from '~/components/dashboard/page';
import { Button } from '~/components/ui/button';
import { scopeSummary } from './agent-settings';
import { ScopeChips } from './scope-chips';

const depthLabel = { quick: 'Quick', standard: 'Standard', deep: 'Deep' };

function Tile({
  label,
  value,
  hint,
}: Readonly<{ label: string; value: ReactNode; hint?: ReactNode }>) {
  return (
    <div className="rounded-xl border border-border p-4">
      <p className="text-xs text-muted-foreground">{label}</p>
      <div className="mt-1 text-xl font-semibold tabular-nums">{value}</div>
      {hint && <p className="mt-1 text-xs text-muted-foreground">{hint}</p>}
    </div>
  );
}

/** Totals, the latest run, and what each run searches. */
export function AgentOverview({
  agent,
  onOpenSettings,
}: Readonly<{ agent: Agent; onOpenSettings: () => void }>) {
  const { org } = useOrg();
  const path = useOrgPath();
  const { data: runs } = useRuns(org.id, { agentId: agent.id, limit: 1 });
  const { data: found } = useOpportunities(org.id, {
    agentId: agent.id,
    limit: 1,
  });
  const scope = agent.effective;

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Tile label="Runs" value={runs?.total ?? '–'} />
        <Tile label="Opportunities found" value={found?.total ?? '–'} />
        <Tile
          label="Last run"
          value={agent.lastRunAt ? timeAgo(agent.lastRunAt) : 'Never'}
          hint={
            agent.lastRunStatus && (
              <RunStatusBadge status={agent.lastRunStatus} />
            )
          }
        />
        <Tile
          label="Depth"
          value={scope ? depthLabel[scope.depth.value] : '–'}
          hint={
            scope?.depth.origin === 'agent'
              ? 'Set on this worker'
              : 'Organization default'
          }
        />
      </div>

      {scope && (
        <AppCard
          title="What each run searches"
          description={`${scopeSummary(scope).text}. Grey items come from your organization; blue ones are added here.`}
          actions={
            <Button variant="outline" size="sm" onClick={onOpenSettings}>
              View settings
            </Button>
          }
        >
          <ScopeChips
            items={[
              ...scope.sources.map((s) => ({
                text: labelOf(AGENT_SOURCES, s.value),
                origin: s.origin,
              })),
              ...scope.links.map((l) => ({
                text: l.label || l.url,
                origin: l.origin,
              })),
              ...scope.opportunityTypes.map((t) => ({
                text: labelOf(OPPORTUNITY_TYPES, t.value),
                origin: t.origin,
              })),
              ...(scope.knowledgeMode === 'all'
                ? [{ text: 'All documents', origin: 'organization' as const }]
                : scope.folders
                    .filter(
                      (f) =>
                        scope.knowledgeMode === 'selected' ||
                        f.origin === 'agent'
                    )
                    .map((f) => ({ text: f.name, origin: f.origin }))),
            ]}
          />
        </AppCard>
      )}

      {agent.lastRunOpportunities && agent.lastRunOpportunities.length > 0 && (
        <AppCard
          title="Latest finds"
          actions={
            agent.lastRunId && (
              <Link
                to={path(`/opportunities?run=${agent.lastRunId}`)}
                className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
              >
                View all <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )
          }
        >
          <ul className="divide-y divide-border">
            {agent.lastRunOpportunities.map((opp) => (
              <li
                key={opp.id}
                className="flex items-center justify-between gap-3 py-2"
              >
                <Link
                  to={path(`/opportunities/${opp.id}`)}
                  className="min-w-0 truncate text-sm font-medium hover:underline"
                >
                  {opp.title}
                </Link>
                <MatchScore score={opp.matchScore} />
              </li>
            ))}
          </ul>
        </AppCard>
      )}
    </div>
  );
}

/** This automation's runs. */
export function AgentHistory({ agent }: Readonly<{ agent: Agent }>) {
  const { org } = useOrg();
  const [page, setPage] = useState(1);
  const { data, isPending } = useRuns(org.id, {
    agentId: agent.id,
    page,
    limit: 15,
  });
  if (isPending) return <PageLoader className="min-h-[20vh]" />;
  if (!data || data.data.length === 0)
    return (
      <EmptyState
        title="No runs yet"
        description="Run it now, or wait for its schedule."
      />
    );
  return (
    <RunTable
      runs={data.data}
      page={data.page}
      totalPages={Math.max(1, Math.ceil(data.total / data.limit))}
      total={data.total}
      onPage={setPage}
    />
  );
}

/** What this automation found, best match first. */
export function AgentOpportunities({ agent }: Readonly<{ agent: Agent }>) {
  const { org } = useOrg();
  const path = useOrgPath();
  const [page, setPage] = useState(1);
  const { data, isPending } = useOpportunities(org.id, {
    agentId: agent.id,
    page,
    limit: 15,
    sort: 'matchScore:desc',
  });
  if (isPending) return <PageLoader className="min-h-[20vh]" />;
  if (!data || data.data.length === 0)
    return (
      <EmptyState
        title="Nothing found yet"
        description="Opportunities this worker adds will show up here."
      />
    );
  const totalPages = Math.max(1, Math.ceil(data.total / data.limit));
  return (
    <div className="space-y-4">
      <ul className="divide-y divide-border rounded-xl border border-border">
        {data.data.map((opp) => (
          <li key={opp.id}>
            <Link
              to={path(`/opportunities/${opp.id}`)}
              className="flex flex-col gap-1 px-4 py-3 hover:bg-muted/40 sm:flex-row sm:items-center sm:justify-between"
            >
              <div className="min-w-0">
                <p className="truncate font-medium">{opp.title}</p>
                <p className="text-xs text-muted-foreground">
                  {[
                    opp.funder,
                    labelOf(OPPORTUNITY_TYPES, opp.type),
                    opp.deadline && `Due ${formatDate(opp.deadline)}`,
                    opp.foundAt && `Found ${formatDate(opp.foundAt)}`,
                  ]
                    .filter(Boolean)
                    .join(' · ')}
                </p>
              </div>
              <MatchScore score={opp.matchScore} />
            </Link>
          </li>
        ))}
      </ul>
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Page {data.page} of {totalPages} · {data.total} found
        </span>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page <= 1}
            onClick={() => setPage(page - 1)}
          >
            Previous
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage(page + 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
