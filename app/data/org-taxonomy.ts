/**
 * Organization setup vocabularies, verbatim from the backend
 * (`leadline_backend/apps/organizations/choices.py`). Values are what the API
 * stores; labels are what it displays. Extend them there first.
 */
import type { Option } from './taxonomy';
import type { OpportunityType } from '~/lib/schema/opportunity.schema';

export const organizationTypes = [
  { value: 'ngo', label: 'Non-profit / NGO' },
  { value: 'community_based', label: 'Community-based organization' },
  { value: 'social_enterprise', label: 'Social enterprise' },
  { value: 'startup', label: 'Startup' },
  { value: 'sme', label: 'Small or medium enterprise' },
  { value: 'corporate', label: 'Large company' },
  { value: 'cooperative', label: 'Cooperative' },
  { value: 'academic', label: 'University or research institution' },
  { value: 'government', label: 'Government agency' },
  { value: 'foundation', label: 'Foundation' },
  { value: 'faith_based', label: 'Faith-based organization' },
  { value: 'individual', label: 'Individual / sole proprietor' },
  { value: 'other', label: 'Other' },
] as const satisfies readonly Option[];

export const teamSizes = [
  { value: '1-10', label: '1–10' },
  { value: '11-50', label: '11–50' },
  { value: '51-200', label: '51–200' },
  { value: '201-500', label: '201–500' },
  { value: '501-1000', label: '501–1,000' },
  { value: '1000+', label: 'More than 1,000' },
] as const satisfies readonly Option[];

/** Annual budget or revenue, in US dollars. */
export const budgetRanges = [
  { value: 'under_10k', label: 'Under $10k' },
  { value: '10k_50k', label: '$10k–$50k' },
  { value: '50k_250k', label: '$50k–$250k' },
  { value: '250k_1m', label: '$250k–$1M' },
  { value: '1m_5m', label: '$1M–$5M' },
  { value: 'over_5m', label: 'Over $5M' },
] as const satisfies readonly Option[];

export const opportunityKinds = [
  { value: 'grant', label: 'Grant' },
  { value: 'tender', label: 'Tender / procurement' },
  { value: 'rfp', label: 'Request for proposals' },
  { value: 'fellowship', label: 'Fellowship' },
  { value: 'scholarship', label: 'Scholarship' },
  { value: 'accelerator', label: 'Accelerator / incubator' },
  { value: 'competition', label: 'Competition / challenge' },
  { value: 'award', label: 'Award / prize' },
  { value: 'investment', label: 'Equity investment' },
  { value: 'loan', label: 'Loan / debt financing' },
  { value: 'partnership', label: 'Partnership' },
  { value: 'consultancy', label: 'Consultancy' },
  { value: 'sponsorship', label: 'Sponsorship' },
  { value: 'in_kind', label: 'In-kind support' },
  { value: 'conference', label: 'Conference / event' },
  { value: 'other', label: 'Other' },
] as const satisfies readonly Option[];

export const geographicScopes = [
  { value: 'local', label: 'Local (city or county)' },
  { value: 'national', label: 'National' },
  { value: 'regional', label: 'Regional (multi-country)' },
  { value: 'international', label: 'International / global' },
] as const satisfies readonly Option[];

export const targetRegions = [
  { value: 'east_africa', label: 'East Africa' },
  { value: 'west_africa', label: 'West Africa' },
  { value: 'central_africa', label: 'Central Africa' },
  { value: 'southern_africa', label: 'Southern Africa' },
  { value: 'north_africa', label: 'North Africa' },
  { value: 'sub_saharan_africa', label: 'Sub-Saharan Africa' },
  { value: 'africa', label: 'Africa (continent-wide)' },
  { value: 'middle_east', label: 'Middle East' },
  { value: 'europe', label: 'Europe' },
  { value: 'north_america', label: 'North America' },
  { value: 'latin_america', label: 'Latin America & Caribbean' },
  { value: 'south_asia', label: 'South Asia' },
  { value: 'east_asia', label: 'East & Southeast Asia' },
  { value: 'oceania', label: 'Oceania' },
  { value: 'global', label: 'Global' },
] as const satisfies readonly Option[];

/** Facts funders commonly filter on. Pick all that apply. */
export const eligibilityOptions = [
  { value: 'registered_nonprofit', label: 'Registered non-profit' },
  { value: 'registered_company', label: 'Registered company' },
  { value: 'tax_exempt', label: 'Tax-exempt status' },
  { value: 'women_led', label: 'Women-led' },
  { value: 'youth_led', label: 'Youth-led' },
  { value: 'disability_led', label: 'Led by persons with disabilities' },
  { value: 'minority_led', label: 'Minority- or indigenous-led' },
  { value: 'refugee_led', label: 'Refugee-led' },
  { value: 'rural_based', label: 'Rural-based' },
  { value: 'early_stage', label: 'Early-stage (under 3 years)' },
  { value: 'audited_accounts', label: 'Has audited accounts' },
] as const satisfies readonly Option[];

export const linkKinds = [
  { value: 'website', label: 'Website' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'x', label: 'X (Twitter)' },
  { value: 'facebook', label: 'Facebook' },
  { value: 'instagram', label: 'Instagram' },
  { value: 'youtube', label: 'YouTube' },
  { value: 'github', label: 'GitHub' },
  { value: 'blog', label: 'Blog / news' },
  { value: 'portfolio', label: 'Portfolio / case studies' },
  { value: 'other', label: 'Other' },
] as const satisfies readonly Option[];

export const documentCategories = [
  { value: 'company_profile', label: 'Company / organization profile' },
  { value: 'registration', label: 'Registration or legal certificate' },
  { value: 'strategy', label: 'Strategic plan' },
  { value: 'annual_report', label: 'Annual or impact report' },
  { value: 'financial', label: 'Financial statements / budget' },
  { value: 'proposal', label: 'Past proposal or application' },
  { value: 'pitch_deck', label: 'Pitch deck' },
  { value: 'case_study', label: 'Case study / project report' },
  { value: 'policy', label: 'Policy document' },
  { value: 'cv', label: 'Team CVs / bios' },
  { value: 'other', label: 'Other' },
] as const satisfies readonly Option[];

/** UN Sustainable Development Goals; the API stores the number. */
export const sdgOptions = [
  'No poverty',
  'Zero hunger',
  'Good health and well-being',
  'Quality education',
  'Gender equality',
  'Clean water and sanitation',
  'Affordable and clean energy',
  'Decent work and economic growth',
  'Industry, innovation and infrastructure',
  'Reduced inequalities',
  'Sustainable cities and communities',
  'Responsible consumption and production',
  'Climate action',
  'Life below water',
  'Life on land',
  'Peace, justice and strong institutions',
  'Partnerships for the goals',
].map((label, i) => ({ value: String(i + 1), label: `${i + 1}. ${label}` }));

export const documentExtensions = [
  '.pdf', '.doc', '.docx', '.odt', '.rtf', '.txt', '.md',
  '.xls', '.xlsx', '.ods', '.csv',
  '.ppt', '.pptx', '.odp',
  '.png', '.jpg', '.jpeg',
] as const; // prettier-ignore
export const documentMaxMb = 25;

// ISO 3166-1 alpha-2. Names come from the browser (`Intl.DisplayNames`).
const countryCodes =
  'AD AE AF AG AI AL AM AO AQ AR AS AT AU AW AX AZ BA BB BD BE BF BG BH BI BJ BL BM BN BO BQ BR BS BT BV BW BY BZ CA CC CD CF CG CH CI CK CL CM CN CO CR CU CV CW CX CY CZ DE DJ DK DM DO DZ EC EE EG EH ER ES ET FI FJ FK FM FO FR GA GB GD GE GF GG GH GI GL GM GN GP GQ GR GS GT GU GW GY HK HM HN HR HT HU ID IE IL IM IN IO IQ IR IS IT JE JM JO JP KE KG KH KI KM KN KP KR KW KY KZ LA LB LC LI LK LR LS LT LU LV LY MA MC MD ME MF MG MH MK ML MM MN MO MP MQ MR MS MT MU MV MW MX MY MZ NA NC NE NF NG NI NL NO NP NR NU NZ OM PA PE PF PG PH PK PL PM PN PR PS PT PW PY QA RE RO RS RU RW SA SB SC SD SE SG SH SI SJ SK SL SM SN SO SR SS ST SV SX SY SZ TC TD TF TG TH TJ TK TL TM TN TO TR TT TV TW TZ UA UG UM US UY UZ VA VC VE VG VI VN VU WF WS YE YT ZA ZM ZW'.split(
    ' '
  );

let countries: Option[] | undefined;

/** Every country, by name. Computed once. */
export function countryOptions(): Option[] {
  if (!countries) {
    const names = new Intl.DisplayNames(['en'], { type: 'region' });
    countries = countryCodes
      .map((value) => ({
        value,
        label: names.of(value) ?? value,
      }))
      .sort((a, b) => a.label.localeCompare(b.label));
  }
  return countries;
}

const languageCodes =
  'en fr ar pt sw es am ha yo ig zu xh af so om ti rw rn lg ln wo ff ny sn st tn mg de it zh hi ru'.split(
    ' '
  );

export const languageOptions: Option[] = (() => {
  const names = new Intl.DisplayNames(['en'], { type: 'language' });
  return languageCodes
    .map((value) => ({
      value,
      label: names.of(value) ?? value,
    }))
    .sort((a, b) => a.label.localeCompare(b.label));
})();

// ---- Bridges to the legacy UI vocabulary -----------------------------------
// The feed, agent forms and `MyOrg` speak four feed types and kebab-case regions.

const feedTypeOf: Record<string, OpportunityType> = {
  grant: 'grant',
  fellowship: 'grant',
  scholarship: 'grant',
  investment: 'grant',
  loan: 'grant',
  sponsorship: 'grant',
  in_kind: 'grant',
  tender: 'tender',
  rfp: 'tender',
  consultancy: 'tender',
  partnership: 'partnership',
  accelerator: 'partnership',
  conference: 'event',
  award: 'event',
  competition: 'event',
};

export function toFeedTypes(kinds: readonly string[]): OpportunityType[] {
  return [...new Set(kinds.flatMap((kind) => feedTypeOf[kind] ?? []))];
}

const legacyRegionOf: Record<string, string> = {
  east_africa: 'east-africa',
  west_africa: 'west-africa',
  central_africa: 'central-africa',
  southern_africa: 'southern-africa',
  north_africa: 'north-africa',
  sub_saharan_africa: 'pan-africa',
  africa: 'pan-africa',
  global: 'global',
};

export function toLegacyRegions(regions: readonly string[]): string[] {
  return [
    ...new Set(regions.flatMap((region) => legacyRegionOf[region] ?? [])),
  ];
}
