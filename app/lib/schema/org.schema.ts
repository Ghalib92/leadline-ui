import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { ORG_SIZES, ORG_TYPES, enumValues } from '~/data/taxonomy';
import { opportunityTypeSchema } from './opportunity.schema';

export const roleSchema = z.enum(['admin', 'member']);

export const ROLE_LABELS: Record<z.infer<typeof roleSchema>, string> = {
  admin: 'Admin',
  member: 'Member',
};

export const organizationSchema = z.object({
  id: z.string(),
  name: z.string(),
  slug: z.string(),
  logoUrl: z.string().optional(),
  country: z.string(),
  // Free strings: the backend's organization types / team sizes (see
  // `data/org-taxonomy.ts`) are the source of truth now.
  type: z.string(),
  size: z.string(),
  sectors: z.array(z.string()),
  regions: z.array(z.string()),
  opportunityTypes: z.array(opportunityTypeSchema),
  createdAt: z.string(),
  createdBy: z.string(),
  /** A job seeker's own workspace (jobs, their CV, no team). */
  isCandidate: z.boolean().optional(),
});

export const myOrgSchema = z.object({
  org: organizationSchema,
  role: roleSchema,
});

/**
 * Logos are stored inline as data URLs. 512 KB of image is ~700k base64 chars;
 * the UI enforces the byte limit, this keeps the API from accepting more.
 */
export const LOGO_MAX_CHARS = 700_000;
const logoUrlSchema = z
  .string()
  .max(LOGO_MAX_CHARS, 'Logo is too large (max 512 KB)');

/** Editable org fields — shared by onboarding and Settings › General. */
export const orgProfileSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, 'Organization name is required')
    .max(80, 'Keep the name under 80 characters'),
  logoUrl: logoUrlSchema.optional(),
  country: z.string().min(1, 'Choose a country'),
  type: z.enum(enumValues(ORG_TYPES), {
    error: 'Choose an organization type',
  }),
  size: z.enum(enumValues(ORG_SIZES), { error: 'Choose a size' }),
  sectors: z.array(z.string()).min(1, 'Pick at least one sector'),
  regions: z.array(z.string()).min(1, 'Pick at least one region'),
  opportunityTypes: z
    .array(opportunityTypeSchema)
    .min(1, 'Pick at least one opportunity type'),
});

export const updateOrgSchema = orgProfileSchema.partial().extend({
  /** `null` clears the logo (`undefined` would mean "leave it alone"). */
  logoUrl: logoUrlSchema.nullable().optional(),
});

/** Onboarding form = profile + optional batch of invites. Also the `POST /orgs` body. */
export const onboardingSchema = orgProfileSchema.extend({
  inviteEmails: z
    .array(z.email('Enter valid email addresses'))
    .max(20, 'Invite up to 20 people at once'),
  inviteRole: z.enum(['admin', 'member']),
});

export const orgProfileResolver = zodResolver(orgProfileSchema);
export const onboardingResolver = zodResolver(onboardingSchema);

export type Role = z.infer<typeof roleSchema>;
export type Organization = z.infer<typeof organizationSchema>;
export type MyOrg = z.infer<typeof myOrgSchema>;
export type OrgProfileInput = z.infer<typeof orgProfileSchema>;
export type UpdateOrgInput = z.infer<typeof updateOrgSchema>;
export type OnboardingInput = z.infer<typeof onboardingSchema>;
