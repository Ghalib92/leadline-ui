import { useEffect, useState } from 'react';
import type { DefaultValues } from 'react-hook-form';
import { FileText, Pencil, Plus, Sparkles } from 'lucide-react';
import {
  businessCategories,
  businessSizes,
  buyerTypes,
  countryOptions,
  employmentTypeOptions,
  leadSignals,
  seniorityOptions,
  workplaceOptions,
  tenderCategories,
  tenderEligibilityOptions,
} from '~/data/org-taxonomy';
import {
  useClientBrief,
  useDismissCvSuggestions,
  useJobBrief,
  useReadCv,
  useTenderBrief,
  useUpdateClientBrief,
  useUpdateJobBrief,
  useUpdateTenderBrief,
} from '~/features/orgs';
import {
  clientBriefFormResolver,
  jobBriefFormResolver,
  tenderBriefFormResolver,
  type JobBrief,
  type JobBriefForm,
  type JobBriefFormInput,
  type ClientBriefForm,
  type ClientBriefFormInput,
  type TenderBrief,
  type TenderBriefForm,
  type TenderBriefFormInput,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { extractError } from '~/lib/utils/extract-error';
import { timeAgo } from '~/lib/utils/format';
import { toastUtils } from '~/lib/utils/toast';
import { Button } from '~/components/ui/button';
import { AppCard } from '~/components/composed';
import { PageLoader } from '~/components/dashboard/page';
import { EditSheet } from './edit-sheet';
import { Chips, Field, type EditingProps } from './profile-tabs';
import { CvFindings } from './cv-findings';

const empty = <span className="text-muted-foreground">—</span>;
const textOrEmpty = (value: string) => (value ? value : empty);

function useCanEdit() {
  const { view } = useOrg();
  return { view, canEdit: view.myRole === 'admin' && !view.isArchived };
}

function EditButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" /> Edit
    </Button>
  );
}

// ---- Clients ------------------------------------------------------------------

const clientFields = [
  'services', 'customerTypes', 'customerKeywords', 'customerSizes',
  'targetCountries', 'targetCities', 'signals', 'excludedKeywords', 'notes',
] as const; // prettier-ignore

/** What the organization sells and who to: the brief its Clients workers use. */
export function ClientBriefTab({
  editing,
  setEditing,
}: Readonly<EditingProps>) {
  const { view, canEdit } = useCanEdit();
  const { data: brief } = useClientBrief(view.id);
  const update = useUpdateClientBrief(view.id);
  if (!brief) return <PageLoader />;

  return (
    <>
      <AppCard
        title="What you sell"
        description="What you sell and who to. Your client searches look and score with this."
        actions={
          canEdit && <EditButton onClick={() => setEditing('client_brief')} />
        }
      >
        <dl className="divide-y divide-border">
          <Field label="What you sell">
            {brief.services.length === 0 ? (
              empty
            ) : (
              <ul className="space-y-2">
                {brief.services.map((service) => (
                  <li key={service.name}>
                    <span className="font-medium">{service.name}</span>
                    {service.price && (
                      <span className="text-muted-foreground">
                        {' '}
                        · {service.price}
                      </span>
                    )}
                    {service.description && (
                      <p className="text-muted-foreground">
                        {service.description}
                      </p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Field>
          <Field label="Kinds of customer">
            <Chips values={brief.customerTypes} list={businessCategories} />
          </Field>
          <Field label="In your words">
            <Chips values={brief.customerKeywords} />
          </Field>
          <Field label="Their size">
            <Chips values={brief.customerSizes} list={businessSizes} />
          </Field>
          <Field label="Countries">
            <Chips values={brief.targetCountries} list={countryOptions()} />
          </Field>
          <Field label="Cities">
            <Chips values={brief.targetCities} />
          </Field>
          <Field label="Signs they need you">
            <Chips values={brief.signals} list={leadSignals} />
          </Field>
          <Field label="Avoid">
            <Chips values={brief.excludedKeywords} />
          </Field>
          <Field label="Other context">{textOrEmpty(brief.notes)}</Field>
        </dl>
      </AppCard>

      {editing === 'client_brief' && (
        <EditSheet<ClientBriefFormInput, ClientBriefForm>
          open
          onClose={() => setEditing(null)}
          title="Edit what you sell"
          description="Your client searches use it from their next search."
          fields={clientFields}
          required={['services']}
          resolver={clientBriefFormResolver}
          values={brief as DefaultValues<ClientBriefFormInput>}
          onSave={(values) => update.mutateAsync(values)}
          pending={update.isPending}
        />
      )}
    </>
  );
}

// ---- Tenders ------------------------------------------------------------------

const tenderFields = [
  'tenderCategories', 'keywords', 'excludedKeywords', 'buyerTypes', 'targetCountries',
  'minValue', 'maxValue', 'currency', 'tenderEligibility', 'certifications',
  'capacityNotes',
] as const; // prettier-ignore

const contractRange = (brief: TenderBrief) => {
  const { minValue: min, maxValue: max, currency } = brief;
  const fmt = (n: number) => `${currency} ${n.toLocaleString('en')}`;
  if (min == null && max == null) return empty;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  return min != null ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
};

/** What the organization bids for: the brief its Tenders workers use. */
export function TenderBriefTab({
  editing,
  setEditing,
}: Readonly<EditingProps>) {
  const { view, canEdit } = useCanEdit();
  const { data: brief } = useTenderBrief(view.id);
  const update = useUpdateTenderBrief(view.id);
  if (!brief) return <PageLoader />;

  return (
    <>
      <AppCard
        title="Tenders you want"
        description="What you bid for. Your tender searches look and score with this."
        actions={
          canEdit && <EditButton onClick={() => setEditing('tender_brief')} />
        }
      >
        <dl className="divide-y divide-border">
          <Field label="Kinds of tender">
            <Chips values={brief.tenderCategories} list={tenderCategories} />
          </Field>
          <Field label="Keywords">
            <Chips values={brief.keywords} />
          </Field>
          <Field label="Avoid">
            <Chips values={brief.excludedKeywords} />
          </Field>
          <Field label="Buyers">
            <Chips values={brief.buyerTypes} list={buyerTypes} />
          </Field>
          <Field label="Countries">
            <Chips values={brief.targetCountries} list={countryOptions()} />
          </Field>
          <Field label="Contract size">{contractRange(brief)}</Field>
          <Field label="You qualify for">
            <Chips
              values={brief.tenderEligibility}
              list={tenderEligibilityOptions}
            />
          </Field>
          <Field label="Registrations">
            <Chips values={brief.certifications} />
          </Field>
          <Field label="Capacity">{textOrEmpty(brief.capacityNotes)}</Field>
        </dl>
      </AppCard>

      {editing === 'tender_brief' && (
        <EditSheet<TenderBriefFormInput, TenderBriefForm>
          open
          onClose={() => setEditing(null)}
          title="Edit the tenders you want"
          description="Your tender searches use it from their next search."
          fields={tenderFields}
          required={['tenderCategories']}
          resolver={tenderBriefFormResolver}
          values={brief as DefaultValues<TenderBriefFormInput>}
          onSave={(values) => update.mutateAsync(values)}
          pending={update.isPending}
        />
      )}
    </>
  );
}

// ---- Jobs ---------------------------------------------------------------------

const jobFields = [
  'headline', 'targetRoles', 'seniority', 'employmentTypes', 'workplaces',
  'targetCountries', 'targetCities', 'skills', 'yearsExperience', 'salaryMin',
  'salaryCurrency', 'companies', 'excludedKeywords', 'notes',
] as const; // prettier-ignore

const READ_TIMEOUT_MS = 90_000;

/** What a job seeker looks for: the brief their Jobs workers use. */
export function JobBriefTab({ editing, setEditing }: Readonly<EditingProps>) {
  const { view, canEdit } = useCanEdit();
  // While the CV is read in the background: since when, and the last read it replaces.
  const [reading, setReading] = useState<{
    since: number;
    before: string | null;
  } | null>(null);
  const { data: brief, refetch } = useJobBrief(
    view.id,
    true,
    reading ? 3000 : undefined
  );
  const update = useUpdateJobBrief(view.id);
  const readCv = useReadCv(view.id);

  const readAt = brief?.cvSuggestions?.readAt ?? null;
  useEffect(() => {
    if (!reading) return;
    if (readAt !== reading.before) {
      setReading(null);
      return;
    }
    const left = reading.since + READ_TIMEOUT_MS - Date.now();
    const timer = setTimeout(() => setReading(null), Math.max(left, 0));
    return () => clearTimeout(timer);
  }, [reading, readAt]);

  if (!brief) return <PageLoader />;

  const read = () =>
    readCv.mutate(undefined, {
      onSuccess: () => setReading({ since: Date.now(), before: readAt }),
      onError: (error) => {
        toastUtils.error('Could not read your CV', extractError(error));
        void refetch(); // shows when it can be read again
      },
    });

  return (
    <div className="space-y-6">
      <CvFindings
        orgId={view.id}
        brief={brief}
        canEdit={canEdit}
        reading={!!reading || readCv.isPending}
        onRead={read}
      />
      <AppCard
        title="Job preferences"
        description="What you're looking for. Your searches use this and score each job against it and your CV."
        actions={
          canEdit && <EditButton onClick={() => setEditing('job_brief')} />
        }
      >
        <dl className="divide-y divide-border">
          <Field label="Headline">{textOrEmpty(brief.headline)}</Field>
          <Field label="Jobs you want">
            <Chips values={brief.targetRoles} />
          </Field>
          <Field label="Level">
            <Chips values={brief.seniority} list={seniorityOptions} />
          </Field>
          <Field label="Kind of work">
            <Chips
              values={brief.employmentTypes}
              list={employmentTypeOptions}
            />
          </Field>
          <Field label="Where you work">
            <Chips values={brief.workplaces} list={workplaceOptions} />
          </Field>
          <Field label="Countries">
            <Chips values={brief.targetCountries} list={countryOptions()} />
          </Field>
          <Field label="Cities">
            <Chips values={brief.targetCities} />
          </Field>
          <Field label="Skills">
            <Chips values={brief.skills} />
          </Field>
          <Field label="Experience">
            {brief.yearsExperience == null
              ? empty
              : `${brief.yearsExperience} years`}
          </Field>
          <Field label="Lowest monthly salary">
            {brief.salaryMin == null
              ? empty
              : `${brief.salaryCurrency} ${brief.salaryMin.toLocaleString('en')}`}
          </Field>
          <Field label="Companies you follow">
            <Chips values={brief.companies} />
          </Field>
          <Field label="Avoid">
            <Chips values={brief.excludedKeywords} />
          </Field>
          <Field label="Other context">{textOrEmpty(brief.notes)}</Field>
        </dl>
      </AppCard>

      {editing === 'job_brief' && (
        <EditSheet<JobBriefFormInput, JobBriefForm>
          open
          onClose={() => setEditing(null)}
          title="Edit your job preferences"
          description="Your searches use them from their next search."
          fields={jobFields}
          required={['targetRoles']}
          resolver={jobBriefFormResolver}
          values={brief as DefaultValues<JobBriefFormInput>}
          onSave={(values) => update.mutateAsync(values)}
          pending={update.isPending}
        />
      )}
    </div>
  );
}
