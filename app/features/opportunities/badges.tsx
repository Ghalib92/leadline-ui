import {
  OPPORTUNITY_STATUSES,
  type OpportunityStatus,
  type OpportunityType,
} from '~/lib/schema';
import { daysUntil, formatDate } from '~/lib/utils/format';
import { cn } from '~/lib/utils';

const TYPE_META: Record<OpportunityType, { label: string; className: string }> =
  {
    grant: {
      label: 'Grant',
      className: 'bg-emerald-500/10 text-emerald-700 dark:text-emerald-400',
    },
    tender: {
      label: 'Tender',
      className: 'bg-sky-500/10 text-sky-700 dark:text-sky-400',
    },
    partnership: {
      label: 'Partnership',
      className: 'bg-violet-500/10 text-violet-700 dark:text-violet-400',
    },
    event: {
      label: 'Event',
      className: 'bg-amber-500/10 text-amber-700 dark:text-amber-400',
    },
    client: {
      label: 'Client lead',
      className: 'bg-rose-500/10 text-rose-700 dark:text-rose-400',
    },
  };

const pill =
  'inline-flex items-center whitespace-nowrap rounded-md px-2 py-0.5 text-xs font-medium';

export function TypeBadge({ type }: Readonly<{ type: OpportunityType }>) {
  return (
    <span className={cn(pill, TYPE_META[type].className)}>
      {TYPE_META[type].label}
    </span>
  );
}

export function StatusBadge({
  status,
}: Readonly<{ status: OpportunityStatus }>) {
  const label =
    OPPORTUNITY_STATUSES.find((s) => s.value === status)?.label ?? status;
  return (
    <span
      className={cn(
        pill,
        'border border-border',
        status === 'new' && 'border-primary/30 bg-primary/10 text-primary',
        status === 'won' &&
          'border-emerald-500/30 text-emerald-700 dark:text-emerald-400',
        (status === 'lost' || status === 'dismissed') && 'text-muted-foreground'
      )}
    >
      {label}
    </span>
  );
}

export function MatchScore({ score }: Readonly<{ score: number }>) {
  return (
    <span
      title="How well this matches your organization"
      className={cn(
        pill,
        'tabular-nums',
        score >= 80 && 'bg-primary/10 text-primary',
        score >= 60 &&
          score < 80 &&
          'bg-amber-500/10 text-amber-700 dark:text-amber-400',
        score < 60 && 'bg-muted text-muted-foreground'
      )}
    >
      {score}% match
    </span>
  );
}

/** Renders client-side only (org pages resolve after hydration), so `Date.now()` is safe. */
export function DeadlineBadge({ deadline }: Readonly<{ deadline?: string }>) {
  if (!deadline) {
    return <span className="text-xs text-muted-foreground">Rolling</span>;
  }
  const days = daysUntil(deadline);
  if (days < 0) {
    return (
      <span className="text-xs text-muted-foreground">
        Closed {formatDate(deadline)}
      </span>
    );
  }
  return (
    <span
      className={cn(
        'whitespace-nowrap text-xs',
        days <= 7 ? 'font-medium text-destructive' : 'text-muted-foreground'
      )}
    >
      {days === 0 ? 'Due today' : `${days}d left`} · {formatDate(deadline)}
    </span>
  );
}
