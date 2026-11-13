import type { RunCandidate, RunStatus } from '~/lib/schema';
import { cn } from '~/lib/utils';

const pill =
  'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-xs font-medium';

const STATUS_META: Record<
  RunStatus | 'running',
  { label: string; className: string; dot: string }
> = {
  queued: {
    label: 'Starting',
    className: 'bg-primary/10 text-primary',
    dot: 'bg-primary/60 animate-pulse',
  },
  running: {
    label: 'Running',
    className: 'bg-primary/10 text-primary',
    dot: 'bg-primary animate-pulse',
  },
  succeeded: {
    label: 'Succeeded',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    dot: 'bg-emerald-500',
  },
  partial: {
    label: 'Completed with warnings',
    className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    dot: 'bg-amber-500',
  },
  failed: {
    label: 'Failed',
    className: 'bg-destructive/10 text-destructive',
    dot: 'bg-destructive',
  },
};

export function RunStatusBadge({
  status,
}: Readonly<{ status: RunStatus | 'running' }>) {
  const meta = STATUS_META[status];
  return (
    <span className={cn(pill, meta.className)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', meta.dot)} />
      {meta.label}
    </span>
  );
}

const DECISION_META: Record<
  RunCandidate['decision'],
  { label: string; className: string }
> = {
  added: {
    label: 'Added',
    className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
  },
  duplicate: {
    label: 'Already in feed',
    className: 'bg-muted text-muted-foreground',
  },
  below_threshold: {
    label: 'Below threshold',
    className: 'bg-muted text-muted-foreground',
  },
};

export function DecisionBadge({
  decision,
}: Readonly<{ decision: RunCandidate['decision'] }>) {
  const meta = DECISION_META[decision];
  return <span className={cn(pill, meta.className)}>{meta.label}</span>;
}

export function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  const seconds = ms / 1000;
  if (seconds < 60) return `${seconds.toFixed(1)}s`;
  return `${Math.floor(seconds / 60)}m ${Math.round(seconds % 60)}s`;
}
