import { describe, expect, it } from 'vitest';
import {
  budgetRanges,
  documentCategories,
  eligibilityOptions,
  geographicScopes,
  languageOptions,
  linkKinds,
  opportunityKinds,
  organizationTypes,
  sdgOptions,
  targetRegions,
  teamSizes,
  countryOptions,
  toFeedTypes,
  toLegacyRegions,
} from './org-taxonomy';

describe('backend vocabularies', () => {
  it('match the backend choice lists', () => {
    expect(organizationTypes).toHaveLength(13);
    expect(teamSizes).toHaveLength(6);
    expect(budgetRanges).toHaveLength(6);
    expect(opportunityKinds).toHaveLength(16);
    expect(geographicScopes).toHaveLength(4);
    expect(targetRegions).toHaveLength(15);
    expect(eligibilityOptions).toHaveLength(11);
    expect(linkKinds).toHaveLength(10);
    expect(documentCategories).toHaveLength(11);
    expect(sdgOptions).toHaveLength(17);
    expect(organizationTypes).toContainEqual({
      value: 'corporate',
      label: 'Large company',
    });
    expect(teamSizes.map((s) => s.value)).toContain('1000+');
  });

  it('lists every country with a readable name', () => {
    const countries = countryOptions();
    expect(countries.length).toBeGreaterThanOrEqual(240);
    expect(countries).toContainEqual({ value: 'KE', label: 'Kenya' });
    expect(countries.every((c) => /^[A-Z]{2}$/.test(c.value))).toBe(true);
  });

  it('has common languages', () => {
    expect(languageOptions).toContainEqual({ value: 'sw', label: 'Swahili' });
  });
});

describe('bridges to the legacy UI vocabulary', () => {
  it('maps opportunity kinds onto the four feed types', () => {
    expect(toFeedTypes(['rfp', 'grant', 'award', 'other'])).toEqual([
      'tender',
      'grant',
      'event',
    ]);
    expect(toFeedTypes(['fellowship', 'loan'])).toEqual(['grant']);
  });

  it('maps regions onto the legacy vocabulary', () => {
    expect(
      toLegacyRegions(['sub_saharan_africa', 'europe', 'east_africa', 'africa'])
    ).toEqual(['pan-africa', 'east-africa']);
  });
});
