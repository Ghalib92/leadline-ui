import { z } from 'zod';

/**
 * A link as people type it: "linkedin.com/in/amina" or "www.safaricom.co.ke/careers"
 * becomes "https://…". Text with a scheme, or that isn't a web address, is left for
 * the URL check to judge.
 */
export function withScheme(value: string): string {
  const text = value.trim();
  if (!text || /^[a-z][a-z\d+.-]*:\/\//i.test(text)) return text;
  return /^[^\s/]+\.[^\s/]{2,}(\/\S*)?$/.test(text) ? `https://${text}` : text;
}

/** A required link; `message` shows when it isn't one. */
export const webLink = (message: string) =>
  z.string().transform(withScheme).pipe(z.url(message).max(500));

/** A link, or nothing. */
export const optionalWebLink = (message: string) =>
  z
    .string()
    .transform(withScheme)
    .pipe(z.union([z.literal(''), z.url(message).max(500)]));
