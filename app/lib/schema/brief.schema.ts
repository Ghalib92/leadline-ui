import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  businessCategories,
  businessSizes,
  buyerTypes,
  employmentTypeOptions,
  leadSignals,
  seniorityOptions,
  workplaceOptions,
  tenderCategories,
  tenderEligibilityOptions,
} from '~/data/org-taxonomy';
import { enumValues } from '~/data/taxonomy';

/**
 * A brief per goal (`/organizations/:id/client-brief/`, `…/tender-brief/`):
 * what the organization sells and to whom, and what it bids for. Grant
 * preferences stay in `organization.schema.ts`. Workers of each goal search
 * with its brief.
 */

const list = <T extends z.ZodType>(item: T) => z.array(item).default([]);
const text = z.string().default('');
const tags = (max: number) =>
  z.array(z.string().trim().min(1).max(100)).max(max);
const countries = z.array(z.string().regex(/^[A-Z]{2}$/)).max(250);
const longText = z.string().trim().max(5000, 'Keep it under 5,000 characters');
/** Number inputs write `''` when cleared: that means "no value". */
const amount = z.preprocess(
  (v) => (v === '' || v === undefined ? null : v),
  z.number().min(0, 'Must be 0 or more').nullable()
);
const money = z
  .union([z.string(), z.number()])
  .nullable()
  .default(null)
  .transform((v) => (v === null || v === '' ? null : Number(v)));

const snake = (key: string) =>
  key.replace(/[A-Z]/g, (c) => `_${c.toLowerCase()}`);

/** Only the keys given, snake-cased (renamed where the form's name differs). */
const toWrite = (form: object, renames: Record<string, string> = {}) =>
  Object.fromEntries(
    Object.entries(form)
      .filter(([, value]) => value !== undefined)
      .map(([key, value]) => [renames[key] ?? snake(key), value])
  );

// ---- Clients brief -----------------------------------------------------------

/** Something the organization sells; the price is free text. */
export const serviceSchema = z.object({
  name: z.string().trim().min(1, 'Name the service').max(120),
  description: z.string().trim().max(1000),
  price: z.string().trim().max(120),
});
export type Service = z.infer<typeof serviceSchema>;

export const clientBriefDtoSchema = z
  .object({
    services: list(
      z.object({
        name: z.string(),
        description: text,
        price: text,
      })
    ),
    customer_types: list(z.string()),
    customer_keywords: list(z.string()),
    customer_sizes: list(z.string()),
    target_countries: list(z.string()),
    target_cities: list(z.string()),
    signals: list(z.string()),
    excluded_keywords: list(z.string()),
    notes: text,
  })
  .transform((dto) => ({
    services: dto.services,
    customerTypes: dto.customer_types,
    customerKeywords: dto.customer_keywords,
    customerSizes: dto.customer_sizes,
    targetCountries: dto.target_countries,
    targetCities: dto.target_cities,
    signals: dto.signals,
    excludedKeywords: dto.excluded_keywords,
    notes: dto.notes,
  }));
export type ClientBrief = z.infer<typeof clientBriefDtoSchema>;

export const clientBriefFormSchema = z
  .object({
    services: z.array(serviceSchema).max(20, 'Add up to 20 services'),
    customerTypes: z.array(z.enum(enumValues(businessCategories))),
    customerKeywords: tags(50),
    customerSizes: z.array(z.enum(enumValues(businessSizes))),
    targetCountries: countries,
    targetCities: tags(50),
    signals: z.array(z.enum(enumValues(leadSignals))),
    excludedKeywords: tags(100),
    notes: longText,
  })
  .partial();
export type ClientBriefForm = z.infer<typeof clientBriefFormSchema>;
export type ClientBriefFormInput = z.input<typeof clientBriefFormSchema>;
export const clientBriefFormResolver = zodResolver(clientBriefFormSchema);

export const toClientBriefWrite = (form: ClientBriefForm) => toWrite(form);

// ---- Tenders brief -----------------------------------------------------------

export const tenderBriefDtoSchema = z
  .object({
    categories: list(z.string()),
    keywords: list(z.string()),
    excluded_keywords: list(z.string()),
    buyer_types: list(z.string()),
    target_countries: list(z.string()),
    min_value: money,
    max_value: money,
    currency: z.string().default('USD'),
    eligibility: list(z.string()),
    certifications: list(z.string()),
    capacity_notes: text,
  })
  .transform((dto) => ({
    tenderCategories: dto.categories,
    keywords: dto.keywords,
    excludedKeywords: dto.excluded_keywords,
    buyerTypes: dto.buyer_types,
    targetCountries: dto.target_countries,
    minValue: dto.min_value,
    maxValue: dto.max_value,
    currency: dto.currency,
    tenderEligibility: dto.eligibility,
    certifications: dto.certifications,
    capacityNotes: dto.capacity_notes,
  }));
export type TenderBrief = z.infer<typeof tenderBriefDtoSchema>;

export const tenderBriefFormSchema = z
  .object({
    tenderCategories: z.array(z.enum(enumValues(tenderCategories))),
    keywords: tags(100),
    excludedKeywords: tags(100),
    buyerTypes: z.array(z.enum(enumValues(buyerTypes))),
    targetCountries: countries,
    minValue: amount,
    maxValue: amount,
    currency: z
      .string()
      .regex(/^[A-Za-z]{3}$/, 'Use a 3-letter code, e.g. KES'),
    tenderEligibility: z.array(z.enum(enumValues(tenderEligibilityOptions))),
    certifications: tags(50),
    capacityNotes: longText,
  })
  .partial()
  .refine(
    (v) => v.minValue == null || v.maxValue == null || v.minValue <= v.maxValue,
    {
      message: 'Must be greater than or equal to the minimum.',
      path: ['maxValue'],
    }
  );
export type TenderBriefForm = z.infer<typeof tenderBriefFormSchema>;
export type TenderBriefFormInput = z.input<typeof tenderBriefFormSchema>;
export const tenderBriefFormResolver = zodResolver(tenderBriefFormSchema);

export const toTenderBriefWrite = (form: TenderBriefForm) => {
  const body = toWrite(form, {
    tenderCategories: 'categories',
    tenderEligibility: 'eligibility',
  });
  if (typeof body.currency === 'string')
    body.currency = body.currency.toUpperCase();
  return body;
};

// ---- Job preferences (job seekers) -------------------------------------------

const cvRoleSchema = z.object({
  title: z.string(),
  employer: text,
  start: text,
  end: text,
  location: text,
  highlights: list(z.string()),
});

/** Everything the last read of the CV found ({} before it was read). */
const cvProfileDtoSchema = z
  .object({
    headline: text,
    summary: text,
    current_title: text,
    current_employer: text,
    location: text,
    looking_for: text,
    years_experience: z.number().nullable().default(null),
    seniority: list(z.string()),
    skills: list(z.string()),
    experience: list(cvRoleSchema).catch([]),
    education: list(
      z.object({ qualification: z.string(), institution: text, year: text })
    ).catch([]),
    certifications: list(z.string()),
    languages: list(z.string()),
    read_at: z.string().nullish(),
  })
  .partial()
  .nullish();

/** Whether the CV can be read again now: reads are limited (each costs tokens). */
const cvReadDtoSchema = z
  .object({
    blocked: z.enum(['', 'cooldown', 'daily']).catch(''),
    wait_seconds: z.number().default(0),
    next_read_at: z.string().nullish(),
    reads_today: z.number().default(0),
    reads_per_day: z.number().default(3),
    cooldown_minutes: z.number().default(10),
  })
  .nullish();

export const jobBriefDtoSchema = z
  .object({
    headline: text,
    target_roles: list(z.string()),
    seniority: list(z.string()),
    employment_types: list(z.string()),
    workplaces: list(z.string()),
    target_countries: list(z.string()),
    target_cities: list(z.string()),
    skills: list(z.string()),
    years_experience: z.number().nullable().default(null),
    salary_min: z.number().nullable().default(null),
    salary_currency: z.string().default('KES'),
    companies: list(z.string()),
    excluded_keywords: list(z.string()),
    notes: text,
    /** What reading the CV found ({} before it was read). */
    cv_suggestions: z
      .object({
        document_title: text,
        read_at: z.string().nullish(),
        filled: list(z.string()),
        target_roles: list(z.string()),
        skills: list(z.string()),
      })
      .partial()
      .nullish(),
    cv_profile: cvProfileDtoSchema,
    cv_read: cvReadDtoSchema,
  })
  .transform((dto) => ({
    headline: dto.headline,
    targetRoles: dto.target_roles,
    seniority: dto.seniority,
    employmentTypes: dto.employment_types,
    workplaces: dto.workplaces,
    targetCountries: dto.target_countries,
    targetCities: dto.target_cities,
    skills: dto.skills,
    yearsExperience: dto.years_experience,
    salaryMin: dto.salary_min,
    salaryCurrency: dto.salary_currency,
    companies: dto.companies,
    excludedKeywords: dto.excluded_keywords,
    notes: dto.notes,
    cvSuggestions: dto.cv_suggestions?.read_at
      ? {
          documentTitle: dto.cv_suggestions.document_title ?? '',
          readAt: dto.cv_suggestions.read_at,
          filled: dto.cv_suggestions.filled ?? [],
          targetRoles: dto.cv_suggestions.target_roles ?? [],
          skills: dto.cv_suggestions.skills ?? [],
        }
      : null,
    cvProfile: dto.cv_profile?.read_at
      ? {
          headline: dto.cv_profile.headline ?? '',
          summary: dto.cv_profile.summary ?? '',
          currentTitle: dto.cv_profile.current_title ?? '',
          currentEmployer: dto.cv_profile.current_employer ?? '',
          location: dto.cv_profile.location ?? '',
          lookingFor: dto.cv_profile.looking_for ?? '',
          yearsExperience: dto.cv_profile.years_experience ?? null,
          skills: dto.cv_profile.skills ?? [],
          experience: dto.cv_profile.experience ?? [],
          education: dto.cv_profile.education ?? [],
          certifications: dto.cv_profile.certifications ?? [],
          languages: dto.cv_profile.languages ?? [],
        }
      : null,
    cvRead: {
      blocked: dto.cv_read?.blocked ?? '',
      nextReadAt: dto.cv_read?.next_read_at ?? null,
      readsToday: dto.cv_read?.reads_today ?? 0,
      readsPerDay: dto.cv_read?.reads_per_day ?? 3,
      cooldownMinutes: dto.cv_read?.cooldown_minutes ?? 10,
    },
  }));
export type CvProfile = NonNullable<JobBrief['cvProfile']>;
export type JobBrief = z.infer<typeof jobBriefDtoSchema>;

export const jobBriefFormSchema = z
  .object({
    headline: z.string().trim().max(200),
    targetRoles: tags(50).min(1, 'Add at least one role'),
    seniority: z.array(z.enum(enumValues(seniorityOptions))),
    employmentTypes: z.array(z.enum(enumValues(employmentTypeOptions))),
    workplaces: z.array(z.enum(enumValues(workplaceOptions))),
    targetCountries: countries,
    targetCities: tags(50),
    skills: tags(100),
    yearsExperience: z.preprocess(
      (v) => (v === '' || v === undefined ? null : v),
      z.number().int().min(0).max(60).nullable()
    ),
    salaryMin: amount,
    salaryCurrency: z
      .string()
      .trim()
      .regex(/^[A-Za-z]{3}$/, 'Use a 3-letter code, e.g. KES'),
    companies: z
      .array(z.string().trim().min(1).max(300))
      .max(50, 'Follow up to 50 companies'),
    excludedKeywords: tags(100),
    notes: longText,
  })
  .partial();
export type JobBriefForm = z.infer<typeof jobBriefFormSchema>;
export type JobBriefFormInput = z.input<typeof jobBriefFormSchema>;
export const jobBriefFormResolver = zodResolver(jobBriefFormSchema);

export const toJobBriefWrite = (form: JobBriefForm) => toWrite(form);
