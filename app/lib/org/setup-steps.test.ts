import { describe, expect, it } from 'vitest';
import { stepHref } from './setup-steps';

describe('setup checklist links', () => {
  it("opens each goal's brief on the Workers page", () => {
    expect(stepHref('client_brief')).toBe(
      '/agents?tab=clients&edit=client_brief'
    );
    expect(stepHref('tender_brief')).toBe(
      '/agents?tab=tenders&edit=tender_brief'
    );
    expect(stepHref('preferences')).toBe(
      '/agents?tab=preferences&edit=preferences'
    );
  });
});

describe("a job seeker's checklist links", () => {
  it('all open Profile & CV', () => {
    expect(stepHref('cv')).toBe('/settings/general?tab=cv');
    expect(stepHref('job_brief')).toBe('/settings/general?edit=job_brief');
    expect(stepHref('basics')).toBe('/settings/general?edit=basics');
  });
});
