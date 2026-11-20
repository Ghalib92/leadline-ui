import type { ReactNode } from 'react';
import {
  useFormContext,
  type Control,
  type FieldValues,
} from 'react-hook-form';
import {
  budgetRanges,
  businessCategories,
  businessSizes,
  buyerTypes,
  leadSignals,
  tenderCategories,
  tenderEligibilityOptions,
  eligibilityOptions,
  geographicScopes,
  organizationGoalOptions,
  languageOptions,
  opportunityKinds,
  organizationTypes,
  sdgOptions,
  targetRegions,
  teamSizes,
  countryOptions,
  employmentTypeOptions,
  seniorityOptions,
  workplaceOptions,
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
import { ServicesField } from './services-field';

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
      description="Each search you set up looks for one of these."
      options={organizationGoalOptions}
      searchable={false}
      required={r}
      {...multi}
    />
  ),
  opportunityTypes: (c, r) => (
    <FormPickerField
      control={c}
      name="opportunityTypes"
      placeholder="What should Leadline look for?"
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
      label="Anything else Leadline should know"
      rows={3}
    />
  ),

  // Clients brief: what you sell and who to
  services: (c, r) => <ServicesField control={c} required={r} />,
  customerTypes: (c, r) => (
    <FormPickerField
      control={c}
      name="customerTypes"
      placeholder="Hotels, clinics, schools…"
      label="Kinds of customer"
      description="The businesses the AI should look for."
      options={businessCategories}
      required={r}
      {...multi}
    />
  ),
  customerKeywords: (c) => (
    <FormTagInputField
      control={c}
      name="customerKeywords"
      label="Describe them in your words"
      placeholder="e.g. boutique hotels, private clinics, then Enter"
      maxTags={50}
    />
  ),
  customerSizes: (c) => (
    <FormPickerField
      control={c}
      name="customerSizes"
      placeholder="Any size"
      label="Their size"
      options={businessSizes}
      searchable={false}
      {...multi}
    />
  ),
  targetCities: (c) => (
    <FormTagInputField
      control={c}
      name="targetCities"
      label="Cities or towns"
      placeholder="e.g. Nairobi, Mombasa, then Enter"
      maxTags={50}
    />
  ),
  signals: (c) => (
    <FormPickerField
      control={c}
      name="signals"
      placeholder="No website, no online booking…"
      label="Signs they need you"
      description="The AI checks each business for these and tells you what it found."
      options={leadSignals}
      searchable={false}
      {...multi}
    />
  ),
  notes: (c) => (
    <FormTextareaField
      control={c}
      name="notes"
      placeholder="Who you've worked with, what you won't do, how fast you deliver…"
      label="Anything else the AI should know"
      rows={3}
    />
  ),

  // Job preferences: what a job seeker looks for
  headline: (c) => (
    <FormTextField
      control={c}
      name="headline"
      autoComplete="off"
      label="Your headline"
      placeholder="e.g. Backend developer, 4 years of Python"
    />
  ),
  targetRoles: (c, r) => (
    <FormTagInputField
      control={c}
      name="targetRoles"
      label="Jobs you want"
      placeholder="e.g. Backend developer, then Enter"
      maxTags={50}
      required={r}
    />
  ),
  seniority: (c) => (
    <FormPickerField
      control={c}
      name="seniority"
      label="Level"
      placeholder="Any level"
      options={seniorityOptions}
      searchable={false}
      {...multi}
    />
  ),
  employmentTypes: (c) => (
    <FormPickerField
      control={c}
      name="employmentTypes"
      label="Kind of work"
      placeholder="Any"
      options={employmentTypeOptions}
      searchable={false}
      {...multi}
    />
  ),
  workplaces: (c) => (
    <FormPickerField
      control={c}
      name="workplaces"
      label="Where you work"
      placeholder="Remote, hybrid or on-site"
      options={workplaceOptions}
      searchable={false}
      {...multi}
    />
  ),
  skills: (c) => (
    <FormTagInputField
      control={c}
      name="skills"
      label="Your main skills"
      placeholder="e.g. Python, then Enter"
      maxTags={100}
    />
  ),
  yearsExperience: (c) => (
    <FormNumberField
      control={c}
      name="yearsExperience"
      label="Years of experience"
      placeholder="e.g. 4"
      min={0}
    />
  ),
  salaryMin: (c) => (
    <FormNumberField
      control={c}
      name="salaryMin"
      label="Lowest monthly salary"
      placeholder="e.g. 150000"
      min={0}
    />
  ),
  salaryCurrency: (c) => (
    <FormTextField
      control={c}
      name="salaryCurrency"
      autoComplete="off"
      label="Currency"
      placeholder="KES"
    />
  ),
  companies: (c) => (
    <FormTagInputField
      control={c}
      name="companies"
      label="Companies to follow"
      placeholder="Paste a careers page link (Greenhouse, Lever, Ashby, Workable), then Enter"
      maxTags={50}
    />
  ),

  // Tenders brief: what you bid for
  tenderCategories: (c, r) => (
    <FormPickerField
      control={c}
      name="tenderCategories"
      placeholder="Software, consultancy, supplies…"
      label="Kinds of tender"
      options={tenderCategories}
      required={r}
      {...multi}
    />
  ),
  buyerTypes: (c) => (
    <FormPickerField
      control={c}
      name="buyerTypes"
      placeholder="Any buyer"
      label="Who you sell to"
      options={buyerTypes}
      searchable={false}
      {...multi}
    />
  ),
  minValue: (c) => (
    <FormNumberField
      autoComplete="off"
      control={c}
      name="minValue"
      placeholder="e.g. 500000"
      label="Smallest contract"
      min={0}
    />
  ),
  maxValue: (c) => (
    <FormNumberField
      autoComplete="off"
      control={c}
      name="maxValue"
      placeholder="e.g. 20000000"
      label="Largest contract"
      min={0}
    />
  ),
  currency: (c) => (
    <FormTextField
      control={c}
      name="currency"
      autoComplete="off"
      label="Currency"
      placeholder="KES"
    />
  ),
  tenderEligibility: (c) => (
    <FormPickerField
      control={c}
      name="tenderEligibility"
      placeholder="AGPO, tax compliance…"
      label="What you qualify for"
      options={tenderEligibilityOptions}
      searchable={false}
      {...multi}
    />
  ),
  certifications: (c) => (
    <FormTagInputField
      control={c}
      name="certifications"
      label="Registrations & certifications"
      placeholder="e.g. ICTA 1, ISO 9001, NCA 4, then Enter"
      maxTags={50}
    />
  ),
  capacityNotes: (c) => (
    <FormTextareaField
      control={c}
      name="capacityNotes"
      placeholder="Team size, past contracts, how big a job you can deliver…"
      label="Your capacity"
      rows={3}
    />
  ),
};

/** Fields laid out two-up on wider screens (short inputs). */
const halfWidth = new Set([
  'organizationType', 'yearFounded', 'teamSize', 'annualBudget', 'registrationNumber',
  'phone', 'city', 'contactEmail', 'minFundingAmount', 'maxFundingAmount', 'fundingCurrency',
  'minValue', 'maxValue', 'currency',
]); // prettier-ignore

/** The same fields, worded for one person looking for a job. */
const personRenderers: Record<string, Render> = {
  name: (c, r) => (
    <FormTextField
      control={c}
      name="name"
      autoComplete="name"
      label="Full name"
      placeholder="Amina Otieno"
      required={r}
    />
  ),
  description: (c, r) => (
    <FormTextareaField
      control={c}
      name="description"
      autoComplete="off"
      label="About you"
      placeholder="e.g. Backend developer with 4 years of Python and Django, building payment systems."
      rows={3}
      required={r}
    />
  ),
  country: (c, r) => (
    <FormPickerField
      control={c}
      name="country"
      label="Country you live in"
      options={countryOptions()}
      placeholder="Choose a country"
      required={r}
    />
  ),
  website: (c) => (
    <FormTextField
      control={c}
      name="website"
      autoComplete="url"
      label="LinkedIn or portfolio link"
      type="url"
      placeholder="https://www.linkedin.com/in/your-name"
    />
  ),
  contactEmail: (c) => (
    <FormTextField
      control={c}
      name="contactEmail"
      autoComplete="email"
      label="Email for employers"
      type="email"
      placeholder="you@example.com"
    />
  ),
};

export function OrgFields({
  names,
  required = [],
  person = false,
}: Readonly<{
  names: readonly string[];
  required?: readonly string[];
  /** A job seeker's own profile: personal labels, not company ones. */
  person?: boolean;
}>) {
  const { control } = useFormContext<FieldValues>();
  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {names.map((name) => (
        <div
          key={name}
          className={halfWidth.has(name) ? undefined : 'sm:col-span-2'}
        >
          {((person && personRenderers[name]) || fieldRenderers[name])?.(
            control,
            required.includes(name)
          )}
        </div>
      ))}
    </div>
  );
}
