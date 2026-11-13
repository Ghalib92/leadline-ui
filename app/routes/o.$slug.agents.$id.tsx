import { Link, useNavigate, useParams, useSearchParams } from 'react-router';
import { Loader2, Play, Trash2 } from 'lucide-react';
import {
  useAgent,
  useDeleteAgent,
  useRunAgent,
  useUpdateAgent,
} from '~/features/agents';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { AppDropdown, AppTabs } from '~/components/composed';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';
import { useConfirm } from '~/components/ui/confirm-dialog';
import { AgentSettings } from '~/components/org/agent/agent-settings';
import {
  AgentHistory,
  AgentOpportunities,
  AgentOverview,
} from '~/components/org/agent/agent-tabs';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';
import { PageHeader } from '~/components/dashboard/page-header';

export function meta() {
  return generateSEOTags({
    title: 'Worker | Leadline',
    description: 'One worker: its runs, what it found and its settings.',
    url: '/app',
    noIndex: true,
  });
}

const scheduleLabel = {
  manual: 'Runs when you start it',
  daily: 'Runs every day',
  weekly: 'Runs every week',
} as const;

const tabKeys = ['overview', 'history', 'opportunities', 'settings'] as const;

/** One automation: overview, run history, what it found, and its settings (`?tab=`). */
export default function AgentPage() {
  const { id = '' } = useParams();
  const { org, can } = useOrg();
  const path = useOrgPath();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: agent, isPending, isError } = useAgent(org.id, id);
  const run = useRunAgent(org.id);
  const update = useUpdateAgent(org.id);
  const remove = useDeleteAgent(org.id);
  const { confirm, confirmDialog } = useConfirm();

  const requested = searchParams.get('tab');
  const tab = tabKeys.find((t) => t === requested) ?? 'overview';
  const setTab = (next: string) =>
    setSearchParams(next === 'overview' ? {} : { tab: next }, {
      replace: true,
    });

  if (isPending) return <PageLoader className="min-h-[50vh]" />;
  if (isError || !agent)
    return (
      <Page width="narrow">
        <EmptyState
          title="This worker doesn't exist"
          description="It may have been deleted."
          action={
            <Button asChild variant="outline">
              <Link to={path('/agents')}>Back to workers</Link>
            </Button>
          }
        />
      </Page>
    );

  const canManage =
    agent.canManage ?? can('agents.manage', { ownerId: agent.ownerId });

  const onRun = () =>
    run.mutate(
      { agentId: agent.id },
      {
        onSuccess: ({ run: started }) => navigate(path(`/runs/${started.id}`)),
        onError: (error) =>
          toastUtils.error('Could not start the run', extractError(error)),
      }
    );

  const onToggle = (enabled: boolean) =>
    update.mutate(
      { agentId: agent.id, input: { enabled } },
      {
        onError: (error) =>
          toastUtils.error('Update failed', extractError(error)),
      }
    );

  const onDelete = async () => {
    const ok = await confirm({
      title: `Delete ${agent.name}?`,
      description: 'Opportunities it already found are kept.',
      confirmLabel: 'Delete worker',
      destructive: true,
    });
    if (!ok) return;
    remove.mutate(agent.id, {
      onSuccess: () => {
        toastUtils.success('Worker deleted');
        navigate(path('/agents'));
      },
      onError: (error) =>
        toastUtils.error('Delete failed', extractError(error)),
    });
  };

  return (
    <Page>
      <PageHeader
        back={{ to: path('/agents'), label: 'Workers' }}
        title={agent.name}
        meta={
          <>
            <span className="inline-flex items-center gap-2">
              <Switch
                checked={agent.enabled}
                onCheckedChange={onToggle}
                disabled={!canManage || update.isPending}
                aria-label={agent.enabled ? 'Turn off' : 'Turn on'}
              />
              {agent.enabled ? 'On' : 'Off'}
            </span>
            <span aria-hidden>·</span>
            {scheduleLabel[agent.schedule]}
          </>
        }
        description={agent.description}
        actions={
          canManage && (
            <>
              <Button
                onClick={onRun}
                disabled={run.isPending || !agent.enabled}
              >
                {run.isPending ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Play className="h-4 w-4" />
                )}
                Run now
              </Button>
              <AppDropdown
                label="More actions"
                items={[
                  {
                    label: 'Delete worker',
                    icon: Trash2,
                    destructive: true,
                    onSelect: onDelete,
                  },
                ]}
              />
            </>
          )
        }
      />

      <AppTabs
        variant="underline"
        value={tab}
        onValueChange={setTab}
        tabs={[
          {
            value: 'overview',
            label: 'Overview',
            content: (
              <AgentOverview
                agent={agent}
                onOpenSettings={() => setTab('settings')}
              />
            ),
          },
          {
            value: 'history',
            label: 'History',
            content: <AgentHistory agent={agent} />,
          },
          {
            value: 'opportunities',
            label: 'Opportunities',
            content: <AgentOpportunities agent={agent} />,
          },
          {
            value: 'settings',
            label: 'Settings',
            content: <AgentSettings agent={agent} canManage={canManage} />,
          },
        ]}
      />
      {confirmDialog}
    </Page>
  );
}
