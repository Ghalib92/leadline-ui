import { describe, expect, it } from 'vitest';
import { safeRedirect } from './safe-redirect';

describe('safeRedirect', () => {
  it('keeps same-site paths', () => {
    expect(safeRedirect('/o/kijani?tab=1')).toBe('/o/kijani?tab=1');
  });

  it('falls back for missing, absolute or protocol-relative targets', () => {
    expect(safeRedirect(null)).toBe('/app');
    expect(safeRedirect('https://evil.example')).toBe('/app');
    expect(safeRedirect('//evil.example')).toBe('/app');
    expect(safeRedirect('/\\evil.example')).toBe('/app');
    expect(safeRedirect('app', '/onboarding')).toBe('/onboarding');
  });

  it('rejects targets the URL parser would turn cross-origin', () => {
    // Browsers strip tab/CR/LF, so "/\t/evil.com" resolves to //evil.com.
    expect(safeRedirect('/\t/evil.example')).toBe('/app');
    expect(safeRedirect('/\n/evil.example')).toBe('/app');
    expect(safeRedirect('/\r\n/evil.example')).toBe('/app');
    expect(safeRedirect('/%2F/evil.example')).toBe('/%2F/evil.example');
  });

  it('keeps query and hash', () => {
    expect(safeRedirect('/invite/abc?x=1#top')).toBe('/invite/abc?x=1#top');
  });
});
