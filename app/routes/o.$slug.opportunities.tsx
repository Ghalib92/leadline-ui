import { useCallback, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router';
import {
  Activity,
  ArrowUpDown,
  Bot,
  CircleDot,
  Inbox,
  Search,
  Star,
  Tag,
  X,
} from 'lucide-react';
import {
  useOpportunities,
  useOpportunityColumns,
  useUpdateOpportunity,
} from '~/features/opportunities';
import { useAgents } from '~/features/agents';
import { useRuns } from '~/features/runs';
import { useTableFilters } from '~/store/filters/use-table-filters';
import { OPPORTUNITY_TYPES } from '~/data/taxonomy';
import {
  OPPORTUNITY_STATUSES,
  type Opportunity,
  type UpdateOpportunityInput,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { generateSEOTags } from '~/lib/utils/seo';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { cn } from '~/lib/utils';
import { DataTable } from '~/components/data-table';
import { Input } from '~/components/ui/input';
import { Button } from '~/components/ui/button';
import { PageHeader } from '~/components/dashboard/page-header';
import { FilterPill } from '~/components/dashboard/filter-pill';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Opportunities | Leadline',
    description: 'Grants, tenders, partnerships and events your workers found.',
    url: '/app',
    noIndex: true,
  });
}

const DEFAULT_SORT = 'matchScore:desc';
const SORTS = [
  { value: 'matchScore:desc', label: 'Best match' },
  { value: 'foundAt:desc', label: 'Newest first' },
  { value: 'deadline:asc', label: 'Deadline soonest' },
];

export default function OpportunitiesPage() {
  const { org, can, view } = useOrg();
  const path = useOrgPath();
  const [searchParams, setSearchParams] = useSearchParams();
  const runParam = searchParams.get('run');
  // Keyed per org so filters don't leak between workspaces.
  const filters = useTableFilters(`opportunities:${org.id}`);
  const queryParams = useMemo(() => {
    return runParam ? { ...filters.params, run: runParam } : filters.params;
  }, [filters.params, runParam]);
  const { data, isPending, isFetching } = useOpportunities(org.id, queryParams);
  const { data: agents = [] } = useAgents(org.id);
  const { data: runsData } = useRuns(org.id, { limit: 50 });
  const activeRun = runsData?.data.find((r) => r.id === runParam);
  const { mutate: update } = useUpdateOpportunity(org.id);

  const onUpdate = useCallback(
    (opp: Opportunity, input: UpdateOpportunityInput) =>
      update(
        { id: opp.id, input },
        {
          onError: (error) =>
            toastUtils.error('Update failed', extractError(error)),
        }
      ),
    [update]
  );
  const columns = useOpportunityColumns({
    onUpdate,
    canTriage: can('opportunities.triage'),
  });

  // Links from emails (the weekly digest) open the list on "To review": ?review=1.
  const reviewParam = searchParams.get('review');
  useEffect(() => {
    if (!reviewParam) return;
    filters.setFilter('review', 'pending');
    const next = new URLSearchParams(searchParams);
    next.delete('review');
    setSearchParams(next, { replace: true });
  }, [reviewParam, filters, searchParams, setSearchParams]);

  const clearRunFilter = useCallback(() => {
    const next = new URLSearchParams(searchParams);
    next.delete('run');
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams]);

  const clearAllFilters = useCallback(() => {
    filters.reset();
    if (runParam) {
      clearRunFilter();
    }
  }, [filters, runParam, clearRunFilter]);

  const filter = (key: string) =>
    (filters.state.filters[key] as string | undefined) ?? null;
  const setOrClear = (key: string, value: string | null) =>
    value ? filters.setFilter(key, value) : filters.removeFilter(key);
  const sort = filters.state.sort[0];
  // Best match first: a run finds everything at once, so "newest" orders nothing.
  const sortValue = sort ? `${sort.field}:${sort.direction}` : DEFAULT_SORT;
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;
  const hasFilters =
    !!filters.state.search ||
    Object.keys(filters.state.filters).length > 0 ||
    !!runParam;

  return (
    <Page width="wide">
      <PageHeader
        title={view.isCandidate ? 'Jobs' : 'Opportunities'}
        description={
          runParam
            ? activeRun
              ? `${data?.total ?? 0} found in run on ${formatDate(activeRun.startedAt)} (${timeAgo(activeRun.startedAt)}) by ${activeRun.agentName}`
              : data
                ? `${data.total} found in run ${runParam}`
                : `Filtered by run ${runParam}`
            : data
              ? `${data.total} found by your workers`
              : 'Found by your workers'
        }
        actions={
          <Button asChild variant="outline">
            <Link to={path('/agents')}>Workers</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative w-full sm:w-56">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={filters.state.search}
            onChange={(e) => filters.setSearch(e.target.value)}
            placeholder="Search…"
            className="h-8 pl-8 text-xs"
            aria-label="Search opportunities"
          />
        </div>
        <FilterPill
          label="Type"
          icon={Tag}
          options={OPPORTUNITY_TYPES}
          value={filter('type')}
          onChange={(v) => setOrClear('type', v)}
        />
        <FilterPill
          label="Status"
          icon={CircleDot}
          options={OPPORTUNITY_STATUSES}
          value={filter('status')}
          onChange={(v) => setOrClear('status', v)}
        />
        <FilterPill
          label="Worker"
          icon={Bot}
          options={agents.map((a) => ({ value: a.id, label: a.name }))}
          value={filter('agentId')}
          onChange={(v) => setOrClear('agentId', v)}
        />
        <FilterPill
          label="Run"
          icon={Activity}
          options={(runsData?.data ?? []).map((r) => ({
            value: r.id,
            label: `${r.agentName} · ${formatDate(r.startedAt)} (${timeAgo(r.startedAt)})`,
          }))}
          value={runParam}
          onChange={(v) => {
            const next = new URLSearchParams(searchParams);
            if (v) next.set('run', v);
            else next.delete('run');
            setSearchParams(next, { replace: true });
          }}
        />
        <button
          type="button"
          aria-pressed={!!filter('saved')}
          onClick={() => setOrClear('saved', filter('saved') ? null : 'true')}
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
            filter('saved')
              ? 'border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-400'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}
        >
          <Star
            className={cn('h-3.5 w-3.5', filter('saved') && 'fill-amber-400')}
          />
          Saved
        </button>
        <button
          type="button"
          aria-pressed={filter('review') === 'pending'}
          onClick={() =>
            setOrClear('review', filter('review') ? null : 'pending')
          }
          className={cn(
            'inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border px-3 text-xs font-medium transition-colors',
            filter('review')
              ? 'border-sky-500/30 bg-sky-500/10 text-sky-700 dark:text-sky-300'
              : 'border-border text-muted-foreground hover:bg-muted'
          )}
        >
          <Inbox className="h-3.5 w-3.5" />
          To review
        </button>
        {runParam && (
          <div className="inline-flex h-8 shrink-0 items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3 text-xs font-medium text-primary">
            <span>
              Run:{' '}
              {activeRun
                ? `${activeRun.agentName} (${formatDate(activeRun.startedAt)})`
                : runParam}
            </span>
            <button
              type="button"
              onClick={clearRunFilter}
              aria-label="Remove run filter"
              className="rounded-full p-0.5 hover:bg-primary/20 transition-colors"
            >
              <X className="h-3 w-3" />
            </button>
          </div>
        )}
        {hasFilters && (
          <button
            type="button"
            onClick={clearAllFilters}
            className="px-1 text-xs text-muted-foreground hover:text-foreground"
          >
            Clear
          </button>
        )}
        <div className="ml-auto">
          <FilterPill
            label="Sort"
            icon={ArrowUpDown}
            options={SORTS}
            value={sortValue}
            clearable={false}
            onChange={(v) => {
              const [field, direction] = (v ?? DEFAULT_SORT).split(':');
              filters.setSort([
                { field, direction: direction as 'asc' | 'desc' },
              ]);
            }}
          />
        </div>
      </div>

      {isPending ? (
        <PageLoader />
      ) : data && data.data.length > 0 ? (
        <div className={cn(isFetching && 'opacity-70 transition-opacity')}>
          <DataTable columns={columns} data={data.data} />
          <div className="mt-4 flex items-center justify-between text-sm text-muted-foreground">
            <span>
              Page {data.page} of {totalPages}
            </span>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                disabled={data.page <= 1}
                onClick={() => filters.setPage(data.page - 1)}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={data.page >= totalPages}
                onClick={() => filters.setPage(data.page + 1)}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      ) : (
        <EmptyState
          title={
            hasFilters
              ? 'Nothing matches these filters'
              : 'No opportunities yet'
          }
          description={
            hasFilters
              ? 'Try clearing a filter.'
              : 'Run a worker to start finding opportunities.'
          }
          action={
            hasFilters ? (
              <Button variant="outline" size="sm" onClick={clearAllFilters}>
                Clear filters
              </Button>
            ) : (
              <Button asChild size="sm">
                <Link to={path('/agents')}>Go to workers</Link>
              </Button>
            )
          }
        />
      )}
    </Page>
  );
}
