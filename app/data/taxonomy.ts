/**
 * Pick-list vocabularies. Schemas derive their enums from these lists and
 * pickers use them as options, so the UI and validation can't drift.
 */
export interface Option<V extends string = string> {
  readonly value: V;
  readonly label: string;
}

export const OPPORTUNITY_TYPES = [
  { value: 'grant', label: 'Grants & funding' },
  { value: 'tender', label: 'Tenders & RFPs' },
  { value: 'partnership', label: 'Partnerships' },
  { value: 'event', label: 'Events & awards' },
  { value: 'client', label: 'Client leads' },
  { value: 'job', label: 'Jobs' },
] as const satisfies readonly Option[];

export const ORG_TYPES = [
  { value: 'ngo', label: 'NGO / non-profit' },
  { value: 'startup', label: 'Startup' },
  { value: 'sme', label: 'Small or medium business' },
  { value: 'enterprise', label: 'Enterprise' },
  { value: 'government', label: 'Government agency' },
  { value: 'academic', label: 'University / research' },
] as const satisfies readonly Option[];

export const ORG_SIZES = [
  { value: '1-10', label: '1–10 people' },
  { value: '11-50', label: '11–50 people' },
  { value: '51-200', label: '51–200 people' },
  { value: '201-1000', label: '201–1,000 people' },
  { value: '1000+', label: '1,000+ people' },
] as const satisfies readonly Option[];

export const SECTORS = [
  { value: 'agriculture', label: 'Agriculture & food' },
  { value: 'climate', label: 'Climate & environment' },
  { value: 'education', label: 'Education' },
  { value: 'energy', label: 'Energy' },
  { value: 'fintech', label: 'Financial services' },
  { value: 'gender', label: 'Gender & inclusion' },
  { value: 'governance', label: 'Governance' },
  { value: 'health', label: 'Health' },
  { value: 'infrastructure', label: 'Infrastructure' },
  { value: 'technology', label: 'Technology & digital' },
  { value: 'wash', label: 'Water & sanitation' },
  { value: 'youth', label: 'Youth & jobs' },
] as const satisfies readonly Option[];

export const REGIONS = [
  { value: 'east-africa', label: 'East Africa' },
  { value: 'west-africa', label: 'West Africa' },
  { value: 'southern-africa', label: 'Southern Africa' },
  { value: 'central-africa', label: 'Central Africa' },
  { value: 'north-africa', label: 'North Africa' },
  { value: 'pan-africa', label: 'Pan-African' },
  { value: 'global', label: 'Global' },
] as const satisfies readonly Option[];

export const COUNTRIES = [
  { value: 'KE', label: 'Kenya' },
  { value: 'NG', label: 'Nigeria' },
  { value: 'GH', label: 'Ghana' },
  { value: 'ZA', label: 'South Africa' },
  { value: 'RW', label: 'Rwanda' },
  { value: 'UG', label: 'Uganda' },
  { value: 'TZ', label: 'Tanzania' },
  { value: 'ET', label: 'Ethiopia' },
  { value: 'EG', label: 'Egypt' },
  { value: 'SN', label: 'Senegal' },
  { value: 'CI', label: "Côte d'Ivoire" },
  { value: 'ZM', label: 'Zambia' },
  { value: 'OTHER', label: 'Other' },
] as const satisfies readonly Option[];

export const DEPARTMENTS = [
  { value: 'data-ai', label: 'Data & Artificial Intelligence' },
  { value: 'health', label: 'Global Health & Systems' },
  { value: 'climate-environment', label: 'Climate & Environment' },
  { value: 'me-research', label: 'Monitoring, Evaluation & Learning' },
  { value: 'governance-policy', label: 'Governance & Public Policy' },
  { value: 'partnerships-growth', label: 'Partnerships & Growth' },
  { value: 'engineering', label: 'Software Engineering' },
  { value: 'operations', label: 'Operations & Finance' },
] as const satisfies readonly Option[];

export const AVAILABILITY_STATUSES = [
  { value: 'available', label: 'Available for bids' },
  { value: 'busy', label: 'Partially committed' },
  { value: 'unavailable', label: 'Unavailable' },
] as const satisfies readonly Option[];

/** `z.enum` needs a non-empty tuple of the list's values. */
export function enumValues<const T extends readonly Option[]>(list: T) {
  return list.map((item) => item.value) as unknown as [
    T[number]['value'],
    ...T[number]['value'][],
  ];
}

export function labelOf(list: readonly Option[], value: string): string {
  return list.find((item) => item.value === value)?.label ?? value;
}

/** Where agents search. Built in — no integration needed. */
export const AGENT_SOURCES = [
  { value: 'web', label: 'Open web' },
  { value: 'grants', label: 'Grant databases' },
  { value: 'procurement', label: 'Procurement portals' },
  { value: 'news', label: 'News & announcements' },
  { value: 'businesses', label: 'Business directories' },
  { value: 'jobs', label: 'Career pages and job boards' },
];
