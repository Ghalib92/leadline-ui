import { useNavigate } from 'react-router';
import { ArrowRight } from 'lucide-react';
import { useAuth } from '~/lib/auth/use-auth';
import { Button } from '~/components/ui/button';
import { Input } from '~/components/ui/input';
import { AgentCard } from './agent-card';

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
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute -top-32 left-1/2 h-80 w-[48rem] -translate-x-1/2 rounded-full bg-primary/20 blur-3xl"
      />
      <div className="container relative mx-auto grid items-center gap-12 px-6 py-20 lg:grid-cols-2 lg:py-28">
        <div className="animate-fade-up">
          <p className="mb-4 inline-flex rounded-full border border-border px-3 py-1 text-xs font-medium text-muted-foreground">
            AI agents for grants, tenders & partnerships
          </p>
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
            Stop searching.{' '}
            <span className="text-primary">Start pursuing.</span>
          </h1>
          <p className="mt-5 max-w-xl text-lg text-muted-foreground">
            Leadline’s agents scan funder sites, procurement portals and partner
            calls every day, then rank what they find against your organization
            — so your team spends its time applying, not hunting.
          </p>
          {isAuthenticated ? (
            <Button size="lg" className="mt-8" onClick={() => navigate('/app')}>
              Open your workspace <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            // Without JS the browser still lands on sign-up with the email.
            <form
              action="/auth/register"
              method="get"
              onSubmit={start}
              className="mt-8 flex max-w-md flex-col gap-2 sm:flex-row"
            >
              <Input
                name="email"
                type="email"
                placeholder="you@organization.org"
                aria-label="Work email"
                className="h-11"
              />
              <Button type="submit" size="lg" className="h-11">
                Start free <ArrowRight className="h-4 w-4" />
              </Button>
            </form>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            No card needed. Set up in under five minutes.
          </p>
        </div>
        <div
          className="flex animate-fade-up justify-center lg:justify-end"
          style={
            {
              '--delay': '0.15s',
              '--fade-up-distance': '24px',
            } as React.CSSProperties
          }
        >
          <AgentCard />
        </div>
      </div>
    </section>
  );
}
