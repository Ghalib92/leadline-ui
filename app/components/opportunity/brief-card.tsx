import {
  ArrowRight,
  CheckCircle2,
  CircleAlert,
  FileText,
  Loader2,
  RefreshCw,
  XCircle,
} from 'lucide-react';
import type { Opportunity } from '~/lib/schema';
import { useRegenerateBrief } from '~/features/opportunities';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { AppCard } from '~/components/composed';
import { Button } from '~/components/ui/button';

/** "low (1-2 days)" → ["Low", "1-2 days"]; the analyst writes level then rationale. */
function splitEffort(effort: string): [string, string] {
  const match = /^\s*(low|medium|high)\b[\s:,.–-]*\(?(.*?)\)?\s*$/i.exec(
    effort
  );
  if (!match) return [effort, ''];
  const level = match[1].toLowerCase();
  return [level[0].toUpperCase() + level.slice(1), match[2]];
}

/** Which company documents the brief read, in one line. */
function basedOn(sources: NonNullable<Opportunity['briefSources']>) {
  if (sources.mode === 'none')
    return 'No company documents were used for this brief.';
  const where =
    sources.mode === 'folders'
      ? `your ${sources.folders.join(', ')} folder${sources.folders.length === 1 ? '' : 's'}`
      : 'all your documents';
  return sources.documents.length
    ? `Based on ${sources.documents.join(', ')}, from ${where}.`
    : `Searched ${where}; nothing relevant was found.`;
}

/** The analyst's executive brief: fit, eligibility, documents, effort, next step. */
export function BriefCard({
  orgId,
  opp,
}: Readonly<{ orgId: string; opp: Opportunity }>) {
  const regenerate = useRegenerateBrief(orgId);
  const retry = () =>
    regenerate.mutate(opp.id, {
      onError: (error) =>
        toastUtils.error('Could not prepare the brief', extractError(error)),
    });

  if (!opp.brief) {
    const failed = opp.briefStatus === 'failed';
    return (
      <AppCard title="Brief">
        <div className="flex flex-wrap items-center justify-between gap-3 text-sm">
          <p className="flex items-center gap-2 text-muted-foreground">
            {failed ? (
              <CircleAlert className="h-4 w-4 text-amber-500" />
            ) : (
              <Loader2 className="h-4 w-4 animate-spin" />
            )}
            {failed
              ? "The AI couldn't prepare a brief for this opportunity."
              : 'The AI is preparing a brief: fit, eligibility and what to submit.'}
          </p>
          {failed && (
            <Button
              variant="outline"
              size="sm"
              onClick={retry}
              disabled={regenerate.isPending}
            >
              <RefreshCw className="h-3.5 w-3.5" /> Try again
            </Button>
          )}
        </div>
      </AppCard>
    );
  }

  const brief = opp.brief;
  const [effortLevel, effortWhy] = splitEffort(brief.effort);
  return (
    <AppCard
      title="Brief"
      description="The AI's assessment of this opportunity for your organization."
      actions={
        <Button
          variant="ghost"
          size="sm"
          onClick={retry}
          disabled={regenerate.isPending}
          aria-label="Prepare the brief again"
        >
          <RefreshCw
            className={
              regenerate.isPending ? 'h-3.5 w-3.5 animate-spin' : 'h-3.5 w-3.5'
            }
          />
          Refresh
        </Button>
      }
      contentClassName="space-y-5 text-sm"
    >
      {brief.nextStep && (
        <div className="flex gap-3 rounded-lg border border-primary/30 bg-primary/5 p-3">
          <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
          <div>
            <p className="text-xs font-medium text-primary">Next step</p>
            <p className="mt-0.5 font-medium">{brief.nextStep}</p>
          </div>
        </div>
      )}

      <div className="space-y-2 leading-relaxed">
        <p>{brief.whatItIs}</p>
        <p className="text-muted-foreground">{brief.whyItFits}</p>
      </div>

      {brief.eligibility.length > 0 && (
        <div>
          <p className="mb-2 font-medium">Eligibility</p>
          <ul className="space-y-2">
            {brief.eligibility.map((item) => (
              <li key={item.criterion} className="flex gap-2">
                {item.meets ? (
                  <CheckCircle2
                    className="mt-0.5 h-4 w-4 shrink-0 text-emerald-600"
                    aria-label="Met"
                  />
                ) : (
                  <XCircle
                    className="mt-0.5 h-4 w-4 shrink-0 text-destructive"
                    aria-label="Not met"
                  />
                )}
                <div>
                  <p>{item.criterion}</p>
                  {item.notes && (
                    <p className="text-xs text-muted-foreground">
                      {item.notes}
                    </p>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {brief.documentsNeeded.length > 0 && (
        <div>
          <p className="mb-2 font-medium">Documents to submit</p>
          <ul className="grid gap-1.5 sm:grid-cols-2">
            {brief.documentsNeeded.map((doc) => (
              <li key={doc} className="flex items-center gap-2">
                <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
                {doc}
              </li>
            ))}
          </ul>
        </div>
      )}

      {opp.briefSources && (
        <p className="text-xs text-muted-foreground">
          {basedOn(opp.briefSources)}
        </p>
      )}

      <dl className="grid gap-3 border-t border-border pt-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs text-muted-foreground">Effort</dt>
          <dd className="mt-0.5">
            <span className="font-medium">{effortLevel}</span>
            {effortWhy && (
              <span className="text-muted-foreground"> · {effortWhy}</span>
            )}
          </dd>
        </div>
        {brief.deadlinePlan && (
          <div>
            <dt className="text-xs text-muted-foreground">Timeline</dt>
            <dd className="mt-0.5">{brief.deadlinePlan}</dd>
          </div>
        )}
      </dl>
    </AppCard>
  );
}
