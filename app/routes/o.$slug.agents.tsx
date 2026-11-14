import { useEffect, useEffectEvent } from 'react';
import { useNavigate, useSearchParams } from 'react-router';
import { Plus } from 'lucide-react';
import {
  AgentTile,
  useAgents,
  useRunAgent,
  useRunBlocked,
  useUpdateAgent,
} from '~/features/agents';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import type { Agent } from '~/lib/schema';
import { Button } from '~/components/ui/button';
import { AppTabs } from '~/components/composed';
import { PageHeader } from '~/components/dashboard/page-header';
import { AgentFormSheet } from '~/components/org/agent-form-sheet';
import { PreferencesTab } from '~/components/org/settings/profile-tabs';
import {
  ClientBriefTab,
  TenderBriefTab,
} from '~/components/org/settings/brief-tabs';
import type { Goal } from '~/lib/schema';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';

export function meta() {
  return generateSEOTags({
    title: 'Workers | Leadline',
    description:
      'AI workers that search for opportunities and the organization preferences that guide them.',
    url: '/app',
    noIndex: true,
  });
}

export default function AgentsPage() {
  const { org, view, can } = useOrg();
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();
  const path = useOrgPath();
  const { data: agents = [], isPending } = useAgents(org.id);
  const run = useRunAgent(org.id);
  const runBlocked = useRunBlocked();
  const update = useUpdateAgent(org.id);

  const tab = searchParams.get('tab') ?? 'workers';
  const editing = searchParams.get('edit');

  const updateParams = (next: {
    tab?: string;
    edit?: string | null;
    new?: string | null;
  }) =>
    setSearchParams(
      (current) => {
        const params = new URLSearchParams(current);
        if (next.tab !== undefined) {
          if (next.tab === 'workers') params.delete('tab');
          else params.set('tab', next.tab);
          params.delete('edit');
        }
        if (next.edit === null) params.delete('edit');
        else if (next.edit) params.set('edit', next.edit);
        if (next.new === null) params.delete('new');
        else if (next.new) params.set('new', next.new);
        return params;
      },
      { replace: true }
    );

  const setEditing = (edit: string | null) => updateParams({ edit });
  const editingProps = { editing, setEditing };

  // One brief per goal the organization works on (grant preferences when it
  // never picked goals); the tab values match the setup checklist's links.
  const picked = view.profile.goals;
  const inPlay = (goal: Goal) =>
    picked.length ? picked.includes(goal) : goal === 'grants';
  const briefTabs = [
    inPlay('clients') && {
      value: 'clients',
      label: 'Clients brief',
      content: <ClientBriefTab {...editingProps} />,
    },
    inPlay('tenders') && {
      value: 'tenders',
      label: 'Tenders brief',
      content: <TenderBriefTab {...editingProps} />,
    },
    inPlay('grants') && {
      value: 'preferences',
      label: 'Grant preferences',
      content: <PreferencesTab {...editingProps} />,
    },
  ]
    .filter((t) => !!t)
    .map((t) => ({
      ...t,
      content: (
        <div className="space-y-4">
          {t.content}
          {view.myRole !== 'admin' && (
            <p className="text-sm text-muted-foreground">
              Only admins can edit this.
            </p>
          )}
        </div>
      ),
    }));

  // `?new` opens the sheet so it's deep-linkable (command menu uses ?new=1);
  // an old `?edit=<id>` link opens that worker's settings.
  const editId = searchParams.get('edit');
  const openSettings = useEffectEvent((agentId: string) =>
    navigate(path(`/agents/${agentId}?tab=settings`), { replace: true })
  );
  useEffect(() => {
    if (editId && tab === 'workers') openSettings(editId);
  }, [editId, tab]);

  const sheetOpen = searchParams.has('new');
  const closeSheet = () => updateParams({ new: null });

  // Open the run page, which replays the workflow step by step.
  const onRun = (agent: Agent) =>
    run.mutate(
      { agentId: agent.id },
      {
        onSuccess: ({ run: result }) => navigate(path(`/runs/${result.id}`)),
        onError: (error) => toastUtils.error('Run failed', extractError(error)),
      }
    );

  const onToggle = (agent: Agent, enabled: boolean) =>
    update.mutate(
      { agentId: agent.id, input: { enabled } },
      {
        onError: (error) =>
          toastUtils.error('Update failed', extractError(error)),
      }
    );

  return (
    <Page>
      <PageHeader
        title="Workers"
        description="Searches that run for you. Each uses your organization's search preferences, plus anything you add to it."
        actions={
          tab === 'workers' && can('agents.create') ? (
            <Button onClick={() => updateParams({ new: '1' })}>
              <Plus className="h-4 w-4" /> New worker
            </Button>
          ) : undefined
        }
      />

      <AppTabs
        variant="underline"
        value={tab}
        onValueChange={(value) => updateParams({ tab: value })}
        tabs={[
          {
            value: 'workers',
            label: `Workers (${agents.length})`,
            content: (
              <>
                {isPending ? (
                  <PageLoader />
                ) : agents.length === 0 ? (
                  <EmptyState
                    title="No workers yet"
                    description="Create one to repeat a search or run it on a schedule."
                    action={
                      can('agents.create') && (
                        <Button
                          size="sm"
                          onClick={() => updateParams({ new: '1' })}
                        >
                          <Plus className="h-4 w-4" /> New worker
                        </Button>
                      )
                    }
                  />
                ) : (
                  <ul className="divide-y divide-border rounded-xl border border-border">
                    {agents.map((agent) => (
                      <AgentTile
                        key={agent.id}
                        agent={agent}
                        canManage={
                          agent.canManage ??
                          can('agents.manage', { ownerId: agent.ownerId })
                        }
                        running={
                          run.isPending && run.variables?.agentId === agent.id
                        }
                        onRun={() => onRun(agent)}
                        onToggle={(enabled) => onToggle(agent, enabled)}
                        runBlocked={runBlocked(agent.goal)}
                      />
                    ))}
                  </ul>
                )}
              </>
            ),
          },
          ...briefTabs,
        ]}
      />

      <AgentFormSheet
        open={sheetOpen}
        onOpenChange={(open) => !open && closeSheet()}
      />
    </Page>
  );
}
