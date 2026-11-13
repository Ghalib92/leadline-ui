import { useEffect } from 'react';
import { useParams } from 'react-router';
import { Loader2 } from 'lucide-react';
import { generateSEOTags } from '~/lib/utils/seo';

export function meta() {
  return generateSEOTags({
    title: 'Join an Organization | Leadline',
    description: 'Accept your invitation to join an organization on Leadline.',
    url: '/invite',
    noIndex: true,
  });
}

/**
 * Older invite links (`/invite/:token`). Invitations now land on
 * `/invitations/accept#token=…` — the fragment keeps the token out of server
 * logs — so hop there in the browser.
 */
export default function LegacyInviteLink() {
  const { token = '' } = useParams();
  useEffect(() => {
    globalThis.location.replace(
      `/invitations/accept#token=${encodeURIComponent(token)}`
    );
  }, [token]);
  return (
    <Loader2
      className="mx-auto h-6 w-6 animate-spin text-primary"
      aria-label="Loading"
    />
  );
}
