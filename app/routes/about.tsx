import { Link } from 'react-router';
import { generateSEOTags } from '~/lib/utils/seo';
import { Button } from '~/components/ui/button';

export function meta() {
  return generateSEOTags({
    title: 'About Leadline',
    description:
      'Why we built Leadline: so organizations spend time winning opportunities, not searching for them.',
    url: '/about',
    keywords: 'about Leadline, opportunity discovery, AI agents',
  });
}

export default function AboutPage() {
  return (
    <div className="container mx-auto max-w-3xl px-6 py-20">
      <h1 className="text-4xl font-bold tracking-tight">
        Opportunities shouldn’t depend on who has time to search.
      </h1>
      <div className="mt-8 space-y-5 text-lg text-muted-foreground">
        <p>
          Across Africa, NGOs, startups and small firms miss grants and tenders
          they would have won — not because they weren’t qualified, but because
          nobody saw the call in time. Funding and procurement notices are
          scattered across hundreds of sites, newsletters and portals.
        </p>
        <p>
          Leadline gives every organization a team of AI agents that read those
          sources continuously, match what they find against the organization’s
          profile, and explain why each result fits.
        </p>
        <p>
          The people doing the work get their hours back for what matters:
          writing strong applications, building partnerships, and delivering.
        </p>
      </div>
      <Button asChild size="lg" className="mt-10">
        <Link to="/auth/register">Start with Leadline</Link>
      </Button>
    </div>
  );
}
