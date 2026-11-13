import { z } from 'zod';

/**
 * The company dossier (`GET /organizations/:id/dossier/`): the AI's structured
 * summary of the organization, written from its profile, preferences and
 * documents. Every agent reads it. Mirrors `apps/ai/schemas/dossier.py`.
 */

export const dossierStatuses = [
  'pending',
  'generating',
  'ready',
  'failed',
] as const;
export type DossierStatus = (typeof dossierStatuses)[number];

const list = z.array(z.string()).default([]);
const text = z.string().default('');

export const dossierContentSchema = z
  .object({
    summary: text,
    organization_type: text,
    mission: text,
    focus_areas: list,
    offerings: list,
    beneficiaries: list,
    geographies: list,
    track_record: list,
    past_funders: list,
    strengths: list,
    eligibility_facts: list,
    seeking: list,
    search_keywords: list,
    gaps: list,
  })
  .transform((dto) => ({
    summary: dto.summary,
    organizationType: dto.organization_type,
    mission: dto.mission,
    focusAreas: dto.focus_areas,
    offerings: dto.offerings,
    beneficiaries: dto.beneficiaries,
    geographies: dto.geographies,
    trackRecord: dto.track_record,
    pastFunders: dto.past_funders,
    strengths: dto.strengths,
    eligibilityFacts: dto.eligibility_facts,
    seeking: dto.seeking,
    searchKeywords: dto.search_keywords,
    gaps: dto.gaps,
  }));
export type DossierContent = z.infer<typeof dossierContentSchema>;

export const dossierDtoSchema = z
  .object({
    status: z.enum(dossierStatuses).catch('pending'),
    content: dossierContentSchema.nullable(),
    version: z.number(),
    generated_at: z.string().nullable(),
    error: text,
    prompt_id: text,
    model: text,
  })
  .transform((dto) => ({
    status: dto.status,
    content: dto.content,
    version: dto.version,
    generatedAt: dto.generated_at,
    error: dto.error,
    promptId: dto.prompt_id,
    model: dto.model,
  }));
export type Dossier = z.infer<typeof dossierDtoSchema>;
