import { describe, expect, it } from 'vitest';
import { optionalWebLink, webLink, withScheme } from './web-link';

describe('links as people type them', () => {
  it('adds https:// to a bare web address', () => {
    expect(withScheme('linkedin.com/in/amina')).toBe(
      'https://linkedin.com/in/amina'
    );
    expect(withScheme(' www.safaricom.co.ke/careers ')).toBe(
      'https://www.safaricom.co.ke/careers'
    );
    expect(withScheme('http://example.org')).toBe('http://example.org');
    expect(withScheme('')).toBe('');
    expect(withScheme('not a link')).toBe('not a link');
  });

  it('accepts a profile link without https and keeps blanks blank', () => {
    const field = optionalWebLink('Enter a link');
    expect(field.parse('linkedin.com/in/amina')).toBe(
      'https://linkedin.com/in/amina'
    );
    expect(field.parse('  ')).toBe('');
    expect(field.safeParse('not a link').success).toBe(false);
    expect(webLink('Enter a link').safeParse('').success).toBe(false);
  });
});
