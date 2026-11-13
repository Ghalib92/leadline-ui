const BASE = 'http://leadline.invalid';

/**
 * Only follow same-site paths from `?redirectTo=`. The target is resolved the
 * way a browser would (which strips tab/CR/LF, so "/\t/evil.com" becomes
 * "//evil.com"), and anything that leaves our origin falls back.
 */
export function safeRedirect(
  target: string | null | undefined,
  fallback = '/app'
): string {
  if (!target || !target.startsWith('/') || target.startsWith('//')) {
    return fallback;
  }
  const hasControlOrBackslash = [...target].some(
    (char) => char.charCodeAt(0) < 0x20 || char === '\\'
  );
  if (hasControlOrBackslash) return fallback;

  try {
    const url = new URL(target, BASE);
    if (url.origin !== BASE) return fallback;
    return `${url.pathname}${url.search}${url.hash}`;
  } catch {
    return fallback;
  }
}
