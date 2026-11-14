import { describe, expect, it } from 'vitest';
import type { GoalOption } from '~/lib/schema';
import { defaultGoal, goalItems, goalsFor } from './goals';

const option = (value: GoalOption['value'], available = true): GoalOption => ({
  value,
  label: value,
  description: `Finds ${value}`,
  opportunityTypes: [],
  sources: [],
  available,
});
const all = [option('clients', false), option('tenders'), option('grants')];

describe('worker goals', () => {
  it('offers the goals the organization picked', () => {
    expect(goalsFor(all, ['clients', 'tenders']).map((g) => g.value)).toEqual([
      'clients',
      'tenders',
    ]);
  });

  it('offers every goal when the organization picked none', () => {
    expect(goalsFor(all, [])).toHaveLength(3);
  });

  it("keeps a worker's goal the organization has since dropped", () => {
    expect(goalsFor(all, ['tenders'], 'grants').map((g) => g.value)).toEqual([
      'tenders',
      'grants',
    ]);
  });

  it('starts a new worker on the first goal that can run', () => {
    expect(defaultGoal(goalsFor(all, ['clients', 'tenders']))).toBe('tenders');
    expect(defaultGoal([option('clients', false)])).toBe('clients');
    expect(defaultGoal([])).toBe('grants');
  });

  it('says when searching for a goal is not available yet', () => {
    const [clients, tenders] = goalItems(all);
    expect(clients.description).toBe(
      'Finds clients. Searching arrives in the next update.'
    );
    expect(tenders.description).toBe('Finds tenders');
  });
});
