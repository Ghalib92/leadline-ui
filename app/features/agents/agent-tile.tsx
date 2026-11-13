import { Link } from 'react-router';
import { ChevronRight, Loader2, Play } from 'lucide-react';
import type { Agent } from '~/lib/schema';
import { timeAgo } from '~/lib/utils/format';
import { useOrgPath } from '~/lib/org/use-org-path';
import { RunStatusBadge } from '~/features/runs/badges';
import { Button } from '~/components/ui/button';
import { Switch } from '~/components/ui/switch';

const scheduleLabel = {
  manual: 'Manual',
  daily: 'Daily',
  weekly: 'Weekly',
} as const;

interface AgentTileProps {
  agent: Agent;
  canManage: boolean;
  running: boolean;
  onRun: () => void;
  onToggle: (enabled: boolean) => void;
}

/** One automation in the list: name, schedule, last run. Details live on its page. */
export function AgentTile({
  agent,
  canManage,
  running,
  onRun,
  onToggle,
}: Readonly<AgentTileProps>) {
  const path = useOrgPath();
  const found = agent.lastRunFound ?? 0;

  return (
    <li className="flex flex-wrap items-center gap-x-4 gap-y-2 px-4 py-3 hover:bg-muted/30">
      <Link to={path(`/agents/${agent.id}`)} className="group min-w-0 flex-1">
        <p className="flex items-center gap-1 font-medium group-hover:underline">
          <span className="truncate">{agent.name}</span>
          <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
        </p>
        <p className="mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground">
          <span>{scheduleLabel[agent.schedule]}</span>
          <span aria-hidden>·</span>
          {agent.lastRunAt ? (
            <>
              {agent.lastRunStatus && (
                <RunStatusBadge status={agent.lastRunStatus} />
              )}
              <span>
                Last run {timeAgo(agent.lastRunAt)} · {found} found
              </span>
            </>
          ) : (
            <span>Never run</span>
          )}
        </p>
      </Link>
      <div className="flex items-center gap-3">
        <Switch
          checked={agent.enabled}
          onCheckedChange={onToggle}
          disabled={!canManage}
          aria-label={
            agent.enabled ? `Turn off ${agent.name}` : `Turn on ${agent.name}`
          }
        />
        {canManage && (
          <Button
            size="sm"
            variant="outline"
            onClick={onRun}
            disabled={running || !agent.enabled}
          >
            {running ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <Play className="h-3.5 w-3.5" />
            )}
            Run now
          </Button>
        )}
      </div>
    </li>
  );
}
