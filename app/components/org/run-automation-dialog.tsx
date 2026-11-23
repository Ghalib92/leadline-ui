import { Link, useNavigate } from 'react-router';
import { Loader2, Play, Plus } from 'lucide-react';
import {
  DefaultSearchBadge,
  useAgents,
  useRunAgent,
  useRunBlocked,
} from '~/features/agents';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { AppDialog } from '~/components/composed';
import { Button } from '~/components/ui/button';

/**
 * The overview's main action: run one of your automations, open one, or create
 * one. Every run belongs to an automation, so it's clear what ran.
 */
export function RunAutomationDialog({
  open,
  onClose,
}: Readonly<{ open: boolean; onClose: () => void }>) {
  const { org, can, view } = useOrg();
  const path = useOrgPath();
  const navigate = useNavigate();
  const { data: agents = [], isPending } = useAgents(org.id);
  const run = useRunAgent(org.id);
  const runBlocked = useRunBlocked();

  const runnable = agents.filter(
    (a) =>
      a.enabled && (a.canManage ?? can('agents.manage', { ownerId: a.ownerId }))
  );

  const onRun = (agentId: string) =>
    run.mutate(
      { agentId },
      {
        onSuccess: ({ run: started }) => {
          onClose();
          navigate(path(`/runs/${started.id}`));
        },
        onError: (error) =>
          toastUtils.error('Could not start the search', extractError(error)),
      }
    );

  return (
    <AppDialog
      open={open}
      onOpenChange={(next) => !next && onClose()}
      title={view.isCandidate ? 'Run a job search' : 'Run a search'}
      description={
        view.isCandidate
          ? 'Each one reads your CV, your job preferences and its own instructions.'
          : "Each one searches with your organization's settings plus what it adds."
      }
      footer={
        can('agents.create') && (
          <Button asChild>
            <Link to={path('/agents?new=1')} onClick={onClose}>
              <Plus className="h-4 w-4" /> Create a search
            </Link>
          </Button>
        )
      }
    >
      {isPending ? (
        <div className="flex justify-center py-6">
          <Loader2
            className="h-5 w-5 animate-spin text-primary"
            aria-label="Loading"
          />
        </div>
      ) : runnable.length === 0 ? (
        <p className="py-4 text-sm text-muted-foreground">
          {view.isCandidate
            ? 'You have no job searches yet. Create one: say what it is for and what to look for, and it searches on a schedule or whenever you like.'
            : 'You have no searches to run yet. Create one to search on a schedule or whenever you like.'}
        </p>
      ) : (
        <ul className="max-h-80 divide-y divide-border overflow-y-auto rounded-lg border border-border">
          {runnable.map((agent) => (
            <li key={agent.id} className="flex items-center gap-3 px-3 py-2.5">
              <div className="min-w-0 flex-1">
                <Link
                  to={path(`/agents/${agent.id}`)}
                  onClick={onClose}
                  className="block truncate text-sm font-medium hover:underline"
                >
                  {agent.name}
                </Link>
                <p className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                  {agent.isDefault && <DefaultSearchBadge />}
                  {agent.lastRunAt
                    ? `Last run ${timeAgo(agent.lastRunAt)}`
                    : 'Never run'}
                </p>
              </div>
              <Button asChild size="sm" variant="ghost">
                <Link
                  to={path(`/agents/${agent.id}`)}
                  onClick={onClose}
                  aria-label={`Open ${agent.name}`}
                >
                  Open
                </Link>
              </Button>
              <Button
                size="sm"
                onClick={() => onRun(agent.id)}
                disabled={run.isPending || !!runBlocked(agent.goal)}
                title={runBlocked(agent.goal) ?? undefined}
                aria-label={`Run ${agent.name}`}
              >
                {run.isPending && run.variables?.agentId === agent.id ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Play className="h-3.5 w-3.5" />
                )}
                Run
              </Button>
            </li>
          ))}
        </ul>
      )}
    </AppDialog>
  );
}
