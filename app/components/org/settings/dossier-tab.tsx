import type { ReactNode } from 'react';
import { AlertCircle, Loader2, RefreshCw, Sparkles } from 'lucide-react';
import { useDossier, useRegenerateDossier } from '~/features/orgs';
import type { DossierContent } from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { formatDate } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { Button } from '~/components/ui/button';
import { Alert, AlertDescription, AlertTitle } from '~/components/ui/alert';
import { AppCard } from '~/components/composed';
import { Chips, Field } from './profile-tabs';

interface DossierTabProps {
  /** Switch the settings page to another tab (profile, documents, …). */
  goToTab: (tab: string) => void;
}

/**
 * "What the AI knows about you": the company dossier every agent works from.
 * The backend rewrites it when the profile, preferences or documents change;
 * admins can also ask for a rewrite.
 */
export function DossierTab({ goToTab }: Readonly<DossierTabProps>) {
  const { view } = useOrg();
  const { data: dossier, isPending, isError } = useDossier(view.id);
  const regenerate = useRegenerateDossier(view.id);
  const canEdit = view.myRole === 'admin' && !view.isArchived;
  const generating = dossier?.status === 'generating';

  const onRegenerate = async () => {
    try {
      await regenerate.mutateAsync();
    } catch (error) {
      toastUtils.error('Could not regenerate', extractError(error));
    }
  };

  const actions = canEdit && dossier?.content && (
    <Button
      size="sm"
      variant="outline"
      onClick={onRegenerate}
      disabled={generating || regenerate.isPending}
    >
      <RefreshCw className="h-3.5 w-3.5" /> Regenerate
    </Button>
  );

  return (
    <div className="space-y-4">
      <AppCard
        title="What the AI knows about you"
        description="A summary the AI wrote from your profile, preferences and documents. Leadline works from it, and it updates when they change."
        actions={actions}
      >
        {isPending ? null : isError || !dossier ? (
          <p className="text-sm text-muted-foreground">
            Could not load the summary. Try again in a moment.
          </p>
        ) : (
          <div className="space-y-4">
            {generating && (
              <p
                role="status"
                className="flex items-center gap-2 text-sm text-primary"
              >
                <Loader2 className="h-4 w-4 animate-spin" />
                {dossier.content
                  ? 'Updating the summary…'
                  : 'Writing your summary…'}
              </p>
            )}
            {dossier.status === 'failed' && (
              <Alert variant="destructive">
                <AlertCircle />
                <AlertTitle>The last update failed</AlertTitle>
                <AlertDescription>
                  <p>
                    {dossier.error || 'Something went wrong.'}
                    {dossier.content && ' Showing the previous version.'}
                  </p>
                  {canEdit && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="mt-2"
                      onClick={onRegenerate}
                      disabled={regenerate.isPending}
                    >
                      Try again
                    </Button>
                  )}
                </AlertDescription>
              </Alert>
            )}
            {dossier.content ? (
              <DossierBody content={dossier.content} />
            ) : (
              !generating && (
                <EmptyState
                  canEdit={canEdit}
                  onGenerate={onRegenerate}
                  generating={regenerate.isPending}
                  goToTab={goToTab}
                />
              )
            )}
          </div>
        )}
      </AppCard>

      {dossier?.content && dossier.content.gaps.length > 0 && (
        <AppCard
          title="Help the AI know you better"
          description="Adding these improves matching and the proposals it drafts."
          actions={
            canEdit && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => goToTab('profile')}
              >
                Edit profile
              </Button>
            )
          }
        >
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {dossier.content.gaps.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        </AppCard>
      )}

      {dossier?.generatedAt && (
        <p className="text-xs text-muted-foreground">
          Version {dossier.version} · Updated {formatDate(dossier.generatedAt)}
          {dossier.promptId && ` · ${dossier.promptId}`}
          {dossier.model && ` · ${dossier.model}`}
        </p>
      )}
    </div>
  );
}

function EmptyState({
  canEdit,
  onGenerate,
  generating,
  goToTab,
}: Readonly<{
  canEdit: boolean;
  onGenerate: () => void;
  generating: boolean;
  goToTab: (tab: string) => void;
}>) {
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex h-9 w-9 items-center justify-center rounded-md bg-primary/10 text-primary">
        <Sparkles className="h-4 w-4" />
      </span>
      <p className="text-sm text-muted-foreground">
        Nothing yet. Describe what you do in your profile or upload a document,
        and the AI writes its summary automatically.
      </p>
      {canEdit && (
        <div className="flex flex-wrap gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToTab('profile')}
          >
            Complete your profile
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => goToTab('documents')}
          >
            Upload documents
          </Button>
          <Button size="sm" onClick={onGenerate} disabled={generating}>
            Generate now
          </Button>
        </div>
      )}
    </div>
  );
}

function Items({ values }: Readonly<{ values: readonly string[] }>) {
  return (
    <ul className="list-disc space-y-1 pl-4">
      {values.map((value) => (
        <li key={value}>{value}</li>
      ))}
    </ul>
  );
}

function DossierBody({ content }: Readonly<{ content: DossierContent }>) {
  // Only what the AI found; empty sections are listed under the gaps instead.
  const rows: [string, ReactNode, boolean][] = [
    ['Type', content.organizationType, !!content.organizationType],
    ['Mission', content.mission, !!content.mission],
    ['Focus areas', <Chips values={content.focusAreas} />, content.focusAreas.length > 0],
    ['Programs & services', <Items values={content.offerings} />, content.offerings.length > 0],
    ['Who you serve', <Items values={content.beneficiaries} />, content.beneficiaries.length > 0],
    ['Where you work', <Chips values={content.geographies} />, content.geographies.length > 0],
    ['Track record', <Items values={content.trackRecord} />, content.trackRecord.length > 0],
    ['Past funders', <Chips values={content.pastFunders} />, content.pastFunders.length > 0],
    ['Strengths', <Items values={content.strengths} />, content.strengths.length > 0],
    ['Eligibility', <Items values={content.eligibilityFacts} />, content.eligibilityFacts.length > 0],
    ['Looking for', <Chips values={content.seeking} />, content.seeking.length > 0],
    ['Search terms', <Chips values={content.searchKeywords} />, content.searchKeywords.length > 0],
  ]; // prettier-ignore

  return (
    <div className="space-y-2">
      <p className="text-sm leading-relaxed">{content.summary}</p>
      <dl className="divide-y divide-border">
        {rows
          .filter(([, , shown]) => shown)
          .map(([label, value]) => (
            <Field key={label} label={label}>
              {value}
            </Field>
          ))}
      </dl>
    </div>
  );
}
