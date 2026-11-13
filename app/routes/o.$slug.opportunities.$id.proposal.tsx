import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useParams } from 'react-router';
import {
  AlertTriangle,
  Check,
  Circle,
  Download,
  History,
  Loader2,
  Pencil,
  RotateCcw,
  Sparkles,
} from 'lucide-react';
import {
  exportProposal,
  isProposalBusy,
  useEditSection,
  useOpportunityProposal,
  useProposalEvents,
  useRestoreVersion,
  useRewriteSection,
  useStartProposal,
  useVersions,
} from '~/features/proposals';
import {
  rewriteFormResolver,
  sectionEditResolver,
  type Proposal,
  type ProposalSection,
  type RewriteFormInput,
  type SectionEditInput,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { extractError } from '~/lib/utils/extract-error';
import { formatDate, timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { cn } from '~/lib/utils';
import { AppCard, AppDialog } from '~/components/composed';
import { Alert, AlertDescription } from '~/components/ui/alert';
import { Button } from '~/components/ui/button';
import { Form } from '~/components/ui/form';
import { FormTextareaField } from '~/components/form-fields';
import { SectionContent } from '~/components/proposal/section-content';
import { ProposalEditor } from '~/components/proposal/proposal-editor';
import { EmptyState, Page } from '~/components/dashboard/page';
import { PageHeader } from '~/components/dashboard/page-header';
import { ProposalDocuments } from '~/components/opportunity/proposal-documents';

export function meta() {
  return generateSEOTags({
    title: 'Proposal | Leadline',
    description: 'Review, edit and export the AI-drafted proposal.',
    url: '/app',
    noIndex: true,
  });
}

const STEPS = [
  { key: 'requirements', label: 'Reading what the call asks for' },
  { key: 'outline', label: 'Planning the sections' },
  { key: 'evidence', label: 'Finding evidence in your documents' },
  { key: 'draft', label: 'Writing each section' },
  { key: 'review', label: 'Checking it against the requirements' },
];

const SOURCE_LABEL: Record<string, string> = {
  ai_draft: 'AI draft',
  ai_section: 'AI rewrote a section',
  edit: 'Edited',
  restore: 'Restored',
};

export default function ProposalPage() {
  const { id = '' } = useParams();
  const { org } = useOrg();
  const path = useOrgPath();
  const { data: proposal, isPending } = useOpportunityProposal(org.id, id);
  const start = useStartProposal(org.id, id);
  const [active, setActive] = useState<string | null>(null);

  if (isPending) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  const back = { to: path(`/opportunities/${id}`), label: 'Opportunity' };

  if (!proposal) {
    return (
      <Page width="narrow">
        <PageHeader back={back} title="Proposal" />
        <EmptyState
          icon={Sparkles}
          title="No proposal yet"
          description="The Proposal Writer reads the call, finds evidence in your documents and drafts every section."
          action={
            <Button
              onClick={() =>
                start.mutate(undefined, {
                  onError: (error) =>
                    toastUtils.error('Could not start', extractError(error)),
                })
              }
              disabled={start.isPending}
            >
              <Sparkles className="h-4 w-4" /> Write proposal
            </Button>
          }
        />
      </Page>
    );
  }

  const section =
    proposal.sections.find((s) => s.key === active) ?? proposal.sections[0];
  const busy = isProposalBusy(proposal);

  return (
    <Page width="wide">
      <PageHeader
        back={back}
        title={`Proposal: ${proposal.opportunity.title}`}
        meta={
          <>
            {proposal.opportunity.funder && (
              <span>{proposal.opportunity.funder}</span>
            )}
            {proposal.opportunity.deadline && (
              <span>Due {formatDate(proposal.opportunity.deadline)}</span>
            )}
            <span>Version {proposal.version}</span>
            {proposal.draftedAt && <span>{timeAgo(proposal.draftedAt)}</span>}
          </>
        }
        actions={
          <>
            <Button
              variant="outline"
              disabled={busy || start.isPending}
              onClick={() =>
                start.mutate(undefined, {
                  onError: (error) =>
                    toastUtils.error('Could not start', extractError(error)),
                })
              }
            >
              <RotateCcw className="h-4 w-4" /> Redraft all
            </Button>
            <Button
              disabled={busy || proposal.version === 0}
              onClick={() =>
                exportProposal(org.id, proposal).catch((error) =>
                  toastUtils.error('Export failed', extractError(error))
                )
              }
            >
              <Download className="h-4 w-4" /> Export .docx
            </Button>
          </>
        }
      />

      {proposal.warning && !busy && (
        <Alert className="mb-4 border-amber-500/40 bg-amber-500/5">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription>{proposal.warning}</AlertDescription>
        </Alert>
      )}
      {proposal.status === 'failed' && proposal.error && (
        <Alert variant="destructive" className="mb-4">
          <AlertTriangle className="h-4 w-4" />
          <AlertDescription>
            {proposal.error} Earlier versions are kept.
          </AlertDescription>
        </Alert>
      )}

      {busy && <DraftingProgress orgId={org.id} proposal={proposal} />}

      {proposal.sections.length > 0 && section && (
        <div className="mt-6 grid gap-6 lg:grid-cols-[220px_1fr_300px]">
          <nav aria-label="Sections" className="lg:sticky lg:top-4 lg:h-fit">
            <ol className="space-y-1">
              {proposal.sections.map((s, i) => (
                <li key={s.key}>
                  <button
                    type="button"
                    onClick={() => setActive(s.key)}
                    className={cn(
                      'flex w-full items-start gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors',
                      s.key === section.key
                        ? 'bg-primary/10 font-medium text-primary'
                        : 'hover:bg-muted'
                    )}
                  >
                    <span className="tabular-nums text-muted-foreground">
                      {i + 1}.
                    </span>
                    <span className="min-w-0 flex-1">{s.title}</span>
                    {(s.missingInformation.length > 0 || !s.drafted) && (
                      <span
                        className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                        aria-label="Needs input"
                      />
                    )}
                  </button>
                </li>
              ))}
            </ol>
          </nav>

          <SectionEditor
            key={`${section.key}-${proposal.version}`}
            orgId={org.id}
            oppId={id}
            proposal={proposal}
            section={section}
            busy={busy}
          />

          <aside className="space-y-4">
            <ProposalDocuments
              orgId={org.id}
              oppId={id}
              proposal={proposal}
              busy={busy}
            />
            <ReviewPanel proposal={proposal} onPick={setActive} />
            <RequirementsPanel proposal={proposal} />
            <VersionsPanel orgId={org.id} oppId={id} proposal={proposal} />
          </aside>
        </div>
      )}
    </Page>
  );
}

function DraftingProgress({
  orgId,
  proposal,
}: Readonly<{ orgId: string; proposal: Proposal }>) {
  const { data } = useProposalEvents(orgId, proposal);
  const events = data?.events ?? [];
  const seen = new Set(events.map((e) => e.step));
  const current = events.at(-1)?.step;
  const steps =
    proposal.job?.kind === 'section'
      ? STEPS.filter((s) => s.key === 'evidence' || s.key === 'draft')
      : STEPS;
  return (
    <AppCard className="mt-6" title="The Proposal Writer is working">
      <ol className="space-y-2">
        {steps.map((step) => {
          const done = seen.has(step.key) && step.key !== current;
          const running = step.key === current;
          return (
            <li key={step.key} className="flex items-center gap-2 text-sm">
              {done ? (
                <Check className="h-4 w-4 text-emerald-600" />
              ) : running ? (
                <Loader2 className="h-4 w-4 animate-spin text-primary" />
              ) : (
                <Circle className="h-3 w-3 text-muted-foreground/50" />
              )}
              <span
                className={cn(!done && !running && 'text-muted-foreground')}
              >
                {step.label}
              </span>
            </li>
          );
        })}
      </ol>
      {events.length > 0 && (
        <ul className="mt-4 max-h-48 space-y-1 overflow-y-auto border-t border-border pt-3">
          {events.slice(-8).map((event) => (
            <li
              key={event.seq}
              className={cn(
                'text-xs',
                event.level === 'warning'
                  ? 'text-amber-700 dark:text-amber-300'
                  : 'text-muted-foreground'
              )}
            >
              {event.message}
            </li>
          ))}
        </ul>
      )}
    </AppCard>
  );
}

function SectionEditor({
  orgId,
  oppId,
  proposal,
  section,
  busy,
}: Readonly<{
  orgId: string;
  oppId: string;
  proposal: Proposal;
  section: ProposalSection;
  busy: boolean;
}>) {
  const [editing, setEditing] = useState(false);
  const [rewriting, setRewriting] = useState(false);
  const edit = useEditSection(orgId, oppId);
  const rewrite = useRewriteSection(orgId, oppId);
  const form = useForm<SectionEditInput>({
    resolver: sectionEditResolver,
    defaultValues: { content: section.content },
  });
  const rewriteForm = useForm<RewriteFormInput>({
    resolver: rewriteFormResolver,
    defaultValues: { instructions: '' },
  });
  useEffect(() => {
    form.reset({ content: section.content });
  }, [form, section.content]);

  const save = (input: SectionEditInput) =>
    edit.mutate(
      { proposal, key: section.key, content: input.content },
      {
        onSuccess: () => {
          setEditing(false);
          toastUtils.success('Section saved', 'Saved as a new version.');
        },
        onError: (error) =>
          toastUtils.error('Could not save', extractError(error)),
      }
    );
  const submitRewrite = (input: RewriteFormInput) =>
    rewrite.mutate(
      { proposal, key: section.key, instructions: input.instructions },
      {
        onSuccess: () => {
          setRewriting(false);
          rewriteForm.reset();
        },
        onError: (error) =>
          toastUtils.error('Could not rewrite', extractError(error)),
      }
    );

  return (
    <div className="min-w-0 space-y-4">
      <AppCard
        title={section.title}
        description={section.purpose}
        actions={
          !editing && (
            <div className="flex gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setEditing(true)}
                disabled={busy}
              >
                <Pencil className="h-4 w-4" /> Edit
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setRewriting(true)}
                disabled={busy}
              >
                <Sparkles className="h-4 w-4" /> Rewrite with AI
              </Button>
            </div>
          )
        }
      >
        {editing ? (
          <Form {...form}>
            <form onSubmit={form.handleSubmit(save)} className="space-y-4">
              <ProposalEditor
                value={form.watch('content')}
                onChange={(val) =>
                  form.setValue('content', val, {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                purpose={section.purpose}
                evidence={section.evidence}
                disabled={edit.isPending}
              />
              {form.formState.errors.content && (
                <p className="text-xs text-destructive">
                  {form.formState.errors.content.message}
                </p>
              )}
              <div className="flex items-center gap-2">
                <Button type="submit" size="sm" disabled={edit.isPending}>
                  {edit.isPending && (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  )}
                  Save section
                </Button>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  disabled={edit.isPending}
                  onClick={() => {
                    form.reset({ content: section.content });
                    setEditing(false);
                  }}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </Form>
        ) : !section.drafted || !section.content ? (
          <p className="text-sm text-muted-foreground">
            Not written yet. Use “Rewrite with AI” to write it, or Edit to write
            it yourself.
          </p>
        ) : (
          <SectionContent section={section} />
        )}
      </AppCard>

      {section.missingInformation.length > 0 && (
        <AppCard title="The team needs to add">
          <ul className="list-disc space-y-1 pl-5 text-sm">
            {section.missingInformation.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </AppCard>
      )}

      {section.evidence.length > 0 && (
        <AppCard title="Evidence from your documents">
          <ol className="space-y-3 text-sm">
            {section.evidence.map((item) => (
              <li key={item.n}>
                <p className="font-medium">
                  [{item.n}] {item.documentTitle}
                  {item.location && (
                    <span className="font-normal text-muted-foreground">
                      {' '}
                      · {item.location}
                    </span>
                  )}
                </p>
                <p className="mt-0.5 line-clamp-3 text-muted-foreground">
                  {item.excerpt}
                </p>
              </li>
            ))}
          </ol>
        </AppCard>
      )}

      <AppDialog
        open={rewriting}
        onOpenChange={setRewriting}
        title={`Rewrite “${section.title}”`}
        description="The AI rewrites this section only, with fresh evidence from your documents."
        footer={
          <>
            <Button variant="outline" onClick={() => setRewriting(false)}>
              Cancel
            </Button>
            <Button
              type="submit"
              form="rewrite-form"
              disabled={rewrite.isPending}
            >
              <Sparkles className="h-4 w-4" /> Rewrite
            </Button>
          </>
        }
      >
        <Form {...rewriteForm}>
          <form
            id="rewrite-form"
            onSubmit={rewriteForm.handleSubmit(submitRewrite)}
          >
            <FormTextareaField
              control={rewriteForm.control}
              name="instructions"
              label="Instructions (optional)"
              rows={3}
              placeholder="e.g. Shorter; lead with our 2025 results"
            />
          </form>
        </Form>
      </AppDialog>
    </div>
  );
}

function ReviewPanel({
  proposal,
  onPick,
}: Readonly<{ proposal: Proposal; onPick: (key: string) => void }>) {
  const review = proposal.review;
  if (!review) return null;
  const keyOf = (title: string) =>
    proposal.sections.find(
      (s) => s.key === title || s.title.toLowerCase() === title.toLowerCase()
    )?.key;
  return (
    <AppCard title="Readiness">
      <p className="text-3xl font-semibold tabular-nums">
        {review.score}
        <span className="text-base font-normal text-muted-foreground">
          /100
        </span>
      </p>
      <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-muted">
        <div
          className={cn(
            'h-full rounded-full',
            review.score >= 75
              ? 'bg-emerald-500'
              : review.score >= 50
                ? 'bg-amber-500'
                : 'bg-destructive'
          )}
          style={{ width: `${review.score}%` }}
        />
      </div>
      {review.issues.length > 0 && (
        <ul className="mt-4 space-y-2 text-sm">
          {review.issues.map((issue, i) => {
            const key = keyOf(issue.section);
            return (
              <li key={i}>
                {key ? (
                  <button
                    type="button"
                    onClick={() => onPick(key)}
                    className="text-left font-medium text-primary hover:underline"
                  >
                    {issue.section}
                  </button>
                ) : (
                  issue.section && (
                    <span className="font-medium">{issue.section}</span>
                  )
                )}
                <p className="text-muted-foreground">{issue.issue}</p>
                {issue.suggestion && (
                  <p className="text-xs">→ {issue.suggestion}</p>
                )}
              </li>
            );
          })}
        </ul>
      )}
      {review.missing_requirements.length > 0 && (
        <div className="mt-4">
          <p className="text-xs font-medium text-muted-foreground">Missing</p>
          <ul className="mt-1 list-disc space-y-0.5 pl-5 text-sm">
            {review.missing_requirements.map((item) => (
              <li key={item}>{item}</li>
            ))}
          </ul>
        </div>
      )}
    </AppCard>
  );
}

function RequirementsPanel({ proposal }: Readonly<{ proposal: Proposal }>) {
  const req = proposal.requirements;
  if (!req) return null;
  const groups: [string, string[] | undefined][] = [
    ['Documents required', req.documents_required],
    ['How it is judged', req.evaluation_criteria],
    ['Eligibility', req.eligibility],
    ['Budget rules', req.budget_rules],
    ['Format', req.format_rules],
  ];
  return (
    <AppCard title="What the call asks for">
      {req.summary && (
        <p className="text-sm text-muted-foreground">{req.summary}</p>
      )}
      <div className="mt-3 space-y-3">
        {groups
          .filter(([, items]) => items && items.length > 0)
          .map(([label, items]) => (
            <div key={label}>
              <p className="text-xs font-medium text-muted-foreground">
                {label}
              </p>
              <ul className="mt-1 space-y-0.5 text-sm">
                {items?.map((item) => (
                  <li key={item} className="flex gap-1.5">
                    <Check className="mt-0.5 h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                    {item}
                  </li>
                ))}
              </ul>
            </div>
          ))}
      </div>
    </AppCard>
  );
}

function VersionsPanel({
  orgId,
  oppId,
  proposal,
}: Readonly<{ orgId: string; oppId: string; proposal: Proposal }>) {
  const { data: versions = [] } = useVersions(orgId, proposal.id);
  const restore = useRestoreVersion(orgId, oppId);
  if (versions.length === 0) return null;
  return (
    <AppCard
      title={
        <span className="inline-flex items-center gap-1.5">
          <History className="h-4 w-4" /> Versions
        </span>
      }
    >
      <ol className="max-h-72 space-y-2 overflow-y-auto text-sm">
        {versions.map((version) => (
          <li
            key={version.number}
            className="flex items-start justify-between gap-2"
          >
            <div className="min-w-0">
              <p className="font-medium">
                v{version.number} ·{' '}
                {SOURCE_LABEL[version.source] ?? version.source}
              </p>
              <p className="truncate text-xs text-muted-foreground">
                {version.createdBy?.name ?? 'Leadline AI'} ·{' '}
                {timeAgo(version.createdAt)}
                {version.note && ` · ${version.note}`}
              </p>
            </div>
            {version.number !== proposal.version && (
              <Button
                size="sm"
                variant="ghost"
                disabled={restore.isPending || isProposalBusy(proposal)}
                onClick={() =>
                  restore.mutate(
                    { proposalId: proposal.id, number: version.number },
                    {
                      onSuccess: () =>
                        toastUtils.success(
                          `Restored version ${version.number}`
                        ),
                      onError: (error) =>
                        toastUtils.error(
                          'Could not restore',
                          extractError(error)
                        ),
                    }
                  )
                }
              >
                Restore
              </Button>
            )}
          </li>
        ))}
      </ol>
    </AppCard>
  );
}
