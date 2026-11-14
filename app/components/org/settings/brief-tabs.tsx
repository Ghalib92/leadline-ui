import type { DefaultValues } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import {
  businessCategories,
  businessSizes,
  buyerTypes,
  countryOptions,
  leadSignals,
  tenderCategories,
  tenderEligibilityOptions,
} from '~/data/org-taxonomy';
import {
  useClientBrief,
  useTenderBrief,
  useUpdateClientBrief,
  useUpdateTenderBrief,
} from '~/features/orgs';
import {
  clientBriefFormResolver,
  tenderBriefFormResolver,
  type ClientBriefForm,
  type ClientBriefFormInput,
  type TenderBrief,
  type TenderBriefForm,
  type TenderBriefFormInput,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { Button } from '~/components/ui/button';
import { AppCard } from '~/components/composed';
import { PageLoader } from '~/components/dashboard/page';
import { EditSheet } from './edit-sheet';
import { Chips, Field, type EditingProps } from './profile-tabs';

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
        title="Clients brief"
        description="What you sell and who to. Your Clients workers search and score with this."
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
          title="Edit the clients brief"
          description="Your Clients workers use it from their next run."
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
        title="Tenders brief"
        description="What you bid for. Your Tenders workers search and score with this."
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
          title="Edit the tenders brief"
          description="Your Tenders workers use it from their next run."
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
