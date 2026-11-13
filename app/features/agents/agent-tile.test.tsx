import { describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes } from 'react-router';
import { AgentTile } from './agent-tile';
import type { Agent } from '~/lib/schema';

const sampleAgent: Agent = {
  id: 'agent-1',
  orgId: 'org-1',
  name: 'Education Grants Scout',
  opportunityTypes: ['grant'],
  keywords: [],
  sources: [],
  folders: [],
  links: [],
  depth: '',
  schedule: 'daily',
  enabled: true,
  ownerId: 'user-1',
  lastRunAt: '2026-10-14T10:00:00Z',
  lastRunFound: 2,
  lastRunId: 'run-xyz',
  lastRunStatus: 'succeeded',
  createdAt: '2026-10-01T10:00:00Z',
  canManage: true,
};

function renderTile(agent: Agent = sampleAgent, onRun = vi.fn()) {
  render(
    <MemoryRouter initialEntries={['/o/acme/agents']}>
      <Routes>
        <Route
          path="/o/:slug/agents"
          element={
            <ul>
              <AgentTile
                agent={agent}
                canManage
                running={false}
                onRun={onRun}
                onToggle={vi.fn()}
              />
            </ul>
          }
        />
      </Routes>
    </MemoryRouter>
  );
  return onRun;
}

describe('AgentTile', () => {
  it('links to the automation page and shows its last run', () => {
    renderTile();
    expect(
      screen.getByRole('link', { name: /Education Grants Scout/ })
    ).toHaveAttribute('href', '/o/acme/agents/agent-1');
    expect(screen.getByText(/2 found/)).toBeInTheDocument();
  });

  it('runs it from the list', async () => {
    const onRun = renderTile();
    await userEvent.click(screen.getByRole('button', { name: /run now/i }));
    expect(onRun).toHaveBeenCalled();
  });

  it('cannot run an automation that is switched off', () => {
    renderTile({ ...sampleAgent, enabled: false });
    expect(screen.getByRole('button', { name: /run now/i })).toBeDisabled();
  });
});
