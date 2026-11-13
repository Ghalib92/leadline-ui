import { describe, expect, it } from 'vitest';
import { matchScore } from './command-menu';

describe('command menu matching', () => {
  it('matches what the name contains, not scattered letters', () => {
    expect(matchScore('East Africa grants', 'east')).toBe(1);
    expect(matchScore('Search history', 'east')).toBe(0);
  });

  it('ranks a name that starts with the search above one that contains it', () => {
    expect(matchScore('Team', 'tea')).toBeGreaterThan(
      matchScore('Search settings', 'set')
    );
  });

  it('falls back to keywords', () => {
    expect(matchScore('Deadlines', 'calendar', ['calendar'])).toBe(0.5);
  });
});
