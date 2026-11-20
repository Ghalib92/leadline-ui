import { describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import folders from '~/lib/schema/__fixtures__/backend/folders.json';
import documents from '~/lib/schema/__fixtures__/backend/documents.json';
import { CvTab } from './cv-tab';

const ORG = 'Kq7vB2mXp9Lt';
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    view: {
      id: 'Kq7vB2mXp9Lt',
      myRole: 'admin',
      isArchived: false,
      isCandidate: true,
    },
  }),
}));

const { uploadFile } = vi.hoisted(() => ({ uploadFile: vi.fn() }));
vi.mock('~/lib/api/transfer', () => ({ uploadFile, downloadFile: vi.fn() }));

const page = (results: unknown[]) => ({
  count: results.length,
  next: null,
  previous: null,
  results,
});
const oldCv = { ...documents.results[0], id: 'OldCv0000001', title: 'CV' };

function renderTab() {
  return render(
    <QueryClientProvider
      client={
        new QueryClient({ defaultOptions: { queries: { retry: false } } })
      }
    >
      <MemoryRouter>
        <CvTab />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe("a job seeker's CV", () => {
  it('is required, and nothing else is asked for', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/folders`, () =>
        HttpResponse.json(folders)
      ),
      http.get(`*/api/organizations/${ORG}/documents`, () =>
        HttpResponse.json(page([]))
      )
    );
    renderTab();
    expect(
      await screen.findByText(/can’t look for jobs until your CV is here/)
    ).toBeInTheDocument();
    expect(screen.getByLabelText('required')).toBeInTheDocument();
    // No company folders or categories.
    expect(screen.queryByText(/folder/i)).toBeNull();
    expect(screen.queryByText(/pitch deck|strategic plan/i)).toBeNull();
  });

  it('a new CV replaces the old one', async () => {
    const deleted: string[] = [];
    server.use(
      http.get(`*/api/organizations/${ORG}/folders`, () =>
        HttpResponse.json(folders)
      ),
      http.get(`*/api/organizations/${ORG}/documents`, () =>
        HttpResponse.json(page([oldCv]))
      ),
      http.delete(`*/api/organizations/${ORG}/documents/:id`, ({ params }) => {
        deleted.push(String(params.id));
        return new HttpResponse(null, { status: 204 });
      })
    );
    const sent: { category: string; title: string }[] = [];
    uploadFile.mockImplementation(async (_path: string, form: FormData) => {
      sent.push({
        category: String(form.get('category')),
        title: String(form.get('title')),
      });
      return { ...oldCv, id: 'NewCv0000001', processing_status: 'pending' };
    });
    const user = userEvent.setup();
    renderTab();
    await screen.findByText(oldCv.original_filename);
    await user.upload(
      screen.getByLabelText('Choose a new CV'),
      new File(['cv'], 'amina-cv.pdf', { type: 'application/pdf' })
    );
    await waitFor(() => expect(deleted).toEqual(['OldCv0000001']));
    expect(sent).toEqual([{ category: 'cv', title: 'CV' }]);
  });
});
