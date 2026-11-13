/**
 * Resource routes skip React Router's built-in CSRF origin check, so they do
 * it themselves: a cross-site form POST must not be able to act as the victim
 * (or sign them into the attacker's account). Non-browser clients send
 * neither header.
 */
export function isCrossSite(request: Request): boolean {
  if (request.headers.get('Sec-Fetch-Site') === 'cross-site') return true;
  const origin = request.headers.get('Origin');
  if (!origin) return false;
  try {
    return new URL(origin).host !== new URL(request.url).host;
  } catch {
    return true;
  }
}
