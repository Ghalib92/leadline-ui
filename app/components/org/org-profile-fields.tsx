import type { ReactNode } from 'react';
import {
  useFormContext,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import {
  budgetRanges,
  eligibilityOptions,
  geographicScopes,
  goalOptions,
  languageOptions,
  opportunityKinds,
  organizationTypes,
  sdgOptions,
  targetRegions,
  teamSizes,
  countryOptions,
} from '~/data/org-taxonomy';
import { SECTORS } from '~/data/taxonomy';
import {
  FormNumberField,
  FormPickerField,
  FormSwitchField,
  FormTagInputField,
  FormTextareaField,
  FormTextField,
} from '~/components/form-fields';

/**
 * Every organization-setup field, by form name. Onboarding steps and each
 * Settings section render the subset they edit with `<OrgFields names=[…] />`,
 * so a field looks and validates the same everywhere.
 */
type Render = (control: Control<FieldValues>, required: boolean) => ReactNode;

const multi = { multi: true as const, optionStyle: 'checkbox' as const };

const fieldRenderers: Record<string, Render> = {
  // Identity
  name: (c, r) => (
    <FormTextField
      control={c}
      name="name"
      autoComplete="organization"
      label="Organization name"
      placeholder="Kijani Health"
      required={r}
    />
  ),
  organizationType: (c, r) => (
    <FormPickerField
      control={c}
      name="organizationType"
      label="Organization type"
      options={organizationTypes}
      placeholder="What kind of organization?"
      required={r}
    />
  ),
  legalName: (c) => (
    <FormTextField
      control={c}
      name="legalName"
      autoComplete="organization"
      label="Registered legal name"
      placeholder="If different from your name, e.g. Kijani Health Trust Ltd"
    />
  ),
  registrationNumber: (c) => (
    <FormTextField
      control={c}
      name="registrationNumber"
      autoComplete="off"
      placeholder="e.g. OP.218/051/19-0123"
      label="Registration number"
    />
  ),
  yearFounded: (c) => (
    <FormNumberField
      autoComplete="off"
      control={c}
      name="yearFounded"
      label="Year founded"
      placeholder="e.g. 2019"
      min={1800}
      max={new Date().getFullYear()}
    />
  ),
  teamSize: (c) => (
    <FormPickerField
      control={c}
      name="teamSize"
      placeholder="How many people?"
      label="Team size"
      options={teamSizes}
      searchable={false}
    />
  ),
  annualBudget: (c) => (
    <FormPickerField
      control={c}
      name="annualBudget"
      placeholder="Roughly, in US dollars"
      label="Annual budget (USD)"
      options={budgetRanges}
      searchable={false}
    />
  ),
  industry: (c) => (
    <FormTextField
      control={c}
      name="industry"
      autoComplete="off"
      label="Industry"
      placeholder="e.g. Public health"
    />
  ),

  // Contact & location
  website: (c) => (
    <FormTextField
      control={c}
      name="website"
      autoComplete="url"
      label="Website"
      type="url"
      placeholder="https://example.org"
    />
  ),
  contactEmail: (c) => (
    <FormTextField
      control={c}
      name="contactEmail"
      autoComplete="email"
      label="Contact email"
      type="email"
      placeholder="hello@example.org"
    />
  ),
  phone: (c) => (
    <FormTextField
      control={c}
      name="phone"
      autoComplete="tel"
      label="Phone"
      placeholder="+254 700 000 000"
    />
  ),
  country: (c, r) => (
    <FormPickerField
      control={c}
      name="country"
      label="Headquarters country"
      options={countryOptions()}
      placeholder="Where are you based?"
      required={r}
    />
  ),
  city: (c) => (
    <FormTextField
      control={c}
      name="city"
      autoComplete="address-level2"
      placeholder="e.g. Nairobi"
      label="City"
    />
  ),
  address: (c) => (
    <FormTextareaField
      control={c}
      name="address"
      autoComplete="street-address"
      placeholder="Street, building, P.O. Box"
      label="Address"
      rows={2}
    />
  ),

  // About & impact — the context agents read.
  description: (c, r) => (
    <FormTextareaField
      control={c}
      name="description"
      autoComplete="off"
      label="What your organization does"
      placeholder="What your organization does, in a sentence or two"
      rows={3}
      required={r}
    />
  ),
  mission: (c, r) => (
    <FormTextareaField
      control={c}
      name="mission"
      autoComplete="off"
      placeholder="e.g. Safe water within 1 km of every home in Kitui"
      label="Mission"
      rows={3}
      required={r}
    />
  ),
  vision: (c) => (
    <FormTextareaField
      control={c}
      name="vision"
      autoComplete="off"
      placeholder="The change you want to see in 10 years"
      label="Vision"
      rows={3}
    />
  ),
  offerings: (c) => (
    <FormTextareaField
      control={c}
      name="offerings"
      autoComplete="off"
      placeholder="Programs, products or services you run"
      label="Programs, products and services"
      rows={3}
    />
  ),
  targetBeneficiaries: (c) => (
    <FormTextareaField
      control={c}
      name="targetBeneficiaries"
      autoComplete="off"
      placeholder="e.g. Rural women and girls in arid counties"
      label="Who you serve"
      rows={3}
    />
  ),
  trackRecord: (c) => (
    <FormTextareaField
      control={c}
      name="trackRecord"
      autoComplete="off"
      label="Track record"
      placeholder="Results so far — numbers help"
      rows={3}
    />
  ),
  pastFunding: (c) => (
    <FormTextareaField
      control={c}
      name="pastFunding"
      autoComplete="off"
      placeholder="e.g. USAID (2022), Safaricom Foundation (2024)"
      label="Past funders and partners"
      rows={3}
    />
  ),

  // Focus
  sectors: (c, r) => (
    <FormPickerField
      control={c}
      name="sectors"
      placeholder="Choose the sectors you work in"
      label="Sectors"
      options={SECTORS}
      required={r}
      {...multi}
    />
  ),
  sdgs: (c) => (
    <FormPickerField
      control={c}
      name="sdgs"
      placeholder="Choose the goals your work supports"
      label="Sustainable Development Goals"
      options={sdgOptions}
      valueAs="number"
      {...multi}
    />
  ),
  operatingCountries: (c) => (
    <FormPickerField
      control={c}
      name="operatingCountries"
      placeholder="Choose countries"
      label="Countries you work in"
      options={countryOptions()}
      {...multi}
    />
  ),
  languages: (c) => (
    <FormPickerField
      control={c}
      name="languages"
      placeholder="Choose languages"
      label="Working languages"
      options={languageOptions}
      {...multi}
    />
  ),

  // Opportunity preferences
  goals: (c, r) => (
    <FormPickerField
      control={c}
      name="goals"
      placeholder="Clients, tenders, grants…"
      label="What do you want to find?"
      description="Each worker you set up looks for one of these."
      options={goalOptions}
      searchable={false}
      required={r}
      {...multi}
    />
  ),
  opportunityTypes: (c, r) => (
    <FormPickerField
      control={c}
      name="opportunityTypes"
      placeholder="What should agents look for?"
      label="Opportunity types"
      options={opportunityKinds}
      required={r}
      {...multi}
    />
  ),
  geographicScopes: (c, r) => (
    <FormPickerField
      control={c}
      name="geographicScopes"
      placeholder="Local, national, regional…"
      label="Geographic scope"
      options={geographicScopes}
      searchable={false}
      required={r}
      {...multi}
    />
  ),
  targetRegions: (c) => (
    <FormPickerField
      control={c}
      name="targetRegions"
      placeholder="Choose regions"
      label="Target regions"
      options={targetRegions}
      {...multi}
    />
  ),
  targetCountries: (c) => (
    <FormPickerField
      control={c}
      name="targetCountries"
      placeholder="Choose countries"
      label="Target countries"
      options={countryOptions()}
      {...multi}
    />
  ),
  focusAreas: (c) => (
    <FormTagInputField
      control={c}
      name="focusAreas"
      label="Focus areas"
      placeholder="e.g. maternal health, then Enter"
      maxTags={50}
    />
  ),
  keywords: (c) => (
    <FormTagInputField
      control={c}
      name="keywords"
      label="Keywords to look for"
      placeholder="e.g. borehole, then Enter"
      maxTags={100}
    />
  ),
  excludedKeywords: (c) => (
    <FormTagInputField
      control={c}
      name="excludedKeywords"
      label="Keywords to avoid"
      placeholder="e.g. loan, then Enter"
      maxTags={100}
    />
  ),
  preferredFunders: (c) => (
    <FormTagInputField
      control={c}
      name="preferredFunders"
      placeholder="e.g. Gates Foundation, then Enter"
      label="Preferred funders"
      maxTags={50}
    />
  ),
  excludedFunders: (c) => (
    <FormTagInputField
      control={c}
      name="excludedFunders"
      placeholder="Funder name, then Enter"
      label="Funders to avoid"
      maxTags={50}
    />
  ),
  eligibility: (c) => (
    <FormPickerField
      control={c}
      name="eligibility"
      placeholder="Choose what applies to you"
      label="Eligibility facts"
      options={eligibilityOptions}
      {...multi}
    />
  ),
  minFundingAmount: (c) => (
    <FormNumberField
      autoComplete="off"
      control={c}
      name="minFundingAmount"
      placeholder="e.g. 10000"
      label="Minimum funding"
      min={0}
    />
  ),
  maxFundingAmount: (c) => (
    <FormNumberField
      autoComplete="off"
      control={c}
      name="maxFundingAmount"
      placeholder="e.g. 250000"
      label="Maximum funding"
      min={0}
    />
  ),
  fundingCurrency: (c) => (
    <FormTextField
      control={c}
      name="fundingCurrency"
      autoComplete="off"
      label="Currency"
      placeholder="USD"
    />
  ),
  openToPartnerships: (c) => (
    <FormSwitchField
      control={c}
      name="openToPartnerships"
      label="Open to partnerships"
      description="Show consortium and co-applicant opportunities."
    />
  ),
  canProvideCofunding: (c) => (
    <FormSwitchField
      control={c}
      name="canProvideCofunding"
      label="Can provide co-funding"
      description="Include opportunities that require matched funds."
    />
  ),
  eligibilityNotes: (c) => (
    <FormTextareaField
      control={c}
      name="eligibilityNotes"
      autoComplete="off"
      placeholder="Anything funders should know about your eligibility"
      label="Eligibility notes"
      rows={3}
    />
  ),
  additionalContext: (c) => (
    <FormTextareaField
      control={c}
      name="additionalContext"
      autoComplete="off"
      placeholder="Priorities, constraints, timing…"
      label="Anything else agents should know"
      rows={3}
    />
  ),
};

/** Fields laid out two-up on wider screens (short inputs). */
const halfWidth = new Set([
  'organizationType', 'yearFounded', 'teamSize', 'annualBudget', 'registrationNumber',
  'phone', 'city', 'contactEmail', 'minFundingAmount', 'maxFundingAmount', 'fundingCurrency',
]); // prettier-ignore

export function OrgFields({
  names,
  required = [],
}: Readonly<{ names: readonly string[]; required?: readonly string[] }>) {
  const { control } = useFormContext<FieldValues>();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {names.map((name) => (
        <div
          key={name}
          className={halfWidth.has(name) ? undefined : 'sm:col-span-2'}
        >
          {fieldRenderers[name]?.(control, required.includes(name))}
        </div>
      ))}
    </div>
  );
}
