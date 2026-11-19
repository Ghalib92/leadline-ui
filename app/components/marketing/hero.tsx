import { Link, useNavigate } from 'react-router';
import { ArrowRight, CalendarClock, Check, Sparkles } from 'lucide-react';
import { useAuth } from '~/lib/auth/use-auth';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { ProductPreview } from './product-preview';

/** The first word is repeated last, so the loop is seamless. */
const WORDS = ['client.', 'tender.', 'grant.', 'job.', 'client.'];

const PROMISES = [
  'Free to start',
  'Set up in five minutes',
  'Nothing is sent without you',
];

export function Hero() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  // Uncontrolled: the field only pre-fills the register URL, nothing is submitted.
  const start = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const email = String(
      new FormData(event.currentTarget).get('email') ?? ''
    ).trim();
    navigate(
      email
        ? `/auth/register?email=${encodeURIComponent(email)}`
        : '/auth/register'
    );
  };

  return (
    <section className="relative overflow-hidden border-b border-border">
      <div className="container mx-auto grid grid-cols-1 items-center gap-12 px-6 pt-12 pb-16 lg:grid-cols-[1.05fr_1fr] lg:gap-10 lg:pt-16 lg:pb-28">
        <div className="min-w-0 animate-fade-up">
          <Link
            to="/auth/register"
            className="group inline-flex items-center gap-2 rounded-full border border-border bg-card py-1 pr-3 pl-1 text-xs font-medium shadow-sm transition-colors hover:border-primary/40"
          >
            <span className="rounded-full bg-sidebar px-2 py-0.5 text-[11px] font-semibold text-sidebar-foreground">
              New
            </span>
            Job seekers: jobs that fit your CV
            <ArrowRight className="h-3.5 w-3.5 text-muted-foreground transition-transform group-hover:translate-x-0.5" />
          </Link>

          <h1 className="mt-6 text-[2.75rem] leading-[1.02] font-bold tracking-[-0.035em] sm:text-6xl lg:text-[4.25rem]">
            Find your next
            <span className="sr-only"> client, tender, grant or job.</span>
            <span
              aria-hidden="true"
              className="mt-1 block h-[1.08em] overflow-hidden"
            >
              <span className="animate-word-cycle flex flex-col text-primary">
                {WORDS.map((word, i) => (
                  <span key={i} className="h-[1.08em] leading-[1.08]">
                    {word}
                  </span>
                ))}
              </span>
            </span>
          </h1>

          <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
            Leadline’s AI workers search tender portals, business directories,
            grant databases and job boards for you. Every find is scored and
            explained, and once you approve one, the pitch, the bid or the
            application is written.
          </p>

          {isAuthenticated ? (
            <Button
              size="lg"
              className="mt-8 h-12 px-6"
              onClick={() => navigate('/app')}
            >
              Open your workspace <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            // Without JS the browser still lands on sign-up with the email.
            <form
              action="/auth/register"
              method="get"
              onSubmit={start}
              className="mt-8 flex max-w-lg flex-col gap-2 rounded-xl border border-border bg-card p-1.5 shadow-sm sm:flex-row"
            >
              <Input
                name="email"
                type="email"
                placeholder="you@company.co.ke"
                aria-label="Work email"
                className="h-11 border-0 bg-transparent shadow-none focus-visible:ring-0"
              />
              <Button type="submit" size="lg" className="h-11 px-5">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}

          <ul className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
            {PROMISES.map((promise) => (
              <li key={promise} className="flex items-center gap-1.5">
                <span className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-primary-foreground">
                  <Check className="h-3 w-3" strokeWidth={3} />
                </span>
                {promise}
              </li>
            ))}
          </ul>
        </div>

        <div
          className="relative min-w-0 animate-fade-up"
          style={
            {
              '--delay': '0.12s',
              '--fade-up-distance': '24px',
            } as React.CSSProperties
          }
        >
          <ProductPreview />
          {/* Floating cards: what happens next, at a glance. */}
          <div
            className="animate-float absolute -top-4 right-2 hidden items-center gap-2 rounded-xl bg-gold px-3 py-2 text-sm font-semibold text-sidebar shadow-lg sm:flex lg:-right-4"
            style={{ '--delay': '1s' } as React.CSSProperties}
          >
            <CalendarClock className="h-4 w-4" />
            Tender closes in 3 days
          </div>
          <div className="animate-float absolute -bottom-20 -left-2 hidden w-72 rounded-xl border border-border bg-card p-3.5 shadow-xl sm:block lg:-left-8">
            <div className="flex items-center gap-2 text-xs font-semibold text-primary">
              <Sparkles className="h-3.5 w-3.5" />
              Pitch ready to send
            </div>
            <p className="mt-1.5 text-sm leading-snug text-foreground/80">
              “Your guests can’t book or pay online yet. We build booking sites
              with M-Pesa built in…”
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
