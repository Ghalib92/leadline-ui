import { describe, expect, it, vi } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router';
import { http, HttpResponse } from 'msw';
import { server } from '~/test/msw';
import folders from '~/lib/schema/__fixtures__/backend/folders.json';
import documents from '~/lib/schema/__fixtures__/backend/documents.json';
import { apiClient } from '~/lib/api/client';
import { DocumentsTab } from './documents-tab';

const ORG = 'Kq7vB2mXp9Lt';
const FOLDER = folders[0].id;
vi.mock('~/lib/org/org-context', () => ({
  useOrg: () => ({
    view: { id: 'Kq7vB2mXp9Lt', myRole: 'admin', isArchived: false },
  }),
}));

function renderUpload() {
  const client = new QueryClient({
    defaultOptions: { queries: { retry: false } },
  });
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={[`/?tab=documents&folder=${FOLDER}`]}>
        <DocumentsTab editing="upload" setEditing={() => {}} />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

describe('uploading documents', () => {
  it('uploads several files at once, each titled by its name', async () => {
    const sent: { title: string; file: string; category: string }[] = [];
    server.use(
      http.get(`*/api/organizations/${ORG}/folders`, () =>
        HttpResponse.json(folders)
      ),
      http.get(`*/api/organizations/${ORG}/documents`, () =>
        HttpResponse.json(documents)
      )
    );
    const post = vi
      .spyOn(apiClient, 'post')
      .mockImplementation(async (_url, body) => {
        const form = body as FormData;
        sent.push({
          title: String(form.get('title')),
          file: (form.get('file') as File).name,
          category: String(form.get('category')),
        });
        return { data: documents.results[0] };
      });
    renderUpload();
    const user = userEvent.setup();
    // The sheet opens again once the folders load: use that one.
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent('Past proposals')
    );
    const dialog = screen.getByRole('dialog');
    const input = dialog.querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [
          new File(['%PDF'], 'KRA tax compliance.pdf', {
            type: 'application/pdf',
          }),
          new File(['%PDF'], 'CR12_2026.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    expect(
      await screen.findByText('KRA tax compliance.pdf')
    ).toBeInTheDocument();
    expect(screen.queryByLabelText(/^Title/)).toBeNull();
    await user.click(screen.getByRole('button', { name: 'Upload 2 files' }));
    await waitFor(() => expect(sent).toHaveLength(2));
    expect(sent.map((s) => s.file)).toEqual([
      'KRA tax compliance.pdf',
      'CR12_2026.pdf',
    ]);
    expect(sent[0].title).toMatch(/KRA tax compliance/i);
    post.mockRestore();
  });

  it('keeps only the files that failed, to try again', async () => {
    server.use(
      http.get(`*/api/organizations/${ORG}/folders`, () =>
        HttpResponse.json(folders)
      ),
      http.get(`*/api/organizations/${ORG}/documents`, () =>
        HttpResponse.json(documents)
      )
    );
    const post = vi
      .spyOn(apiClient, 'post')
      .mockImplementation(async (_url, body) => {
        const name = ((body as FormData).get('file') as File).name;
        if (name === 'broken.pdf') throw new Error('Upload failed');
        return { data: documents.results[0] };
      });
    renderUpload();
    await waitFor(() =>
      expect(screen.getByRole('dialog')).toHaveTextContent('Past proposals')
    );
    const input = screen
      .getByRole('dialog')
      .querySelector('input[type=file]') as HTMLInputElement;
    fireEvent.change(input, {
      target: {
        files: [
          new File(['%PDF'], 'good.pdf', { type: 'application/pdf' }),
          new File(['%PDF'], 'broken.pdf', { type: 'application/pdf' }),
        ],
      },
    });
    const user = userEvent.setup();
    await user.click(
      await screen.findByRole('button', { name: 'Upload 2 files' })
    );
    await waitFor(() => expect(screen.queryByText('good.pdf')).toBeNull());
    expect(screen.getByText('broken.pdf')).toBeInTheDocument();
    post.mockRestore();
  });
});
