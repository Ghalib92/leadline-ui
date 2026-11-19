import { Link } from 'react-router';
import { generateSEOTags } from '~/lib/utils/seo';
import { organizationSchema, websiteSchema } from '~/lib/utils/structured-data';
import { useAuth } from '~/lib/auth/use-auth';
import { Button } from '~/components/ui/button';
import { Hero } from '~/components/marketing/hero';
import { HowItWorks } from '~/components/marketing/how-it-works';
import { OpportunityTypes } from '~/components/marketing/opportunity-types';
import { IntegrationsStrip } from '~/components/marketing/integrations-strip';
import { Faq } from '~/components/marketing/faq';

export function meta() {
  return generateSEOTags({
    title: 'Leadline | AI Agents That Find Clients, Tenders and Grants',
    description:
      'Leadline’s AI agents find businesses that need what you sell, tenders you can win and grants that fit, then write the pitch or the bid.',
    url: '/',
    keywords:
      'client leads, tenders, tenders.go.ke, bids, grants, sales prospecting, AI agents, Kenya, Africa',
    jsonLd: [organizationSchema(), websiteSchema()],
  });
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="overflow-hidden">
      <Hero />
      <HowItWorks />
      <OpportunityTypes />
      <IntegrationsStrip />
      <Faq />
      <section className="container mx-auto px-6 pb-24">
        <div className="relative overflow-hidden rounded-2xl bg-sidebar px-8 py-16 text-center text-sidebar-foreground">
          <div className="pointer-events-none absolute -top-24 left-1/2 h-64 w-[40rem] -translate-x-1/2 rounded-full bg-primary/40 blur-3xl" />
          <div className="pointer-events-none absolute -right-16 -bottom-24 h-56 w-56 rounded-full bg-gold/20 blur-3xl" />
          <h2 className="relative text-3xl font-bold tracking-tight">
            Your next client is already out there.
          </h2>
          <p className="relative mx-auto mt-3 max-w-xl text-sidebar-foreground/75">
            Set up your organization and let the agents do the searching.
          </p>
          <Button asChild size="lg" className="relative mt-8">
            <Link to={isAuthenticated ? '/app' : '/auth/register'}>
              {isAuthenticated ? 'Open your workspace' : 'Get started free'}
            </Link>
          </Button>
        </div>
      </section>
    </div>
  );
}
