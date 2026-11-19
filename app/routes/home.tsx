import { Link } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { generateSEOTags } from '~/lib/utils/seo';
import { organizationSchema, websiteSchema } from '~/lib/utils/structured-data';
import { useAuth } from '~/lib/auth/use-auth';
import { Button } from '~/components/ui/button';
import { Hero } from '~/components/marketing/hero';
import { HowItWorks } from '~/components/marketing/how-it-works';
import { OpportunityTypes } from '~/components/marketing/opportunity-types';
import { SourcesMarquee } from '~/components/marketing/sources-marquee';
import { Trust } from '~/components/marketing/trust';
import { Faq } from '~/components/marketing/faq';

export function meta() {
  return generateSEOTags({
    title: 'Leadline | AI workers that find clients, tenders, grants and jobs',
    description:
      'Leadline’s AI workers find businesses that need what you sell, tenders you can win, grants that fit and jobs that fit your CV, then write the pitch, the bid or the application.',
    url: '/',
    keywords:
      'client leads, tenders, tenders.go.ke, bids, grants, jobs Kenya, cover letter, sales prospecting, AI agents, Kenya, Africa',
    jsonLd: [organizationSchema(), websiteSchema()],
  });
}

export default function HomePage() {
  const { isAuthenticated } = useAuth();
  return (
    <div className="overflow-hidden">
      <Hero />
      <SourcesMarquee />
      <HowItWorks />
      <OpportunityTypes />
      <Trust />
      <Faq />
      <section className="container mx-auto px-6 py-20">
        <div className="grid grid-cols-1 items-center gap-8 rounded-3xl bg-primary px-8 py-12 text-primary-foreground sm:px-12 lg:grid-cols-[1.4fr_1fr]">
          <div>
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Your next client, tender or job is already out there.
            </h2>
            <p className="mt-3 max-w-xl text-primary-foreground/80">
              Set up in five minutes and let the workers do the searching. You
              approve every step.
            </p>
          </div>
          <div className="flex flex-wrap gap-3 lg:justify-end">
            <Button
              asChild
              size="lg"
              className="h-12 bg-gold px-6 text-sidebar hover:bg-gold/90"
            >
              <Link to={isAuthenticated ? '/app' : '/auth/register'}>
                {isAuthenticated ? 'Open your workspace' : 'Get started free'}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            {!isAuthenticated && (
              <Button
                asChild
                size="lg"
                variant="ghost"
                className="h-12 px-6 text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
              >
                <Link to="/auth/login">Sign in</Link>
              </Button>
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
