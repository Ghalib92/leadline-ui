import { useEffect, useState } from 'react';
import { useParams } from 'react-router';
import { useMyOrgs } from '~/features/orgs';
import { readLastOrg } from './last-org';

/**
 * The org the dashboard chrome should reflect. Inside `/o/:slug` it's the URL;
 * on user-level pages (`/account`, `/invitations`) it's the last org you used,
 * else your first — so the sidebar keeps its org nav instead of collapsing.
 */
export function useActiveOrgSlug(): string | undefined {
  const { slug } = useParams();
  const { data: orgs = [] } = useMyOrgs();
  // localStorage is browser-only: read after mount so SSR and hydration match.
  const [lastSlug, setLastSlug] = useState<string | null>(null);
  useEffect(() => {
    if (!slug) setLastSlug(readLastOrg());
  }, [slug]);

  if (slug) return slug;
  const last = orgs.find((entry) => entry.org.slug === lastSlug);
  return (last ?? orgs[0])?.org.slug;
}
