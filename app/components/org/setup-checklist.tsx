import { Link } from 'react-router';
import { Check, Circle, Sparkles } from 'lucide-react';
import { useSetupStatus } from '~/features/orgs';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { stepHref } from '~/lib/org/setup-steps';
import { cn } from '~/lib/utils';
import { AppCard } from '~/components/composed';

/**
 * The backend's setup checklist. Required steps are what opportunity matching
 * needs; the rest make matches better. Admins see it until it's complete.
 */
export function SetupChecklist() {
  const { view } = useOrg();
  const path = useOrgPath();
  const { data: setup } = useSetupStatus(view.id);

  if (!setup || view.myRole !== 'admin' || setup.completed === setup.total) {
    return null;
  }

  return (
    <AppCard
      className="mt-6"
      title={`Finish setting up (${setup.completed}/${setup.total})`}
      description={
        setup.readyForMatching
          ? 'Ready for matching. The optional steps sharpen what agents find.'
          : 'Complete the required steps so agents can start matching.'
      }
      actions={
        setup.readyForMatching && (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2.5 py-0.5 text-xs font-medium text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300">
            <Sparkles className="h-3 w-3" /> Ready for matching
          </span>
        )
      }
    >
      <div
        className="mb-4 h-1.5 overflow-hidden rounded-full bg-muted"
        role="progressbar"
        aria-valuenow={setup.percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Setup progress"
      >
        <div
          className="h-full rounded-full bg-primary transition-all"
          style={{ width: `${setup.percent}%` }}
        />
      </div>
      <ul className="grid gap-1 sm:grid-cols-2">
        {setup.steps.map((step) => (
          <li key={step.key}>
            <Link
              to={path(stepHref(step.key))}
              className={cn(
                'flex items-center gap-2 rounded-md px-2 py-1.5 text-sm hover:bg-muted',
                step.done && 'text-muted-foreground line-through'
              )}
            >
              {step.done ? (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              ) : (
                <Circle className="h-4 w-4 shrink-0" />
              )}
              <span className="flex-1">{step.label}</span>
              {step.required && !step.done && (
                <span className="text-xs text-muted-foreground">Required</span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </AppCard>
  );
}
