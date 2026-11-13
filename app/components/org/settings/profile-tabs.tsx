import type { ReactNode } from 'react';
import type { DefaultValues } from 'react-hook-form';
import { Pencil } from 'lucide-react';
import {
  budgetRanges,
  countryOptions,
  eligibilityOptions,
  geographicScopes,
  languageOptions,
  opportunityKinds,
  organizationTypes,
  sdgOptions,
  targetRegions,
  teamSizes,
} from '~/data/org-taxonomy';
import { SECTORS, labelOf, type Option } from '~/data/taxonomy';
import { useUpdateOrg, useUpdatePreferences } from '~/features/orgs';
import {
  orgProfileFormResolver,
  preferencesFormResolver,
  type OrgProfile,
  type OrgProfileForm,
  type OrgProfileFormInput,
  type PreferencesForm,
  type PreferencesFormInput,
  type PreferencesView,
} from '~/lib/schema';
import { useOrg } from '~/lib/org/org-context';
import { formatDate } from '~/lib/utils/format';
import { Button } from '~/components/ui/button';
import { AppCard } from '~/components/composed';
import { EditSheet } from './edit-sheet';

export interface EditingProps {
  /** The open sheet (`?edit=`), or null. */
  editing: string | null;
  setEditing: (key: string | null) => void;
}

// ---- Read-only rendering ----------------------------------------------------

export function Field({
  label,
  children,
}: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <div className="grid gap-1 py-3 sm:grid-cols-3 sm:gap-4">
      <dt className="text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words whitespace-pre-line sm:col-span-2">
        {children}
      </dd>
    </div>
  );
}

const empty = <span className="text-muted-foreground">—</span>;
const textOrEmpty = (value: string | number | null | undefined) =>
  value === '' || value == null ? empty : value;
const choice = (list: readonly Option[], value: string) =>
  value ? labelOf(list, value) : empty;

export function Chips({
  values,
  list,
}: Readonly<{
  values: readonly (string | number)[];
  list?: readonly Option[];
}>) {
  if (values.length === 0) return empty;
  return (
    <ul className="flex flex-wrap gap-1.5">
      {values.map((value) => (
        <li key={value} className="rounded-full bg-muted px-2.5 py-0.5 text-xs">
          {list ? labelOf(list, String(value)) : value}
        </li>
      ))}
    </ul>
  );
}

function EditButton({ onClick }: Readonly<{ onClick: () => void }>) {
  return (
    <Button variant="outline" size="sm" onClick={onClick}>
      <Pencil className="h-3.5 w-3.5" /> Edit
    </Button>
  );
}

// ---- Profile ------------------------------------------------------------------

/** Each sheet edits one group; `basics`/`focus` match the setup checklist steps. */
const profileSheets: Record<
  string,
  { title: string; fields: (keyof OrgProfile)[]; required?: (keyof OrgProfile)[] }
> = {
  identity: {
    title: 'Identity',
    fields: ['name', 'organizationType', 'legalName', 'registrationNumber', 'yearFounded', 'teamSize', 'annualBudget', 'industry'],
    required: ['name'],
  },
  contact: {
    title: 'Contact & location',
    fields: ['website', 'contactEmail', 'phone', 'country', 'city', 'address'],
  },
  about: {
    title: 'About & impact',
    fields: ['description', 'mission', 'vision', 'offerings', 'targetBeneficiaries', 'trackRecord', 'pastFunding'],
  },
  areas: {
    title: 'Focus areas',
    fields: ['sectors', 'sdgs', 'operatingCountries', 'languages'],
  },
  basics: {
    title: 'The basics',
    fields: ['organizationType', 'country', 'description'],
    required: ['organizationType', 'country', 'description'],
  },
  focus: {
    title: 'What you do',
    fields: ['mission', 'offerings', 'sectors'],
    required: ['sectors'],
  },
}; // prettier-ignore

const pick = (profile: OrgProfile, keys: readonly (keyof OrgProfile)[]) =>
  Object.fromEntries(keys.map((key) => [key, profile[key]])) as OrgProfileForm;

export function ProfileTab({ editing, setEditing }: Readonly<EditingProps>) {
  const { view } = useOrg();
  const update = useUpdateOrg(view.id);
  const canEdit = view.myRole === 'admin' && !view.isArchived;
  const p = view.profile;
  const sheet = editing ? profileSheets[editing] : undefined;
  const edit = (key: string) =>
    canEdit && <EditButton onClick={() => setEditing(key)} />;

  return (
    <div className="space-y-4">
      <AppCard title="Identity" actions={edit('identity')}>
        <dl className="divide-y divide-border">
          <Field label="Name">{p.name}</Field>
          <Field label="Workspace URL">
            <span className="font-mono text-xs">/o/{view.slug}</span>
          </Field>
          <Field label="Type">
            {choice(organizationTypes, p.organizationType)}
          </Field>
          <Field label="Legal name">{textOrEmpty(p.legalName)}</Field>
          <Field label="Registration no.">
            {textOrEmpty(p.registrationNumber)}
          </Field>
          <Field label="Founded">{textOrEmpty(p.yearFounded)}</Field>
          <Field label="Team size">{choice(teamSizes, p.teamSize)}</Field>
          <Field label="Annual budget">
            {choice(budgetRanges, p.annualBudget)}
          </Field>
          <Field label="Industry">{textOrEmpty(p.industry)}</Field>
          <Field label="Created">{formatDate(view.createdAt)}</Field>
        </dl>
      </AppCard>

      <AppCard title="Contact & location" actions={edit('contact')}>
        <dl className="divide-y divide-border">
          <Field label="Website">
            {p.website ? (
              <a
                href={p.website}
                target="_blank"
                rel="noreferrer"
                className="text-primary hover:underline"
              >
                {p.website}
              </a>
            ) : (
              empty
            )}
          </Field>
          <Field label="Contact email">{textOrEmpty(p.contactEmail)}</Field>
          <Field label="Phone">{textOrEmpty(p.phone)}</Field>
          <Field label="Country">{choice(countryOptions(), p.country)}</Field>
          <Field label="City">{textOrEmpty(p.city)}</Field>
          <Field label="Address">{textOrEmpty(p.address)}</Field>
        </dl>
      </AppCard>

      <AppCard
        title="About & impact"
        description="Agents read this to judge whether an opportunity fits."
        actions={edit('about')}
      >
        <dl className="divide-y divide-border">
          <Field label="What you do">{textOrEmpty(p.description)}</Field>
          <Field label="Mission">{textOrEmpty(p.mission)}</Field>
          <Field label="Vision">{textOrEmpty(p.vision)}</Field>
          <Field label="Programs & services">{textOrEmpty(p.offerings)}</Field>
          <Field label="Who you serve">
            {textOrEmpty(p.targetBeneficiaries)}
          </Field>
          <Field label="Track record">{textOrEmpty(p.trackRecord)}</Field>
          <Field label="Past funders">{textOrEmpty(p.pastFunding)}</Field>
        </dl>
      </AppCard>

      <AppCard title="Focus areas" actions={edit('areas')}>
        <dl className="divide-y divide-border">
          <Field label="Sectors">
            <Chips values={p.sectors} list={SECTORS} />
          </Field>
          <Field label="SDGs">
            <Chips values={p.sdgs.map(String)} list={sdgOptions} />
          </Field>
          <Field label="Countries">
            <Chips values={p.operatingCountries} list={countryOptions()} />
          </Field>
          <Field label="Languages">
            <Chips values={p.languages} list={languageOptions} />
          </Field>
        </dl>
      </AppCard>

      {sheet && (
        <EditSheet<OrgProfileFormInput, OrgProfileForm>
          open
          onClose={() => setEditing(null)}
          title={`Edit ${sheet.title.toLowerCase()}`}
          description="Agents use the updated profile from their next run."
          fields={sheet.fields}
          required={sheet.required}
          resolver={orgProfileFormResolver}
          values={pick(p, sheet.fields) as DefaultValues<OrgProfileFormInput>}
          onSave={(values) => update.mutateAsync(values)}
          pending={update.isPending}
        />
      )}
    </div>
  );
}

// ---- Preferences ----------------------------------------------------------------

const preferenceFields = [
  'opportunityTypes', 'geographicScopes', 'targetRegions', 'targetCountries',
  'focusAreas', 'keywords', 'excludedKeywords', 'preferredFunders', 'excludedFunders',
  'eligibility', 'minFundingAmount', 'maxFundingAmount', 'fundingCurrency',
  'openToPartnerships', 'canProvideCofunding', 'eligibilityNotes', 'additionalContext',
] as const; // prettier-ignore

const formValues = (prefs: PreferencesView): PreferencesForm =>
  Object.fromEntries(
    preferenceFields.map((key) => [key, prefs[key]])
  ) as PreferencesForm;

const money = (prefs: PreferencesView) => {
  const {
    minFundingAmount: min,
    maxFundingAmount: max,
    fundingCurrency: cur,
  } = prefs;
  const fmt = (n: number) => `${cur} ${n.toLocaleString('en')}`;
  if (min == null && max == null) return empty;
  if (min != null && max != null) return `${fmt(min)} – ${fmt(max)}`;
  return min != null ? `From ${fmt(min)}` : `Up to ${fmt(max!)}`;
};

export function PreferencesTab({
  editing,
  setEditing,
}: Readonly<EditingProps>) {
  const { view, preferences: prefs } = useOrg();
  const update = useUpdatePreferences(view.id);
  const canEdit = view.myRole === 'admin' && !view.isArchived;

  return (
    <>
      <AppCard
        title="What you’re looking for"
        description="Agents search and score against these."
        actions={
          canEdit && <EditButton onClick={() => setEditing('preferences')} />
        }
      >
        <dl className="divide-y divide-border">
          <Field label="Opportunity types">
            <Chips values={prefs.opportunityTypes} list={opportunityKinds} />
          </Field>
          <Field label="Scope">
            <Chips values={prefs.geographicScopes} list={geographicScopes} />
          </Field>
          <Field label="Regions">
            <Chips values={prefs.targetRegions} list={targetRegions} />
          </Field>
          <Field label="Countries">
            <Chips values={prefs.targetCountries} list={countryOptions()} />
          </Field>
          <Field label="Focus areas">
            <Chips values={prefs.focusAreas} />
          </Field>
          <Field label="Keywords">
            <Chips values={prefs.keywords} />
          </Field>
          <Field label="Avoid keywords">
            <Chips values={prefs.excludedKeywords} />
          </Field>
          <Field label="Preferred funders">
            <Chips values={prefs.preferredFunders} />
          </Field>
          <Field label="Avoid funders">
            <Chips values={prefs.excludedFunders} />
          </Field>
          <Field label="Eligibility">
            <Chips values={prefs.eligibility} list={eligibilityOptions} />
          </Field>
          <Field label="Funding range">{money(prefs)}</Field>
          <Field label="Partnerships">
            {prefs.openToPartnerships
              ? 'Open to partnerships'
              : 'Not looking for partners'}
          </Field>
          <Field label="Co-funding">
            {prefs.canProvideCofunding
              ? 'Can provide co-funding'
              : 'Can’t provide co-funding'}
          </Field>
          <Field label="Eligibility notes">
            {textOrEmpty(prefs.eligibilityNotes)}
          </Field>
          <Field label="Other context">
            {textOrEmpty(prefs.additionalContext)}
          </Field>
        </dl>
      </AppCard>

      {editing === 'preferences' && (
        <EditSheet<PreferencesFormInput, PreferencesForm>
          open
          onClose={() => setEditing(null)}
          title="Edit preferences"
          description="Changes apply to your agents’ next runs."
          fields={preferenceFields}
          required={['opportunityTypes', 'geographicScopes']}
          resolver={preferencesFormResolver}
          values={formValues(prefs) as DefaultValues<PreferencesFormInput>}
          onSave={(values) => update.mutateAsync(values)}
          pending={update.isPending}
        />
      )}
    </>
  );
}
