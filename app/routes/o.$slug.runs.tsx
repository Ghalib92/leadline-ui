import { Link, useSearchParams } from 'react-router';
import { Bot, CircleDot } from 'lucide-react';
import { RunTable, useRuns } from '~/features/runs';
import { useAgents } from '~/features/agents';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { generateSEOTags } from '~/lib/utils/seo';
import { Button } from '~/components/ui/button';
import { PageHeader } from '~/components/dashboard/page-header';
import { FilterPill } from '~/components/dashboard/filter-pill';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Search history | Leadline',
    description: 'Every search with its status, warnings and results.',
    url: '/app',
    noIndex: true,
  });
}

const STATUSES = [
  { value: 'succeeded', label: 'Succeeded' },
  { value: 'partial', label: 'With warnings' },
  { value: 'failed', label: 'Failed' },
];

export default function RunsPage() {
  const { org } = useOrg();
  const path = useOrgPath();
  // Filters live in the URL so agent cards can deep-link (?agentId=…).
  const [searchParams, setSearchParams] = useSearchParams();
  const agentId = searchParams.get('agentId');
  const status = searchParams.get('status');
  const page = Number(searchParams.get('page') ?? 1) || 1;
  const { data: agents = [] } = useAgents(org.id);
  const { data, isPending } = useRuns(org.id, {
    page,
    limit: 15,
    ...(agentId ? { agentId } : {}),
    ...(status ? { status } : {}),
  });

  const setParam = (key: string, value: string | null) => {
    const next = new URLSearchParams(searchParams);
    if (value) next.set(key, value);
    else next.delete(key);
    next.delete('page');
    setSearchParams(next, { replace: true });
  };
  const totalPages = data ? Math.max(1, Math.ceil(data.total / data.limit)) : 1;

  return (
    <Page>
      <PageHeader
        title="Search history"
        description="Every search: where it looked, what went wrong, and what it found."
        actions={
          <Button asChild variant="outline">
            <Link to={path('/agents')}>Searches</Link>
          </Button>
        }
      />

      <div className="mb-4 flex flex-wrap items-center gap-2">
        <FilterPill
          label="Search"
          icon={Bot}
          options={agents.map((a) => ({ value: a.id, label: a.name }))}
          value={agentId}
          onChange={(v) => setParam('agentId', v)}
        />
        <FilterPill
          label="Status"
          icon={CircleDot}
          options={STATUSES}
          value={status}
          onChange={(v) => setParam('status', v)}
        />
      </div>

      {isPending ? (
        <PageLoader />
      ) : !data || data.data.length === 0 ? (
        <EmptyState
          title="No runs yet"
          description="Run a search to see where it looked and what it found."
          action={
            <Button asChild size="sm">
              <Link to={path('/agents')}>Go to workers</Link>
            </Button>
          }
        />
      ) : (
        <RunTable
          runs={data.data}
          page={data.page}
          totalPages={totalPages}
          total={data.total}
          onPage={(next) => {
            const params = new URLSearchParams(searchParams);
            params.set('page', String(next));
            setSearchParams(params, { replace: true });
          }}
        />
      )}
    </Page>
  );
}
