import { Link } from 'react-router';
import { ArrowRight, Inbox, Loader2, SearchX } from 'lucide-react';
import type { AgentRun, RunOutcome } from '~/lib/schema';
import { useOrgPath } from '~/lib/org/use-org-path';
import { Button } from '~/components/ui/button';

const plural = (n: number, one: string, many: string) =>
  `${n} ${n === 1 ? one : many}`;

/** Why a run added nothing, most common reasons first; empty counts dropped. */
export function noResultReasons(outcome: RunOutcome): string[] {
  const { skipped } = outcome;
  const reasons: [number, string][] = [
    [
      skipped.closed,
      `${plural(skipped.closed, 'call was', 'calls were')} already closed`,
    ],
    [
      skipped.notAnOpportunity,
      `${plural(skipped.notAnOpportunity, 'page was', 'pages were')} not a single open call (lists, news, reports)`,
    ],
    [
      skipped.wrongType,
      `${plural(skipped.wrongType, 'was', 'were')} a type you did not ask for`,
    ],
    [
      skipped.excluded,
      `${skipped.excluded} matched your excluded funders or keywords`,
    ],
    [
      skipped.unreadable,
      `${plural(skipped.unreadable, 'page', 'pages')} could not be read`,
    ],
    [
      outcome.belowThreshold,
      `${plural(outcome.belowThreshold, 'match scored', 'matches scored')} below ${outcome.matchThreshold ?? 'the threshold'}` +
        (outcome.bestScore === null ? '' : ` (best: ${outcome.bestScore})`),
    ],
    [
      outcome.duplicates,
      `${plural(outcome.duplicates, 'was', 'were')} already in your opportunities`,
    ],
  ];
  return reasons
    .filter(([count]) => count > 0)
    .sort((a, b) => b[0] - a[0])
    .map(([, text]) => text);
}

/**
 * What to do after a run: review what it added, or (when it added nothing) why
 * and how to widen the next search.
 */
export function RunNextStep({
  run,
  onSearchAgain,
  searching = false,
}: Readonly<{
  run: AgentRun;
  /** Omitted when this person cannot start the search again. */
  onSearchAgain?: () => void;
  searching?: boolean;
}>) {
  const path = useOrgPath();

  if (run.found > 0) {
    return (
      <section
        aria-labelledby="next-step-heading"
        className="mt-6 flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary/5 p-5 sm:flex-row sm:items-center"
      >
        <Inbox className="h-6 w-6 shrink-0 text-primary" aria-hidden="true" />
        <div className="min-w-0 flex-1">
          <h2 id="next-step-heading" className="font-semibold">
            {plural(run.found, 'new opportunity', 'new opportunities')} to
            review
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Approve the ones worth pursuing and a proposal draft starts, or
            reject with a reason so the next searches learn from it.
          </p>
        </div>
        <Button asChild>
          <Link to={path(`/opportunities?run=${run.id}`)}>
            Review now <ArrowRight className="h-4 w-4" />
          </Link>
        </Button>
      </section>
    );
  }

  const reasons = run.outcome ? noResultReasons(run.outcome) : [];
  return (
    <section
      aria-labelledby="next-step-heading"
      className="mt-6 rounded-xl border border-border p-5"
    >
      <div className="flex gap-3">
        <SearchX
          className="mt-0.5 h-6 w-6 shrink-0 text-muted-foreground"
          aria-hidden="true"
        />
        <div className="min-w-0 flex-1">
          <h2 id="next-step-heading" className="font-semibold">
            Nothing good enough this time
          </h2>
          {reasons.length > 0 ? (
            <>
              <p className="mt-0.5 text-sm text-muted-foreground">
                Of what this search found:
              </p>
              <ul className="mt-2 list-disc space-y-0.5 pl-5 text-sm">
                {reasons.map((reason) => (
                  <li key={reason}>{reason}</li>
                ))}
              </ul>
            </>
          ) : (
            <p className="mt-0.5 text-sm text-muted-foreground">
              No open opportunity matched your profile well enough to add.
            </p>
          )}
          <p className="mt-3 text-sm text-muted-foreground">
            Try a deeper search, more types or sources, or add the websites
            where your funders publish their calls.
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {onSearchAgain && (
              <Button onClick={onSearchAgain} disabled={searching}>
                {searching && <Loader2 className="h-4 w-4 animate-spin" />}
                Search again
              </Button>
            )}
            <Button asChild variant="outline">
              <Link to={path('/settings/general?tab=runs')}>
                Search settings
              </Link>
            </Button>
            <Button asChild variant="outline">
              <Link to={path('/settings/general?tab=sources')}>
                Add your own sources
              </Link>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
