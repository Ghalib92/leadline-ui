/**
 * The two kinds of account: a business or organization (clients, tenders,
 * grants) and a job seeker. People pick one before they sign up; the choice
 * travels in `?as=` (readable words) and is remembered in this browser, so
 * setup opens on the right form even if they verify their email later.
 */
export type AccountKind = 'organization' | 'candidate';

const PARAM: Record<AccountKind, string> = {
  organization: 'business',
  candidate: 'job-seeker',
};

/** `?as=` value for a kind. */
export const kindParam = (kind: AccountKind) => PARAM[kind];

/** A kind from `?as=` (or the stored value); null for anything else. */
export function parseKind(
  value: string | null | undefined
): AccountKind | null {
  switch (value) {
    case 'business':
    case 'organization':
      return 'organization';
    case 'job-seeker':
    case 'candidate':
      return 'candidate';
    default:
      return null;
  }
}

const KEY = 'leadline:signup';

export interface SignupChoice {
  kind: AccountKind;
  /** The business name typed at sign-up, to prefill setup. */
  name?: string;
}

export function rememberSignup(choice: SignupChoice) {
  try {
    globalThis.localStorage?.setItem(KEY, JSON.stringify(choice));
  } catch {
    // storage blocked: setup asks again
  }
}

export function recallSignup(): SignupChoice | null {
  try {
    const raw = globalThis.localStorage?.getItem(KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as { kind?: string; name?: unknown };
    const kind = parseKind(parsed.kind);
    if (!kind) return null;
    return typeof parsed.name === 'string' && parsed.name
      ? { kind, name: parsed.name }
      : { kind };
  } catch {
    return null;
  }
}

export function forgetSignup() {
  try {
    globalThis.localStorage?.removeItem(KEY);
  } catch {
    // nothing to forget
  }
}

/** Where setup starts for a new account of this kind. */
export function onboardingPath(kind: AccountKind, name?: string) {
  const params = new URLSearchParams({ as: kindParam(kind) });
  if (name) params.set('name', name);
  return `/onboarding?${params}`;
}
