import { describe, expect, it } from 'vitest';
import { documentDtoSchema, dossierDtoSchema } from './index';

const documentDto = {
  id: 'doc-1',
  title: 'Annual report',
  description: '',
  category: 'annual_report',
  original_filename: 'report.pdf',
  content_type: 'application/pdf',
  size: 10,
  processing_status: 'failed',
  processing_error: 'The .pdf file could not be read.',
  processed_at: null,
  uploaded_by: null,
  download_url: '/x',
  created_at: '2026-10-07T08:00:00Z',
};

describe('document processing fields', () => {
  it('maps status, error and time', () => {
    expect(documentDtoSchema.parse(documentDto)).toMatchObject({
      processingStatus: 'failed',
      processingError: 'The .pdf file could not be read.',
      processedAt: null,
    });
  });

  it('reads an unknown status as pending and tolerates older payloads', () => {
    const { processing_error: _e, processed_at: _p, ...older } = documentDto;
    expect(
      documentDtoSchema.parse({ ...older, processing_status: 'ocr_queued' })
    ).toMatchObject({
      processingStatus: 'pending',
      processingError: '',
      processedAt: null,
    });
  });
});

describe('dossier', () => {
  it('maps the backend payload, filling missing lists', () => {
    const parsed = dossierDtoSchema.parse({
      status: 'ready',
      content: { summary: 'A Kenyan NGO.', track_record: ['12,000 patients'] },
      version: 3,
      generated_at: '2026-10-07T08:00:00Z',
      error: '',
      prompt_id: 'dossier/v1',
      model: 'openai/gpt-oss-120b',
    });
    expect(parsed).toMatchObject({
      status: 'ready',
      version: 3,
      generatedAt: '2026-10-07T08:00:00Z',
      promptId: 'dossier/v1',
      content: {
        summary: 'A Kenyan NGO.',
        trackRecord: ['12,000 patients'],
        pastFunders: [],
        gaps: [],
      },
    });
  });

  it('has no content before the first generation', () => {
    expect(
      dossierDtoSchema.parse({
        status: 'pending',
        content: null,
        version: 0,
        generated_at: null,
        error: '',
        prompt_id: '',
        model: '',
      }).content
    ).toBeNull();
  });
});
