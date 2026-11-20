import { describe, expect, it } from 'vitest';
import { navFor } from './dashboard-sidebar';

const labels = (groups: ReturnType<typeof navFor>) =>
  groups.map((g) => [g.heading, g.items.map((i) => i.label)]);

describe('the sidebar', () => {
  it('speaks to a job seeker about jobs, in the order they work', () => {
    expect(labels(navFor('amina', true))).toEqual([
      ['', ['Home']],
      ['Find jobs', ['Job searches', 'Jobs found', 'Search history']],
      ['Apply', ['Applications', 'Deadlines']],
      ['You', ['Profile & CV']],
    ]);
  });

  it('shows a business only what fits what it looks for', () => {
    const items = navFor('acme', false, ['clients', 'tenders']).flatMap((g) =>
      g.items.map((i) => i.label)
    );
    expect(items).toContain('Call list');
    expect(items).not.toContain('Funder emails');
    expect(items).toContain('Team');

    const grants = navFor('ngo', false, ['grants']).flatMap((g) =>
      g.items.map((i) => i.label)
    );
    expect(grants).toContain('Funder emails');
    expect(grants).not.toContain('Call list');
  });
});
