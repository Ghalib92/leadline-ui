import { createContext, useContext, type ReactNode } from 'react';
import type {
  Organization,
  OrgView,
  PreferencesView,
  Role,
} from '~/lib/schema';
import { useAuth } from '~/lib/auth/use-auth';
import { can, type Action, type CanContext } from './can';

interface OrgContextValue {
  org: Organization;
  role: Role;
  /** The backend-contract view (full profile, archive state, my role). */
  view: OrgView;
  preferences: PreferencesView;
}

const OrgContext = createContext<OrgContextValue | null>(null);

export function OrgProvider({
  value,
  children,
}: Readonly<{ value: OrgContextValue; children: ReactNode }>) {
  return <OrgContext.Provider value={value}>{children}</OrgContext.Provider>;
}

/** The current org + your role in it. Only valid under `/o/:slug`. */
export function useOrg() {
  const ctx = useContext(OrgContext);
  const { user } = useAuth();
  if (!ctx) throw new Error('useOrg() must be used inside an /o/:slug route');
  return {
    ...ctx,
    can: (action: Action, extra: CanContext = {}) =>
      can(ctx.role, action, { userId: user?.id, ...extra }),
  };
}
