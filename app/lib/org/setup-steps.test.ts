import { describe, expect, it } from 'vitest';
import { stepHref } from './setup-steps';

describe('stepHref', () => {
  it('opens the settings sheet that completes each backend step', () => {
    expect(stepHref('basics')).toBe('/settings/general?edit=basics');
    expect(stepHref('focus')).toBe('/settings/general?edit=focus');
    expect(stepHref('preferences')).toBe(
      '/agents?tab=preferences&edit=preferences'
    );
    expect(stepHref('documents')).toBe(
      '/settings/general?tab=documents&edit=upload'
    );
    expect(stepHref('links')).toBe('/settings/general?tab=links&edit=link');
    expect(stepHref('team')).toBe('/team');
  });
  it('falls back to settings for steps the backend adds later', () => {
    expect(stepHref('something-new')).toBe('/settings/general');
  });
});
