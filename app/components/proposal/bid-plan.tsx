import { AlertTriangle, Check, Circle, CircleDot } from 'lucide-react';
import type { BidPlan } from '~/lib/schema';
import { cn } from '~/lib/utils';
import { AppCard } from '~/components/composed';

const day = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });

function closingLine(plan: BidPlan): string {
  const closes = new Date(plan.closesAt).toLocaleString('en-GB', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'Africa/Nairobi',
  });
  if (plan.closed) return `Closed ${closes}`;
  if (plan.daysLeft <= 0) return `Closes today, ${closes}`;
  if (plan.daysLeft === 1) return `Closes tomorrow, ${closes}`;
  return `Closes ${closes} · ${plan.daysLeft} days left`;
}

/** The steps to a submitted bid, counted back from the closing time. */
export function BidPlanCard({ plan }: Readonly<{ plan: BidPlan }>) {
  return (
    <AppCard
      title="Deadline plan"
      description={
        <span
          className={cn(
            !plan.closed &&
              plan.daysLeft < 3 &&
              'font-medium text-rose-600 dark:text-rose-400'
          )}
        >
          {closingLine(plan)}
        </span>
      }
    >
      {plan.tight && !plan.closed && (
        <p className="mb-3 flex gap-2 rounded-md bg-amber-500/10 p-2 text-xs text-amber-800 dark:text-amber-200">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          Time is short: steps that should already be done are due today.
        </p>
      )}
      <ol className="space-y-3">
        {plan.steps.map((step) => (
          <li key={step.key} className="flex gap-3 text-sm">
            <span className="mt-0.5 shrink-0">
              {step.state === 'done' ? (
                <Check className="h-4 w-4 text-emerald-600" aria-label="Done" />
              ) : step.state === 'today' ? (
                <CircleDot
                  className="h-4 w-4 text-primary"
                  aria-label="Due today"
                />
              ) : (
                <Circle
                  className={cn(
                    'h-4 w-4',
                    step.state === 'past'
                      ? 'text-muted-foreground/40'
                      : 'text-muted-foreground'
                  )}
                  aria-label={step.state === 'past' ? 'Passed' : 'Upcoming'}
                />
              )}
            </span>
            <div
              className={cn(
                'min-w-0 flex-1',
                (step.state === 'past' || step.state === 'done') &&
                  'text-muted-foreground'
              )}
            >
              <p className="text-xs tabular-nums text-muted-foreground">
                {step.state === 'today' ? (
                  <span className="font-medium text-primary">Today</span>
                ) : (
                  day(step.due)
                )}
                {step.time && `, ${step.time}`}
                {step.fromTender && ' · set by the tender'}
              </p>
              <p
                className={cn(
                  'font-medium',
                  step.state === 'done' && 'line-through'
                )}
              >
                {step.title}
              </p>
              {step.note && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {step.note}
                </p>
              )}
            </div>
          </li>
        ))}
      </ol>
    </AppCard>
  );
}
