import { useEffect, useEffectEvent, type ReactNode } from 'react';
import { useForm } from 'react-hook-form';
import { Link, useParams } from 'react-router';
import { AlertTriangle, CalendarPlus, ExternalLink, Star } from 'lucide-react';
import { downloadOpportunityDeadline } from '~/features/outreach';
import {
  LatestReview,
  ReviewActions,
  ReviewHistory,
} from '~/components/opportunity/review-actions';
import { ProposalCard } from '~/components/opportunity/proposal-card';
import { BriefCard } from '~/components/opportunity/brief-card';
import { BusinessCard } from '~/components/opportunity/business-card';
import { ContactsPanel } from '~/components/opportunity/contacts-panel';
import { PitchCard } from '~/components/opportunity/pitch-card';
import { LeadActivityCard } from '~/components/opportunity/lead-activity';
import {
  DeadlineBadge,
  MatchScore,
  TypeBadge,
  useOpportunity,
  useUpdateOpportunity,
} from '~/features/opportunities';
import {
  OPPORTUNITY_STATUSES,
  opportunityNotesResolver,
  type Opportunity,
  type OpportunityNotesInput,
  type UpdateOpportunityInput,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { useOrgPath } from '~/lib/org/use-org-path';
import { formatAmount, formatDate, timeAgo } from '~/lib/utils/format';
import { generateSEOTags } from '~/lib/utils/seo';
import { toastUtils } from '~/lib/utils/toast';
import { extractError } from '~/lib/utils/extract-error';
import { cn } from '~/lib/utils';
import { Button } from '~/components/ui/button';
import { AppCard } from '~/components/composed';
import { Form } from '~/components/ui/form';
import { Picker } from '~/components/ui/picker';
import { FormTextareaField } from '~/components/form-fields';
import { EmptyState, Page, PageLoader } from '~/components/dashboard/page';
import { PageHeader } from '~/components/dashboard/page-header';

export function meta() {
  return generateSEOTags({
    title: 'Opportunity | Leadline',
    description: 'Opportunity details, match reasons and notes.',
    url: '/app',
    noIndex: true,
  });
}

function Fact({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div>
      <dt className="text-xs font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 text-sm">{children}</dd>
    </div>
  );
}

export default function OpportunityDetailPage() {
  const { id = '' } = useParams();
  const { org, can } = useOrg();
  const path = useOrgPath();
  const { data: opp, isPending } = useOpportunity(org.id, id);
  const update = useUpdateOpportunity(org.id);
  const canTriage = can('opportunities.triage');
  // Approve / reject go through reviews (with a reason), not the status picker.
  const statusItems = OPPORTUNITY_STATUSES.filter(
    (s) =>
      !['pursuing', 'dismissed'].includes(s.value) || s.value === opp?.status
  );

  const notesForm = useForm<OpportunityNotesInput>({
    resolver: opportunityNotesResolver,
    defaultValues: { notes: '' },
  });

  // Re-sync the notes field when the opportunity loads or its saved notes change.
  const onLoaded = useEffectEvent((notes: string | undefined) =>
    notesForm.reset({ notes: notes ?? '' })
  );
  const oppId = opp?.id;
  const savedNotes = opp?.notes;
  useEffect(() => {
    if (oppId) onLoaded(savedNotes);
  }, [oppId, savedNotes]);

  const save = (input: UpdateOpportunityInput, message?: string) =>
    update.mutate(
      { id, input },
      {
        onSuccess: () => {
          if (message) toastUtils.success(message);
        },
        onError: (error) =>
          toastUtils.error('Update failed', extractError(error)),
      }
    );

  if (isPending) {
    return <PageLoader className="min-h-[60vh]" />;
  }

  if (!opp) {
    return (
      <Page width="narrow">
        <EmptyState
          title="Opportunity not found"
          description="It may have been removed, or it belongs to another organization."
          action={
            <Button asChild variant="outline">
              <Link to={path('/opportunities')}>Back to opportunities</Link>
            </Button>
          }
        />
      </Page>
    );
  }

  // A client lead (a business) shows its listing instead of a call's brief.
  const lead = opp.type === 'client' ? opp.business : undefined;

  return (
    <Page>
      <PageHeader
        back={{ to: path('/opportunities'), label: 'Opportunities' }}
        title={opp.title}
        meta={
          <>
            <TypeBadge type={opp.type} />
            <MatchScore score={opp.matchScore} />
            {opp.funder && <span>{opp.funder}</span>}
            {opp.business?.category && (
              <span className="capitalize">{opp.business.category}</span>
            )}
          </>
        }
        actions={
          <>
            {canTriage && <ReviewActions orgId={org.id} opp={opp} />}
            {canTriage && (
              <>
                <Button
                  variant="outline"
                  aria-pressed={opp.saved}
                  onClick={() => save({ saved: !opp.saved })}
                >
                  <Star
                    className={cn(
                      'h-4 w-4',
                      opp.saved && 'fill-amber-400 text-amber-500'
                    )}
                  />
                  {opp.saved ? 'Saved' : 'Save'}
                </Button>
                <Picker
                  items={[...statusItems]}
                  value={opp.status}
                  onChange={(value) =>
                    value &&
                    save(
                      { status: value as Opportunity['status'] },
                      'Status updated'
                    )
                  }
                  searchable={false}
                  clearable={false}
                  className="w-36 shrink-0"
                />
              </>
            )}
            {opp.deadline && (
              <Button
                variant="outline"
                onClick={() =>
                  downloadOpportunityDeadline(org.id, opp.id).catch((error) =>
                    toastUtils.error('Download failed', extractError(error))
                  )
                }
              >
                <CalendarPlus className="h-4 w-4" /> Add to calendar
              </Button>
            )}
            <Button asChild variant="outline">
              <a href={opp.sourceUrl} target="_blank" rel="noopener noreferrer">
                {lead ? 'Open' : 'Read more'}{' '}
                <ExternalLink className="h-4 w-4" />
              </a>
            </Button>
          </>
        }
      />
      <LatestReview opp={opp} />

      <div className="mt-6 grid gap-6 lg:grid-cols-3">
        <div className="space-y-6 lg:col-span-2">
          {lead ? (
            <>
              <BusinessCard business={lead} summary={opp.summary} />
              <PitchCard orgId={org.id} opp={opp} />
              <LeadActivityCard orgId={org.id} opp={opp} />
            </>
          ) : (
            <>
              <AppCard
                title="Summary"
                contentClassName="space-y-4 text-sm leading-relaxed"
              >
                <p>{opp.summary}</p>
                {opp.eligibility && (
                  <div>
                    <p className="font-medium">Eligibility</p>
                    <p className="text-muted-foreground">{opp.eligibility}</p>
                  </div>
                )}
              </AppCard>

              <BriefCard orgId={org.id} opp={opp} />

              <ProposalCard orgId={org.id} opp={opp} />
            </>
          )}

          {(opp.concerns?.length ?? 0) > 0 && (
            <AppCard title="Check before applying">
              <ul className="space-y-1.5 text-sm">
                {opp.concerns?.map((concern) => (
                  <li key={concern} className="flex gap-2">
                    <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
                    {concern}
                  </li>
                ))}
              </ul>
            </AppCard>
          )}

          <AppCard title="Why it matched">
            {opp.matchReasons.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                Found by keyword search; no profile overlap.
              </p>
            ) : (
              <ul className="flex flex-wrap gap-2">
                {opp.matchReasons.map((reason) => (
                  <li
                    key={reason}
                    className="rounded-full bg-muted px-3 py-1 text-xs"
                  >
                    {reason}
                  </li>
                ))}
              </ul>
            )}
          </AppCard>

          {/* Funder contacts; a lead's contacts are on its business card. */}
          {!lead && <ContactsPanel orgId={org.id} opp={opp} />}
          <ReviewHistory orgId={org.id} oppId={opp.id} />

          <AppCard title="Notes">
            <Form {...notesForm}>
              <form
                onSubmit={notesForm.handleSubmit((data) =>
                  save({ notes: data.notes }, 'Notes saved')
                )}
              >
                <fieldset disabled={!canTriage} className="space-y-3">
                  <FormTextareaField
                    control={notesForm.control}
                    name="notes"
                    label="Team notes"
                    rows={5}
                    placeholder="Owner, next steps, questions for the funder…"
                  />
                  <Button
                    type="submit"
                    size="sm"
                    disabled={!notesForm.formState.isDirty || update.isPending}
                  >
                    Save notes
                  </Button>
                </fieldset>
              </form>
            </Form>
          </AppCard>
        </div>

        <AppCard className="h-fit">
          <dl className="space-y-4">
            {!lead && (
              <>
                <Fact label="Amount">{formatAmount(opp.amount)}</Fact>
                <Fact label="Deadline">
                  <DeadlineBadge deadline={opp.deadline} />
                </Fact>
              </>
            )}
            {opp.location && <Fact label="Location">{opp.location}</Fact>}
            <Fact label="Source">{opp.sourceName}</Fact>
            <Fact label="Found by">
              {opp.agentName ? (
                <Link
                  to={path('/agents')}
                  className="text-primary hover:underline"
                >
                  {opp.agentName}
                </Link>
              ) : (
                <span className="text-muted-foreground">Deleted agent</span>
              )}{' '}
              · {timeAgo(opp.foundAt)}
            </Fact>
            <Fact label="Last updated">{formatDate(opp.updatedAt)}</Fact>
          </dl>
        </AppCard>
      </div>
    </Page>
  );
}
