import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { jobBriefDtoSchema } from '~/lib/schema';
import { CvFindings, readLimitText } from './cv-findings';

const READ_AT = '2026-11-21T09:00:00+03:00';
const brief = (extra: Record<string, unknown> = {}) =>
  jobBriefDtoSchema.parse({
    target_roles: ['AI Engineer'],
    skills: ['Python', 'Django'],
    cv_suggestions: {
      document_title: 'CV',
      read_at: READ_AT,
      filled: [],
      target_roles: ['Backend Engineer'],
      skills: [],
    },
    cv_profile: {
      read_at: READ_AT,
      summary: 'AI and software engineer with three years of Python.',
      current_title: 'AI Engineer',
      current_employer: 'Digital Appex',
      years_experience: 3,
      skills: ['Python', 'Django', 'LangGraph', 'Temporal'],
      experience: [
        {
          title: 'AI Engineer',
          employer: 'Digital Appex',
          start: 'Jan 2024',
          end: 'Present',
          highlights: ['Built RAG pipelines'],
        },
      ],
      education: [
        { qualification: 'BSc Computer Science', institution: 'JKUAT' },
      ],
      languages: ['English', 'Swahili'],
    },
    cv_read: { blocked: '', reads_today: 1 },
    ...extra,
  });

function renderCard(data = brief(), onRead = vi.fn()) {
  render(
    <QueryClientProvider client={new QueryClient()}>
      <CvFindings
        orgId="Kq7vB2mXp9Lt"
        brief={data}
        canEdit
        reading={false}
        onRead={onRead}
      />
    </QueryClientProvider>
  );
}

describe('what reading the CV found', () => {
  it('shows everything: the current job, every job, all skills', () => {
    renderCard();
    expect(
      screen.getByText('AI Engineer at Digital Appex')
    ).toBeInTheDocument();
    expect(screen.getByText('Skills (4)')).toBeInTheDocument();
    expect(screen.getByText('Jobs on your CV (1)')).toBeInTheDocument();
    expect(screen.getByText('Built RAG pipelines')).toBeInTheDocument();
    expect(screen.getByText(/BSc Computer Science, JKUAT/)).toBeInTheDocument();
    // Skills not in the preferences yet can be added; listed ones are plain.
    expect(
      screen.getByRole('button', { name: 'Add LangGraph' })
    ).toBeInTheDocument();
    expect(screen.queryByRole('button', { name: 'Add Python' })).toBeNull();
    expect(
      screen.getByRole('button', { name: 'Add Backend Engineer' })
    ).toBeInTheDocument();
    expect(
      screen.getByRole('button', { name: 'Read my CV again' })
    ).toBeEnabled();
  });

  it('says when the CV can be read again', () => {
    const daily = brief({ cv_read: { blocked: 'daily', reads_per_day: 3 } });
    renderCard(daily);
    expect(
      screen.getByRole('button', { name: 'Read my CV again' })
    ).toBeDisabled();
    expect(
      screen.getByText('Read 3 times today. You can read it again tomorrow.')
    ).toBeInTheDocument();
    const cooldown = brief({
      cv_read: {
        blocked: 'cooldown',
        next_read_at: '2026-11-21T09:10:00+03:00',
      },
    });
    expect(readLimitText(cooldown.cvRead)).toMatch(
      /^You can read it again at .+ \(at most once every 10 minutes, 3 times a day\)\.$/
    );
  });
});
