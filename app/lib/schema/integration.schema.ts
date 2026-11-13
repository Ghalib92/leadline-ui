import { z } from 'zod';

export const integrationIdSchema = z.enum([
  'slack',
  'microsoft-teams',
  'email-digest',
  'google-drive',
  'notion',
  'hubspot',
  'salesforce',
  'google-calendar',
  'zapier',
]);

export const integrationCategorySchema = z.enum([
  'notify',
  'storage',
  'crm',
  'calendar',
  'automation',
]);

export const integrationSchema = z.object({
  id: integrationIdSchema,
  name: z.string(),
  description: z.string(),
  category: integrationCategorySchema,
  /** `none` = one-click enable (e.g. the built-in email digest). */
  authType: z.enum(['api_key', 'oauth', 'none']),
  /** What connecting lets Leadline do — shown before the user connects. */
  features: z.array(z.string()).min(1),
});

export type IntegrationId = z.infer<typeof integrationIdSchema>;
export type Integration = z.infer<typeof integrationSchema>;
export type IntegrationCategory = z.infer<typeof integrationCategorySchema>;
