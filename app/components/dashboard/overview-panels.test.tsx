import { describe, expect, it } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AttentionList } from './overview-panels';

function renderAt(ui: React.ReactNode) {
  return render(
    <MemoryRouter initialEntries={['/o/acme']}>
      <Routes>
        <Route path="/o/:slug" element={ui} />
      </Routes>
    </MemoryRouter>
  );
}

describe('AttentionList', () => {
  it('turns each item into one action with the right destination', () => {
    renderAt(
      <AttentionList
        items={[
          { kind: 'to_review', count: 1, target: '' },
          { kind: 'failed_runs', count: 2, target: 'run-9' },
        ]}
      />
    );
    expect(
      screen.getByRole('link', {
        name: /1 opportunity waiting for your review/,
      })
    ).toHaveAttribute('href', '/o/acme/opportunities?review=pending');
    expect(
      screen.getByRole('link', { name: /2 worker runs failed/ })
    ).toHaveAttribute('href', '/o/acme/runs/run-9');
  });

  it('says so when nothing needs doing', () => {
    renderAt(<AttentionList items={[]} />);
    expect(screen.getByText(/all caught up/)).toBeInTheDocument();
  });
});
