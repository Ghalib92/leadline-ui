import { useState } from 'react';
import { Link } from 'react-router';
import { ChevronRight, Play } from 'lucide-react';
import { Button } from '~/components/ui/button';
import { InsightsPanel } from '~/components/dashboard/insights-panel';
import { useOrgOverview } from '~/features/orgs';
import { DeadlineBadge, MatchScore, TypeBadge } from '~/features/opportunities';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import type { Opportunity } from '~/lib/schema';
import { AppCard } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { SetupChecklist } from '~/components/org/setup-checklist';
import { RunAutomationDialog } from '~/components/org/run-automation-dialog';
import {
  AttentionList,
  AutomationsPanel,
  PipelineStrip,
} from '~/components/dashboard/overview-panels';
import { Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Overview | Leadline',
    description: 'Your organization’s opportunity pipeline at a glance.',
    url: '/app',
    noIndex: true,
  });
}

function OpportunityRow({
  opp,
  detail,
}: Readonly<{ opp: Opportunity; detail: 'deadline' | 'found' }>) {
  const path = useOrgPath();
  return (
    <li className="flex flex-wrap items-center gap-x-3 gap-y-1 py-3">
      <div className="min-w-0 flex-1 basis-48">
        <Link
          to={path(`/opportunities/${opp.id}`)}
          className="block truncate text-sm font-medium hover:underline"
        >
          {opp.title}
        </Link>
        <p className="truncate text-xs text-muted-foreground">{opp.funder}</p>
      </div>
      <TypeBadge type={opp.type} />
      {detail === 'deadline' ? (
        <DeadlineBadge deadline={opp.deadline} />
      ) : (
        <span className="text-xs text-muted-foreground">
          {timeAgo(opp.foundAt)}
        </span>
      )}
      <MatchScore score={opp.matchScore} />
    </li>
  );
}

/** Opens "Run an automation": run one, create one, or search once. */
function RunButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <Button size="lg" onClick={() => setOpen(true)}>
        <Play className="h-4 w-4" />
        Run worker
      </Button>
      <RunAutomationDialog open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export default function OrgOverview() {
  const { org } = useOrg();
  const path = useOrgPath();
  const { data, isPending } = useOrgOverview(org.id);

  if (isPending || !data) {
    return <PageLoader className="min-h-[60vh]" />;
  }

  return (
    <Page>
      <PageHeader
        title={org.name}
        description="What needs you today, and what your workers found."
        actions={<RunButton />}
      />

      <div className="space-y-6">
        <SetupChecklist />
        <AttentionList items={data.attention} />
        <PipelineStrip pipeline={data.pipeline} />

        <div className="grid gap-6 lg:grid-cols-2">
          <AppCard title="Upcoming deadlines">
            {data.upcoming.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Nothing due in the next two weeks.
              </p>
            ) : (
              <ul className="divide-y divide-border">
                {data.upcoming.map((opp) => (
                  <OpportunityRow key={opp.id} opp={opp} detail="deadline" />
                ))}
              </ul>
            )}
          </AppCard>
          <AutomationsPanel orgId={org.id} />
        </div>

        <AppCard
          title="Latest matches"
          actions={
            <Link
              to={path('/opportunities')}
              className="text-sm text-primary hover:underline"
            >
              View all
            </Link>
          }
        >
          {data.latest.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No matches yet. Run a worker to start.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {data.latest.map((opp) => (
                <OpportunityRow key={opp.id} opp={opp} detail="found" />
              ))}
            </ul>
          )}
        </AppCard>

        <details className="group">
          <summary className="flex cursor-pointer list-none items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground [&::-webkit-details-marker]:hidden">
            <ChevronRight className="h-4 w-4 transition-transform group-open:rotate-90" />
            Insights: searches, matches and decisions over time
          </summary>
          <InsightsPanel orgId={org.id} />
        </details>
      </div>
    </Page>
  );
}
